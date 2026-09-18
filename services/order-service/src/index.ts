import { Router, Request, Response } from 'express';
import { Order, Shop, User, Item, Category, Offer, requireAuth, requireRole, AuthRequest, sendPushNotification, analyticsCache, log } from '@wow/shared';

// Helper: emit to a specific shop's room only (not all sockets)
const emitToShop = (req: Request, shopId: string, event: string, data: any) => {
  const io = req.app.get('io');
  if (io) {
    io.to(`shop:${shopId}`).emit(event, data);
    // NOTE: io.emit() (global broadcast) deliberately removed.
    // At 10k concurrent sockets, broadcasting every order update to all connections
    // causes unnecessary CPU/bandwidth load. Use targeted room emits only.
  }
};

// Helper: emit to a specific user's room
const emitToUser = (req: Request, userId: string, event: string, data: any) => {
  const io = req.app.get('io');
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

const router = Router();

// Create an order (Customer, or Branch Admin placing walk-in order)
router.post('/', requireAuth, requireRole(['Customer', 'SuperAdmin', 'ShopAdmin']), async (req: AuthRequest, res: Response) => {
  try {
    const {
      shopId, items, totalAmount, discountAmount, couponCode,
      couponDiscountPercent, couponMaxDiscount, couponMinOrderValue, taxAmount,
      deliveryFee, pickupAddress, deliveryAddress, pickupTime, washPreferences
    } = req.body;

    const userRole = (req.user?.role || '') as string;
    const isSpecialBranchUser = (req.user?.email || '').toLowerCase().trim() === 'wowlaundry111@gmail.com';
    const isStaffPlacing = userRole === 'SuperAdmin' || userRole === 'ShopAdmin' || isSpecialBranchUser;

    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);

    // Run shop lookup + dedup check + customer lookup in parallel (was 3 sequential round-trips)
    const [shop, existingRecentOrder, customer] = await Promise.all([
      Shop.findById(shopId).select('isOpen contactNumber promoCode taxPercent deliveryFee').lean() as Promise<any>,
      (!isStaffPlacing)
        ? Order.findOne({
            customerId: req.user!._id,
            shopId,
            status: 'PLACED',
            createdAt: { $gte: thirtySecondsAgo },
          }).sort({ createdAt: -1 })
        : Promise.resolve(null),
      User.findById(req.user!._id).select('name phone').lean() as Promise<any>,
    ]);

    if (shop && shop.isOpen === false) {
      return res.status(400).json({ error: 'This branch is currently closed. We are not accepting orders right now.' });
    }

    // Prevent accidental duplicate order submissions (e.g. client retries, slow network, or rapid double clicks)
    // Skipped for staff so counter admins can place multiple orders consecutively
    if (!isStaffPlacing && existingRecentOrder) {
      const isSameTotal = Number(existingRecentOrder.totalAmount) === Number(totalAmount);
      const isSameItemCount = existingRecentOrder.items?.length === (items || []).length;
      if (isSameTotal && isSameItemCount) {
        log.warn('Duplicate order submission blocked, returning existing order', {
          customerId: req.user!._id,
          orderId: existingRecentOrder._id,
        });
        return res.status(200).json(existingRecentOrder);
      }
    }

    // shopPhone: prefer shop contactNumber, fall back to ShopAdmin's phone (parallelized)
    let shopPhone = shop?.contactNumber || '';
    if (!shopPhone) {
      const adminUser = await User.findOne({ shopId, role: 'ShopAdmin' }).select('phone').lean() as any;
      shopPhone = adminUser?.phone || '';
    }

    // Stamp category breadcrumbs onto each order line item at creation time
    // so bills always have readable context regardless of future catalog changes.
    const itemIds = (items || []).map((i: any) => i.itemId);
    const catalogItems = await Item.find({ _id: { $in: itemIds } }).select('_id categoryId').lean() as any[];
    const categoryIds = [...new Set(catalogItems.map((ci: any) => ci.categoryId))];
    const catalogCategories = await Category.find({ _id: { $in: categoryIds } }).select('_id name parentCategoryId singleItemSelection').lean() as any[];

    // Fetch parent categories so singleItemSelection on parent categories is also enforced
    const parentCategoryIds = [...new Set(catalogCategories.map((c: any) => c.parentCategoryId).filter(Boolean))];
    const parentCategories = parentCategoryIds.length > 0
      ? await Category.find({ _id: { $in: parentCategoryIds } }).select('_id name singleItemSelection').lean() as any[]
      : [];

    // Build quick lookup maps
    const itemCategoryMap: Record<string, string> = {}; // itemId -> categoryId
    catalogItems.forEach((ci: any) => { itemCategoryMap[ci._id] = ci.categoryId; });
    const catNameMap: Record<string, any> = {}; // categoryId -> { name, parentCategoryId, singleItemSelection }
    parentCategories.forEach((c: any) => { catNameMap[c._id] = c; });
    catalogCategories.forEach((c: any) => { catNameMap[c._id] = c; });

    // Validate single item selection rule on both subcategory and parent category
    const subCatItemCounts: Record<string, Set<string>> = {};
    for (const item of items || []) {
      const catId = itemCategoryMap[item.itemId];
      const cat = catId ? catNameMap[catId] : null;
      const parentCat = (cat && cat.parentCategoryId) ? catNameMap[cat.parentCategoryId] : null;

      const restrictedCat = (cat && cat.singleItemSelection) ? cat : (parentCat && parentCat.singleItemSelection ? parentCat : null);
      if (restrictedCat) {
        const key = String(restrictedCat._id);
        if (!subCatItemCounts[key]) subCatItemCounts[key] = new Set();
        subCatItemCounts[key].add(item.itemId);
        if (subCatItemCounts[key].size > 1) {
          return res.status(400).json({
            error: `Only one item type can be selected from the "${restrictedCat.name}" category.`
          });
        }
      }
    }

    // Enrich items with breadcrumb names
    const enrichedItems = (items || []).map((item: any) => {
      const catId = itemCategoryMap[item.itemId];
      const cat = catId ? catNameMap[catId] : null;
      if (!cat) return item;

      if (cat.parentCategoryId && catNameMap[cat.parentCategoryId]) {
        // Item is in a sub-category
        return {
          ...item,
          categoryName: catNameMap[cat.parentCategoryId].name,
          subCategoryName: cat.name,
        };
      }
      // Item is in a top-level category
      return { ...item, categoryName: cat.name };
    });

    const reqCustName = (req.body.customerName || '').trim();
    const reqCustPhone = (req.body.customerPhone || '').trim();
    const reqCustAddress = (req.body.customerAddress || deliveryAddress || pickupAddress || '').trim();

    let resolvedCustomerId = String(req.user!._id);
    let resolvedCustomerName = isStaffPlacing
      ? (reqCustName || 'Walk-in Customer')
      : (customer?.name || reqCustName || (req.user as any)?.name || 'Customer');
    let resolvedCustomerPhone = isStaffPlacing
      ? reqCustPhone
      : (customer?.phone || reqCustPhone || (req.user as any)?.phone || '');

    // If staff placed order with customerPhone, check if user exists with this phone to link order to their account
    if (isStaffPlacing && reqCustPhone) {
      try {
        const existingCust = await User.findOne({ phone: reqCustPhone }).select('_id name').lean() as any;
        if (existingCust) {
          resolvedCustomerId = String(existingCust._id);
          if (!reqCustName && existingCust.name) {
            resolvedCustomerName = existingCust.name;
          }
        }
      } catch (e: any) {
        log.warn('Could not link customer by phone', { phone: reqCustPhone, error: e.message });
      }
    }

    const isWalkInPickup = req.body.isWalkIn === true ||
      (typeof reqCustAddress === 'string' && (
        reqCustAddress.toLowerCase().includes('walk-in') ||
        reqCustAddress.toLowerCase().includes('branch') ||
        reqCustAddress.toLowerCase().includes('in-store') ||
        reqCustAddress.toLowerCase().includes('counter')
      ));
    const effectiveDeliveryFee = isWalkInPickup ? 0 : (deliveryFee || 0);

    // Resolve coupon parameters if couponCode was applied
    let resolvedCouponDiscountPercent = Number(couponDiscountPercent) || 0;
    let resolvedCouponMaxDiscount = couponMaxDiscount !== undefined ? Number(couponMaxDiscount) : undefined;
    let resolvedCouponMinOrderValue = Number(couponMinOrderValue) || 0;

    if (couponCode && !resolvedCouponDiscountPercent) {
      try {
        if (shop?.promoCode?.code && shop.promoCode.code.toUpperCase() === String(couponCode).toUpperCase()) {
          resolvedCouponDiscountPercent = Number(shop.promoCode.discountPercent) || 0;
          resolvedCouponMaxDiscount = shop.promoCode.maxDiscount !== undefined ? Number(shop.promoCode.maxDiscount) : undefined;
          resolvedCouponMinOrderValue = Number(shop.promoCode.minOrderValue) || 0;
        } else {
          const offerDoc = await Offer.findOne({ shopId, code: String(couponCode).toUpperCase() }).lean() as any;
          if (offerDoc) {
            resolvedCouponDiscountPercent = Number(offerDoc.discountPercent) || 0;
            resolvedCouponMaxDiscount = offerDoc.maxDiscount !== undefined ? Number(offerDoc.maxDiscount) : undefined;
            resolvedCouponMinOrderValue = Number(offerDoc.minOrderValue) || 0;
          }
        }
      } catch (err: any) {
        log.warn('Could not lookup coupon details on order creation', { error: err.message, couponCode });
      }
    }

    const order = await Order.create({
      customerId: resolvedCustomerId,
      customerName: resolvedCustomerName,
      customerPhone: resolvedCustomerPhone,
      customerAddress: reqCustAddress,
      shopId,
      shopPhone,
      items: enrichedItems,
      washPreferences,
      totalAmount,
      discountAmount: Number(discountAmount) || 0,
      couponCode: couponCode ? String(couponCode).toUpperCase() : undefined,
      couponDiscountPercent: resolvedCouponDiscountPercent || undefined,
      couponMaxDiscount: resolvedCouponMaxDiscount,
      couponMinOrderValue: resolvedCouponMinOrderValue || undefined,
      taxAmount,
      deliveryFee: effectiveDeliveryFee,
      pickupAddress: reqCustAddress || pickupAddress,
      deliveryAddress: reqCustAddress || deliveryAddress,
      pickupTime,
      adminNotes: req.body.adminNotes || (isStaffPlacing ? `Branch Walk-in Order placed by ${(req.user as any)?.name || req.user?.email || 'Admin'}` : undefined),
      status: 'PLACED',
    });

    // Respond immediately — notifications fire in background
    res.status(201).json(order);
    
    // Emit to shop room only — avoids broadcasting to all 1k+ connected sockets
    emitToShop(req, order.shopId, 'order_created', order);
    emitToUser(req, String(order.customerId), 'order_created', order);
    if (String(order.customerId) !== String(req.user!._id)) {
      emitToUser(req, String(req.user!._id), 'order_created', order);
    }

    // Fire-and-forget: notify shop admins after response is sent
    setImmediate(async () => {
      try {
        const shopAdmins = await User.find({ shopId, role: 'ShopAdmin' })
          .select('expoPushToken')
          .lean() as any[];
        const adminTokens = shopAdmins.map((a: any) => a.expoPushToken).filter(Boolean) as string[];
        if (adminTokens.length > 0) {
          await sendPushNotification(
            adminTokens,
            'New Order Placed',
            `A new order of ₹${totalAmount} has been placed.`,
            { orderId: order._id }
          );
        }
      } catch (e: any) {
        log.error('Failed to send new-order notification', { error: e.message });
      }
    });
  } catch (err: any) {
    log.error('Failed to create order', { error: err.message });
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get orders — paginated, strictly role-scoped & tenant-partitioned
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 50);
    const skip = (page - 1) * limit;

    const query: Record<string, any> = { isArchived: { $ne: true } };

    if (user.role === 'Customer') {
      query.customerId = user._id;
    } else if (user.role === 'ShopAdmin') {
      const targetShopId = (req.query.shopId as string) || user.shopId;
      if (targetShopId) {
        query.shopId = targetShopId;
      } else {
        // Fallback check user's shop in DB
        const dbUser = await User.findById(user._id).select('shopId').lean() as any;
        if (dbUser?.shopId) query.shopId = dbUser.shopId;
      }
    } else if (user.role === 'Delivery') {
      const targetShopId = (req.query.shopId as string) || user.shopId;
      if (targetShopId) {
        query.$or = [{ deliveryBoyId: user._id }, { shopId: targetShopId }];
      } else {
        const dbUser = await User.findById(user._id).select('shopId').lean() as any;
        if (dbUser?.shopId) {
          query.$or = [{ deliveryBoyId: user._id }, { shopId: dbUser.shopId }];
        } else {
          query.deliveryBoyId = user._id;
        }
      }
    } else if (user.role === 'Operator') {
      const targetShopId = (req.query.shopId as string) || user.shopId;
      if (targetShopId) {
        query.shopId = targetShopId;
      } else {
        const dbUser = await User.findById(user._id).select('shopId').lean() as any;
        if (dbUser?.shopId) query.shopId = dbUser.shopId;
      }
    } else if (user.role === 'SuperAdmin') {
      if (req.query.shopId) {
        query.shopId = req.query.shopId;
      }
    }

    // Optional status filter
    if (req.query.status) query.status = req.query.status;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Skip expensive countDocuments when we can infer total from results
    // (page 1 with fewer results than limit means we have all records)
    let total: number;
    if (page === 1 && orders.length < limit) {
      total = orders.length;
    } else {
      total = await Order.countDocuments(query);
    }

    // Enrich missing shopPhone, deliveryBoyPhone, or customerPhone for older orders
    const missingShopIds = [...new Set(orders.filter((o: any) => !o.shopPhone && o.shopId).map((o: any) => o.shopId))];
    const missingDeliveryBoyIds = [...new Set(orders.filter((o: any) => !o.deliveryBoyPhone && o.deliveryBoyId).map((o: any) => o.deliveryBoyId))];
    const missingCustomerIds = [...new Set(orders.filter((o: any) => (!o.customerPhone || o.customerPhone === 'N/A' || !o.customerName || o.customerName === 'Unknown Customer') && o.customerId).map((o: any) => o.customerId))];

    const [shops, deliveryUsers, customerUsers] = await Promise.all([
      missingShopIds.length > 0 ? Shop.find({ _id: { $in: missingShopIds } }).select('_id contactNumber').lean() as Promise<any[]> : Promise.resolve([]),
      missingDeliveryBoyIds.length > 0 ? User.find({ _id: { $in: missingDeliveryBoyIds } }).select('_id phone').lean() as Promise<any[]> : Promise.resolve([]),
      missingCustomerIds.length > 0 ? User.find({ _id: { $in: missingCustomerIds } }).select('_id phone name').lean() as Promise<any[]> : Promise.resolve([]),
    ]);

    const shopPhoneMap: Record<string, string> = {};
    shops.forEach((s: any) => { if (s.contactNumber) shopPhoneMap[s._id] = s.contactNumber; });

    const deliveryPhoneMap: Record<string, string> = {};
    deliveryUsers.forEach((u: any) => { if (u.phone) deliveryPhoneMap[u._id] = u.phone; });

    const customerMap: Record<string, { phone?: string; name?: string }> = {};
    customerUsers.forEach((c: any) => { customerMap[c._id] = { phone: c.phone, name: c.name }; });

    const enrichedOrders = orders.map((o: any) => ({
      ...o,
      customerName: (o.customerName && o.customerName !== 'Unknown Customer') ? o.customerName : (customerMap[o.customerId]?.name || o.customerName || 'Customer'),
      customerPhone: (o.customerPhone && o.customerPhone !== 'N/A') ? o.customerPhone : (customerMap[o.customerId]?.phone || o.customerPhone || ''),
      shopPhone: o.shopPhone || shopPhoneMap[o.shopId] || '',
      deliveryBoyPhone: o.deliveryBoyPhone || (o.deliveryBoyId ? deliveryPhoneMap[o.deliveryBoyId] : '') || '',
    }));

    res.json({ orders: enrichedOrders, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Analytics Aggregation Endpoint (Admin/SuperAdmin)
router.get('/analytics', requireAuth, requireRole(['SuperAdmin', 'ShopAdmin']), async (req: AuthRequest, res: Response) => {
  try {
    const { range, shopId, startDate, endDate } = req.query;
    const matchQuery: Record<string, any> = { isArchived: { $ne: true } };

    if (req.user!.role === 'ShopAdmin') {
      const targetShopId = (req.query.shopId as string) || req.user!.shopId;
      if (targetShopId) matchQuery.shopId = targetShopId;
    } else if (req.query.shopId) {
      matchQuery.shopId = req.query.shopId;
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (range === 'today') {
      matchQuery.createdAt = { $gte: todayStart };
    } else if (range === 'yesterday') {
      const yestStart = new Date(todayStart);
      yestStart.setDate(yestStart.getDate() - 1);
      matchQuery.createdAt = { $gte: yestStart, $lt: todayStart };
    } else if (range === '7days') {
      const d7 = new Date(now);
      d7.setDate(d7.getDate() - 7);
      matchQuery.createdAt = { $gte: d7 };
    } else if (range === '30days') {
      const d30 = new Date(now);
      d30.setDate(d30.getDate() - 30);
      matchQuery.createdAt = { $gte: d30 };
    } else if (range === 'this_month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      matchQuery.createdAt = { $gte: monthStart };
    } else if (range === 'custom' && (startDate || endDate)) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate as string);
      if (endDate) matchQuery.createdAt.$lte = new Date(`${endDate}T23:59:59`);
    }

    // Cache analytics per shop+range for 60 seconds — prevents repeated aggregation scans
    const cacheKey = `analytics:${matchQuery.shopId || 'all'}:${range || 'custom'}:${(startDate as string) || ''}:${(endDate as string) || ''}`;
    const cached = await analyticsCache.get(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    const [result] = await Order.aggregate([
      { $match: matchQuery },
      {
        $facet: {
          kpis: [
            {
              $group: {
                _id: null,
                totalRevenue: {
                  $sum: { $cond: [{ $ne: ['$status', 'CANCELLED'] }, '$totalAmount', 0] }
                },
                totalOrders: { $sum: 1 },
                avgOrderValue: {
                  $avg: { $cond: [{ $ne: ['$status', 'CANCELLED'] }, '$totalAmount', '$$REMOVE'] }
                },
                cashRevenue: {
                  $sum: { $cond: [{ $and: [{ $eq: ['$paymentMode', 'COD'] }, { $ne: ['$status', 'CANCELLED'] }] }, '$totalAmount', 0] }
                },
                onlineRevenue: {
                  $sum: { $cond: [{ $and: [{ $in: ['$paymentMode', ['UPI', 'CARD', 'ONLINE']] }, { $ne: ['$status', 'CANCELLED'] }] }, '$totalAmount', 0] }
                },
                deliveredCount: {
                  $sum: { $cond: [{ $eq: ['$status', 'DELIVERED'] }, 1, 0] }
                },
                pendingCount: {
                  $sum: { $cond: [{ $and: [{ $ne: ['$status', 'DELIVERED'] }, { $ne: ['$status', 'CANCELLED'] }] }, 1, 0] }
                },
                cancelledCount: {
                  $sum: { $cond: [{ $eq: ['$status', 'CANCELLED'] }, 1, 0] }
                }
              }
            }
          ],
          trendBuckets: [
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                revenue: {
                  $sum: { $cond: [{ $ne: ['$status', 'CANCELLED'] }, '$totalAmount', 0] }
                },
                orders: { $sum: 1 }
              }
            },
            { $sort: { '_id': 1 } }
          ],
          itemsPopularity: [
            { $match: { status: { $ne: 'CANCELLED' } } },
            { $unwind: '$items' },
            {
              $group: {
                _id: '$items.name',
                count: { $sum: '$items.quantity' },
                revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
              }
            },
            { $sort: { revenue: -1 } },
            { $limit: 5 }
          ]
        }
      }
    ]);

    const analyticsResult = result || { kpis: [], trendBuckets: [], itemsPopularity: [] };
    await analyticsCache.set(cacheKey, analyticsResult, 60_000);
    res.setHeader('X-Cache', 'MISS');
    res.json(analyticsResult);
  } catch (err: any) {
    log.error('Failed to fetch analytics data', { error: err.message });
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

// Storage Alert Endpoint (Admin)
router.get('/storage-status', requireAuth, requireRole(['SuperAdmin']), async (req: AuthRequest, res: Response) => {
  try {
    // estimatedDocumentCount is O(1) metadata read — no collection scan
    const totalOrders = await Order.estimatedDocumentCount();
    const isNearLimit = totalOrders > 25000;
    res.json({ totalOrders, isNearLimit });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check storage status' });
  }
});

// Archive Delivered Orders — soft delete (keeps data, hides from active queries)
router.delete('/archive', requireAuth, requireRole(['SuperAdmin']), async (req: AuthRequest, res: Response) => {
  try {
    const result = await Order.updateMany(
      { status: 'DELIVERED', isArchived: { $ne: true } },
      { $set: { isArchived: true, archivedAt: new Date() } }
    );
    res.json({ success: true, archivedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to archive orders' });
  }
});

// Permanently Delete an Order (Admins only: ShopAdmin or SuperAdmin)
router.delete('/:orderId', requireAuth, requireRole(['ShopAdmin', 'SuperAdmin']), async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const user = req.user!;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // ShopAdmin can only delete orders from their own shop
    if (user.role === 'ShopAdmin') {
      if (String(order.shopId) !== String(user.shopId)) {
        return res.status(403).json({ error: 'Unauthorized to delete orders from another shop' });
      }
    }

    await Order.findByIdAndDelete(orderId);

    // Invalidate analytics cache for this shop
    try {
      await analyticsCache.deleteByPrefix(`analytics:${order.shopId}`);
    } catch (_) {}

    // Emit real-time events to shop, customer, and delivery boy if assigned
    emitToShop(req, order.shopId, 'order_deleted', { orderId: String(order._id) });
    emitToUser(req, String(order.customerId), 'order_deleted', { orderId: String(order._id) });
    if (order.deliveryBoyId) {
      emitToUser(req, String(order.deliveryBoyId), 'order_deleted', { orderId: String(order._id) });
    }

    log.info('Order deleted by admin', {
      orderId,
      adminId: user._id,
      adminRole: user.role,
      shopId: order.shopId,
    });

    res.json({ success: true, message: 'Order deleted successfully', deletedOrderId: orderId });
  } catch (err: any) {
    log.error('Failed to delete order', { error: err.message });
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// Helper: Recalculate order totals from scratch with full coupon discount re-evaluation
async function recalculateOrderTotals(order: any, updatedItems?: any[]) {
  const items = updatedItems || order.items || [];

  const perItemSubtotal = items
    .filter((it: any) => it.unit !== 'KG')
    .reduce((s: number, it: any) => s + (Number(it.price || 0) * Number(it.quantity || 1)), 0);

  const kgSubtotal = items
    .filter((it: any) => it.unit === 'KG')
    .reduce((s: number, it: any) => s + Number(it.price || 0), 0);

  const totalItemSubtotal = Math.round((perItemSubtotal + kgSubtotal) * 100) / 100;

  // Recalculate coupon discount if coupon was attached to this order
  let discountAmount = Number(order.discountAmount) || 0;
  if (order.couponCode) {
    let discountPercent = Number(order.couponDiscountPercent) || 0;
    let maxDiscount = order.couponMaxDiscount !== undefined ? Number(order.couponMaxDiscount) : Infinity;
    let minOrderValue = Number(order.couponMinOrderValue) || 0;

    // Fallback: If coupon metadata is missing on order, lookup from Shop or Offer
    if (!discountPercent) {
      try {
        const shopDoc = await Shop.findById(order.shopId).select('promoCode').lean() as any;
        if (shopDoc?.promoCode?.code && shopDoc.promoCode.code.toUpperCase() === String(order.couponCode).toUpperCase()) {
          discountPercent = Number(shopDoc.promoCode.discountPercent) || 0;
          maxDiscount = shopDoc.promoCode.maxDiscount !== undefined ? Number(shopDoc.promoCode.maxDiscount) : Infinity;
          minOrderValue = Number(shopDoc.promoCode.minOrderValue) || 0;
        } else {
          const offerDoc = await Offer.findOne({ 
            shopId: order.shopId, 
            code: String(order.couponCode).toUpperCase() 
          }).lean() as any;
          if (offerDoc) {
            discountPercent = Number(offerDoc.discountPercent) || 0;
            maxDiscount = offerDoc.maxDiscount !== undefined ? Number(offerDoc.maxDiscount) : Infinity;
            minOrderValue = Number(offerDoc.minOrderValue) || 0;
          }
        }
      } catch (err: any) {
        log.warn('Could not lookup coupon details for recalculation', { error: err.message, couponCode: order.couponCode });
      }
    }

    if (discountPercent > 0) {
      if (totalItemSubtotal >= minOrderValue) {
        const calculatedDiscount = Math.min((totalItemSubtotal * discountPercent) / 100, maxDiscount);
        discountAmount = Math.round(calculatedDiscount * 100) / 100;
      } else {
        discountAmount = 0;
      }
      order.couponDiscountPercent = discountPercent;
      if (maxDiscount !== Infinity) order.couponMaxDiscount = maxDiscount;
      order.couponMinOrderValue = minOrderValue;
    }
  }

  // Shop delivery fee and tax lookup
  let taxPercent = 0;
  let deliveryFeeAmt = order.deliveryFee !== undefined ? Number(order.deliveryFee) : 0;
  try {
    const shopDoc = await Shop.findById(order.shopId).select('taxPercent deliveryFee').lean() as any;
    if (shopDoc) {
      taxPercent = shopDoc.taxPercent !== undefined ? Number(shopDoc.taxPercent) : 0;
      if (order.deliveryFee === undefined && shopDoc.deliveryFee !== undefined) {
        deliveryFeeAmt = Number(shopDoc.deliveryFee) || 0;
      }
    }
  } catch (err: any) {
    log.warn('Could not lookup shop tax and delivery fee', { error: err.message });
  }

  const taxAmount = Math.round((totalItemSubtotal * taxPercent / 100) * 100) / 100;
  const washPrefsCost = (order.washPreferences || []).reduce((s: number, p: any) => s + Number(p.price || 0), 0);

  const grandTotal = Math.max(0, totalItemSubtotal - discountAmount + taxAmount + deliveryFeeAmt + washPrefsCost);

  order.items = items;
  order.discountAmount = discountAmount;
  order.taxAmount = taxAmount;
  order.deliveryFee = deliveryFeeAmt;
  order.totalAmount = Math.round(grandTotal * 100) / 100;
  order.kgPriceUpdated = true;

  return order;
}

// Helper: Auto-finalize KG prices on order completion
async function autoFinalizeKgPrices(order: any) {
  if (order.kgPriceUpdated) return order;
  const kgItems = (order.items || []).filter((it: any) => it.unit === 'KG');
  if (kgItems.length === 0) {
    order.kgPriceUpdated = true;
    if (order.save) await order.save();
    return order;
  }

  const kgItemIds = kgItems.map((it: any) => it.itemId);
  const catalogItems = await Item.find({ _id: { $in: kgItemIds } }).select('_id pricePerKg').lean() as any[];
  const catalogMap: Record<string, number> = {};
  catalogItems.forEach((ci: any) => { catalogMap[ci._id] = ci.pricePerKg || 0; });

  const updatedItems = order.items.map((it: any) => {
    if (it.unit === 'KG') {
      const kgWeight = it.kgWeight || 0;
      const pricePerKg = catalogMap[it.itemId] || 0;
      const kgPrice = Math.round(kgWeight * pricePerKg * 100) / 100;
      const itObj = it.toObject ? it.toObject() : { ...it };
      return { ...itObj, price: kgPrice };
    }
    return it.toObject ? it.toObject() : { ...it };
  });

  await recalculateOrderTotals(order, updatedItems);
  if (order.save) await order.save();
  return order;
}

// Status transitions allowed per role
const ADMIN_ALLOWED_STATUSES = ['ACCEPTED', 'PICKUP_ASSIGNED', 'PICKED_UP', 'WASHING', 'IRONING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'] as const;
const DELIVERY_ALLOWED_STATUSES = ['PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'] as const;
const OPERATOR_ALLOWED_STATUSES = ['PICKED_UP', 'WASHING', 'IRONING', 'OUT_FOR_DELIVERY'] as const;

// Update order status (Admin/Delivery/Operator)
router.patch('/:orderId/status', requireAuth, requireRole(['ShopAdmin', 'SuperAdmin', 'Delivery', 'Operator']), async (req: AuthRequest, res: Response) => {
  try {
    const { status, paymentMode, paymentStatus } = req.body;

    // Delivery agents can set PICKED_UP, OUT_FOR_DELIVERY, or DELIVERED
    if (req.user!.role === 'Delivery' && !DELIVERY_ALLOWED_STATUSES.includes(status as any)) {
      return res.status(403).json({ error: `Delivery agents can only set status to: ${DELIVERY_ALLOWED_STATUSES.join(', ')}` });
    }

    // Laundry Floor Operators can transition wash bucket stages
    if (req.user!.role === 'Operator' && !OPERATOR_ALLOWED_STATUSES.includes(status as any)) {
      return res.status(403).json({ error: `Operators can only set status to: ${OPERATOR_ALLOWED_STATUSES.join(', ')}` });
    }

    // Admins status check
    if (['ShopAdmin', 'SuperAdmin'].includes(req.user!.role) && !ADMIN_ALLOWED_STATUSES.includes(status as any)) {
      return res.status(403).json({ error: `Invalid status transition. Allowed: ${ADMIN_ALLOWED_STATUSES.join(', ')}` });
    }

    const updateData: Record<string, any> = { status };
    if (paymentMode) updateData.paymentMode = paymentMode;
    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus;
    } else if (status === 'DELIVERED') {
      updateData.paymentStatus = 'SUCCESS';
    }

    let order = await Order.findByIdAndUpdate(req.params.orderId, updateData, { new: true }) as any;
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // AUTO-FINALIZE KG PRICES: when order reaches DELIVERED and KG prices are still pending,
    // recalculate totals using whatever kgWeight is stored on each item.
    if (status === 'DELIVERED') {
      await autoFinalizeKgPrices(order);
    }

    const updatedOrder = order.toObject ? order.toObject() : order;

    // Respond immediately
    res.json(updatedOrder);

    // Targeted room emit — only shop staff and the customer receive this
    emitToShop(req, updatedOrder.shopId, 'order_updated', updatedOrder);
    emitToUser(req, String(updatedOrder.customerId), 'order_updated', updatedOrder);

    // Fire-and-forget notifications
    setImmediate(async () => {
      try {
        const customer = await User.findById(updatedOrder.customerId).select('expoPushToken').lean() as any;
        if (customer?.expoPushToken) {
          await sendPushNotification(
            [customer.expoPushToken],
            'Order Status Updated',
            `Your order is now: ${status.replace(/_/g, ' ')}`,
            { orderId: updatedOrder._id, status }
          );
        }

        if (req.user!.role === 'Delivery') {
          const shopAdmins = await User.find({ shopId: updatedOrder.shopId, role: 'ShopAdmin' })
            .select('expoPushToken')
            .lean() as any[];
          const adminTokens = shopAdmins.map((a: any) => a.expoPushToken).filter(Boolean) as string[];
          if (adminTokens.length > 0) {
            await sendPushNotification(
              adminTokens,
              'Order Status Updated',
              `Order #${String(updatedOrder._id).slice(-4)} is now: ${status.replace(/_/g, ' ')}`,
              { orderId: updatedOrder._id, status }
            );
          }
        }
      } catch (e: any) {
        log.error('Failed to send status-update notification', { error: e.message });
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Assign delivery boy (Admin)
router.patch('/:orderId/assign', requireAuth, requireRole(['ShopAdmin', 'SuperAdmin']), async (req: AuthRequest, res: Response) => {
  try {
    let { deliveryBoyId, deliveryBoyName } = req.body;
    if (!deliveryBoyId) {
      return res.status(400).json({ error: 'deliveryBoyId is required' });
    }

    const currentOrder = await Order.findById(req.params.orderId);
    if (!currentOrder) return res.status(404).json({ error: 'Order not found' });

    const staff = await User.findById(deliveryBoyId).select('name phone').lean() as any;
    if (!deliveryBoyName) {
      if (staff?.name) {
        deliveryBoyName = staff.name;
      } else {
        deliveryBoyName = 'Delivery Staff';
      }
    }
    const deliveryBoyPhone = staff?.phone || '';

    let newStatus = req.body.status || currentOrder.status;
    if (!req.body.status) {
      if (['PLACED', 'ACCEPTED'].includes(currentOrder.status)) {
        newStatus = 'PICKUP_ASSIGNED';
      } else if (['PICKED_UP', 'WASHING', 'IRONING'].includes(currentOrder.status)) {
        newStatus = 'OUT_FOR_DELIVERY';
      }
    }

    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      { deliveryBoyId, deliveryBoyName, deliveryBoyPhone, status: newStatus },
      { new: true }
    ).lean() as any;

    // Respond immediately
    res.json(order);

    // Targeted room emit for assign
    emitToShop(req, order.shopId, 'order_updated', order);
    emitToUser(req, String(order.customerId), 'order_updated', order);
    emitToUser(req, String(deliveryBoyId), 'order_updated', order);

    // Fire-and-forget notifications
    setImmediate(async () => {
      try {
        const [customer, deliveryBoy] = await Promise.all([
          User.findById(order.customerId).select('expoPushToken').lean() as any,
          User.findById(deliveryBoyId).select('expoPushToken').lean() as any,
        ]);

        if (customer?.expoPushToken) {
          await sendPushNotification(
            [customer.expoPushToken],
            'Delivery Boy Assigned',
            `${deliveryBoyName} has been assigned to pick up your laundry.`,
            { orderId: order._id }
          );
        }
        if (deliveryBoy?.expoPushToken) {
          await sendPushNotification(
            [deliveryBoy.expoPushToken],
            'New Pickup Assigned',
            `You have been assigned a new pickup for ${order.customerName || 'a customer'}.`,
            { orderId: order._id }
          );
        }
      } catch (e: any) {
        log.error('Failed to send assign notification', { error: e.message });
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to assign delivery boy' });
  }
});

// Update admin details (Total Amount & Admin Notes)
router.patch('/:orderId/admin-details', requireAuth, requireRole(['ShopAdmin', 'SuperAdmin']), async (req: AuthRequest, res: Response) => {
  try {
    const allowed = ['totalAmount', 'adminNotes'];
    const updateData: Record<string, any> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updateData[key] = req.body[key];
    }

    const order = await Order.findByIdAndUpdate(req.params.orderId, updateData, { new: true }).lean();
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order details' });
  }
});

// Update KG item weights (Delivery agent — weighs clothes at pickup time to calculate final price)
// Body: { items: [{ itemId: string, kgWeight: number }], markPickedUp?: boolean }
// Each KG item's price is computed as kgWeight * (catalog pricePerKg from the item record)
// After update, totalAmount is recalculated and kgPriceUpdated is set to true.
router.patch('/:orderId/kg-weight', requireAuth, requireRole(['Delivery', 'ShopAdmin', 'SuperAdmin']), async (req: AuthRequest, res: Response) => {
  try {
    const { items: weightUpdates, markPickedUp } = req.body;
    if (!Array.isArray(weightUpdates) || weightUpdates.length === 0) {
      return res.status(400).json({ error: 'items array with { itemId, kgWeight } entries is required' });
    }

    const order = await Order.findById(req.params.orderId) as any;
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const itemIds = weightUpdates.map((u: any) => String(u.itemId));
    const catalogItems = await Item.find({ _id: { $in: itemIds } }).select('_id pricePerKg').lean() as any[];
    const catalogMap: Record<string, number> = {};
    catalogItems.forEach((ci: any) => {
      catalogMap[String(ci._id)] = ci.pricePerKg || 0;
      catalogMap[ci._id] = ci.pricePerKg || 0;
    });

    // Apply weights to order items
    const updatedItems = order.items.map((it: any) => {
      const update = weightUpdates.find((u: any) => String(u.itemId) === String(it.itemId));
      const isKg = it.unit === 'KG' || (typeof it.name === 'string' && (it.name.toLowerCase().includes('per kg') || it.name.toLowerCase().includes('/ kg'))) || Boolean(it.kgWeight && it.kgWeight > 0);
      if (update && (it.unit === 'KG' || isKg)) {
        const kgWeight = Math.max(0, Number(update.kgWeight) || 0);
        const pricePerKg = catalogMap[String(it.itemId)] || catalogMap[it.itemId] || (it as any).pricePerKg || (it.unit === 'KG' && it.price > 0 && !it.kgWeight ? it.price : 0);
        const kgPrice = Math.round(kgWeight * pricePerKg * 100) / 100;
        const itObj = it.toObject ? it.toObject() : { ...it };
        return { ...itObj, kgWeight, price: kgPrice, unit: 'KG' };
      }
      return it.toObject ? it.toObject() : { ...it };
    });

    // Recalculate total from scratch with coupon re-evaluation
    await recalculateOrderTotals(order, updatedItems);

    // If requested to mark as picked up at the same time
    if (markPickedUp && ['PLACED', 'ACCEPTED', 'PICKUP_ASSIGNED'].includes(order.status)) {
      order.status = 'PICKED_UP';
    }

    await order.save();

    const updatedOrder = order.toObject ? order.toObject() : order;
    res.json(updatedOrder);

    // Notify customer and shop
    emitToShop(req, updatedOrder.shopId, 'order_updated', updatedOrder);
    emitToUser(req, String(updatedOrder.customerId), 'order_updated', updatedOrder);
    if (updatedOrder.deliveryBoyId) {
      emitToUser(req, String(updatedOrder.deliveryBoyId), 'order_updated', updatedOrder);
    }

    // Push notification to customer
    setImmediate(async () => {
      try {
        const customer = await User.findById(updatedOrder.customerId).select('expoPushToken').lean() as any;
        if (customer?.expoPushToken) {
          const isPickedUpNow = updatedOrder.status === 'PICKED_UP';
          await sendPushNotification(
            [customer.expoPushToken],
            isPickedUpNow ? 'Order Picked Up & Weighed' : 'Order Weighed',
            `Your laundry has been weighed${isPickedUpNow ? ' and marked as picked up' : ''}. Final bill: ₹${updatedOrder.totalAmount}${updatedOrder.discountAmount > 0 ? ` (Saved ₹${updatedOrder.discountAmount} with coupon)` : ''}`,
            { orderId: updatedOrder._id }
          );
        }
      } catch (e: any) {
        log.error('Failed to send kg-weight notification', { error: e.message });
      }
    });
  } catch (err: any) {
    log.error('Failed to update KG weights', { error: err.message });
    res.status(500).json({ error: 'Failed to update KG weights' });
  }
});


// Verify order items (Delivery & Admin — pickup confirmation / count verification step)
router.patch('/:orderId/verify', requireAuth, requireRole(['Delivery', 'ShopAdmin', 'SuperAdmin']), async (req: AuthRequest, res: Response) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items array is required' });
    }
    const order = await Order.findById(req.params.orderId) as any;
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Guard: allow verifying for pickup / ongoing stages
    const verifiableStatuses = ['PLACED', 'ACCEPTED', 'PICKUP_ASSIGNED', 'PICKED_UP'];
    if (!verifiableStatuses.includes(order.status)) {
      return res.status(400).json({ error: `Cannot verify items. Order status is: ${order.status}` });
    }

    // Preserve existing weighed prices for KG items if incoming items don't have them
    const existingMap: Record<string, any> = {};
    (order.items || []).forEach((it: any) => { existingMap[it.itemId] = it; });

    const mergedItems = items.map((it: any) => {
      const existing = existingMap[it.itemId];
      if (it.unit === 'KG' && (!it.price || it.price === 0) && existing?.price > 0) {
        return { ...it, price: existing.price, kgWeight: it.kgWeight || existing.kgWeight };
      }
      return it;
    });

    await recalculateOrderTotals(order, mergedItems);
    order.status = 'PICKED_UP';
    await order.save();

    const updatedOrder = order.toObject ? order.toObject() : order;

    // Respond immediately
    res.json(updatedOrder);

    // Targeted room emit for verify
    emitToShop(req, updatedOrder.shopId, 'order_updated', updatedOrder);
    emitToUser(req, String(updatedOrder.customerId), 'order_updated', updatedOrder);

    // Fire-and-forget customer notification
    setImmediate(async () => {
      try {
        const customer = await User.findById(order.customerId).select('expoPushToken').lean() as any;
        if (customer?.expoPushToken) {
          await sendPushNotification(
            [customer.expoPushToken],
            'Items Verified',
            `Your laundry items have been verified. Grand total: ₹${Number(updatedOrder.totalAmount || 0).toFixed(2)}${updatedOrder.discountAmount > 0 ? ` (Saved ₹${updatedOrder.discountAmount} with coupon)` : ''}.`,
            { orderId: updatedOrder._id }
          );
        }
      } catch (e: any) {
        log.error('Failed to send verify notification', { error: e.message });
      }
    });
  } catch (err: any) {
    log.error('Failed to verify order', { error: err.message });
    res.status(500).json({ error: 'Failed to verify order' });
  }
});

// Record payment & mark DELIVERED
router.patch('/:orderId/payment', requireAuth, requireRole(['ShopAdmin', 'SuperAdmin', 'Delivery']), async (req: AuthRequest, res: Response) => {
  try {
    const { paymentMode } = req.body;
    if (!paymentMode) {
      return res.status(400).json({ error: 'paymentMode is required' });
    }
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.paymentMode = paymentMode;
    order.paymentStatus = 'SUCCESS';
    order.status = 'DELIVERED';
    await autoFinalizeKgPrices(order);
    await order.save();

    const paidOrder = order.toObject ? order.toObject() : order;
    if (paidOrder?.shopId) emitToShop(req, paidOrder.shopId, 'order_updated', paidOrder);
    if (paidOrder?.customerId) emitToUser(req, String(paidOrder.customerId), 'order_updated', paidOrder);

    res.json(paidOrder);
  } catch (err) {
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

// Cancel an order (Customer can cancel within 15 minutes of placement; Admins can cancel anytime)
router.patch('/:orderId/cancel', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const user = req.user!;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Order is already cancelled' });
    }

    if (user.role === 'Customer') {
      // Must be customer's own order
      if (String(order.customerId) !== String(user._id)) {
        return res.status(403).json({ error: 'Unauthorized to cancel this order' });
      }

      // Check if order status allows cancellation
      const customerCancellableStatuses = ['PLACED', 'ACCEPTED', 'PICKUP_ASSIGNED'];
      if (!customerCancellableStatuses.includes(order.status)) {
        return res.status(400).json({ error: `Cannot cancel order at ${order.status.replace(/_/g, ' ')} stage. Please contact support.` });
      }

      // 15-minute cancellation window check
      const createdAtTime = new Date(order.createdAt).getTime();
      const elapsedMs = Date.now() - createdAtTime;
      const MAX_CANCEL_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

      if (elapsedMs > MAX_CANCEL_WINDOW_MS) {
        return res.status(400).json({ 
          error: 'Orders can only be cancelled within 15 minutes of placement. Please contact shop support for assistance.' 
        });
      }
    } else if (!['ShopAdmin', 'SuperAdmin'].includes(user.role)) {
      return res.status(403).json({ error: 'Unauthorized to cancel orders' });
    }

    order.status = 'CANCELLED';
    order.cancelledAt = new Date();
    order.cancellationReason = reason || (user.role === 'Customer' ? 'Cancelled by customer' : 'Cancelled by admin');
    await order.save();

    const updatedOrder = order.toObject();

    // Respond immediately
    res.json(updatedOrder);

    // Emit real-time events
    emitToShop(req, updatedOrder.shopId, 'order_updated', updatedOrder);
    emitToUser(req, String(updatedOrder.customerId), 'order_updated', updatedOrder);
    if (updatedOrder.deliveryBoyId) {
      emitToUser(req, String(updatedOrder.deliveryBoyId), 'order_updated', updatedOrder);
    }

    // Fire-and-forget push notification to shop admins
    setImmediate(async () => {
      try {
        const shopAdmins = await User.find({ shopId: updatedOrder.shopId, role: 'ShopAdmin' })
          .select('expoPushToken')
          .lean() as any[];
        const adminTokens = shopAdmins.map((a: any) => a.expoPushToken).filter(Boolean) as string[];
        if (adminTokens.length > 0) {
          await sendPushNotification(
            adminTokens,
            'Order Cancelled',
            `Order #${String(updatedOrder._id).slice(-6).toUpperCase()} was cancelled by ${user.role === 'Customer' ? 'customer' : 'admin'}.`,
            { orderId: updatedOrder._id, status: 'CANCELLED' }
          );
        }
      } catch (e: any) {
        log.error('Failed to send cancellation notification', { error: e.message });
      }
    });
  } catch (err: any) {
    log.error('Failed to cancel order', { error: err.message });
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

export default router;
