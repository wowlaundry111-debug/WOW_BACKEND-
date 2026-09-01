import { Router, Request, Response } from 'express';
import { Order, Shop, User, requireAuth, requireRole, AuthRequest, sendPushNotification, analyticsCache } from '@wow/shared';

// Helper: emit to a specific shop's room only (not all sockets)
const emitToShop = (req: Request, shopId: string, event: string, data: any) => {
  const io = req.app.get('io');
  if (io) {
    io.to(`shop:${shopId}`).emit(event, data);
    // Also emit globally so legacy clients without room support still receive it
    io.emit(event, data);
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

// Create an order (Customer only)
router.post('/', requireAuth, requireRole(['Customer']), async (req: AuthRequest, res: Response) => {
  try {
    const {
      shopId, items, totalAmount, discountAmount, taxAmount,
      deliveryFee, pickupAddress, deliveryAddress, pickupTime, washPreferences
    } = req.body;

    // Only fetch the isOpen field — no need for full shop document
    const shop = await Shop.findById(shopId).select('isOpen').lean() as any;
    if (shop && shop.isOpen === false) {
      return res.status(400).json({ error: 'This branch is currently closed. We are not accepting orders right now.' });
    }

    const customer = await User.findById(req.user!._id).select('name phone').lean() as any;

    const order = await Order.create({
      customerId: req.user!._id,
      customerName: customer?.name || 'Unknown Customer',
      customerPhone: customer?.phone || 'N/A',
      shopId,
      items,
      washPreferences,
      totalAmount,
      discountAmount,
      taxAmount,
      deliveryFee,
      pickupAddress,
      deliveryAddress,
      pickupTime,
      status: 'PLACED',
    });

    // Respond immediately — notifications fire in background
    res.status(201).json(order);
    
    // Emit to shop room only — avoids broadcasting to all 1k+ connected sockets
    emitToShop(req, order.shopId, 'order_created', order);
    emitToUser(req, String(req.user!._id), 'order_created', order);

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
            'New Order Placed! 🧺',
            `A new order of ₹${totalAmount} has been placed.`,
            { orderId: order._id }
          );
        }
      } catch (e) {
        console.error('Failed to send new-order notification:', e);
      }
    });
  } catch (err) {
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
        query.$or = [{ deliveryBoyId: user._id }, { deliveryBoyId: String(user._id) }, { shopId: targetShopId }];
      } else {
        const dbUser = await User.findById(user._id).select('shopId').lean() as any;
        if (dbUser?.shopId) {
          query.$or = [{ deliveryBoyId: user._id }, { deliveryBoyId: String(user._id) }, { shopId: dbUser.shopId }];
        } else {
          query.$or = [{ deliveryBoyId: user._id }, { deliveryBoyId: String(user._id) }];
        }
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

    res.json({ orders, total, page, pages: Math.ceil(total / limit) });
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
    const cached = analyticsCache.get(cacheKey);
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
                totalRevenue: { $sum: '$totalAmount' },
                totalOrders: { $sum: 1 },
                avgOrderValue: { $avg: '$totalAmount' },
                cashRevenue: {
                  $sum: { $cond: [{ $eq: ['$paymentMode', 'COD'] }, '$totalAmount', 0] }
                },
                onlineRevenue: {
                  $sum: { $cond: [{ $in: ['$paymentMode', ['UPI', 'CARD', 'ONLINE']] }, '$totalAmount', 0] }
                },
                deliveredCount: {
                  $sum: { $cond: [{ $eq: ['$status', 'DELIVERED'] }, 1, 0] }
                },
                pendingCount: {
                  $sum: { $cond: [{ $ne: ['$status', 'DELIVERED'] }, 1, 0] }
                }
              }
            }
          ],
          trendBuckets: [
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                revenue: { $sum: '$totalAmount' },
                orders: { $sum: 1 }
              }
            },
            { $sort: { '_id': 1 } }
          ],
          itemsPopularity: [
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
    analyticsCache.set(cacheKey, analyticsResult, 60_000);
    res.setHeader('X-Cache', 'MISS');
    res.json(analyticsResult);
  } catch (err) {
    console.error('Failed to fetch analytics data:', err);
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

// Status transitions allowed per role
const ADMIN_ALLOWED_STATUSES = ['ACCEPTED', 'PICKUP_ASSIGNED', 'PICKED_UP', 'WASHING', 'IRONING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'] as const;
const DELIVERY_ALLOWED_STATUSES = ['PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'] as const;

// Update order status (Admin/Delivery)
router.patch('/:orderId/status', requireAuth, requireRole(['ShopAdmin', 'SuperAdmin', 'Delivery']), async (req: AuthRequest, res: Response) => {
  try {
    const { status, paymentMode, paymentStatus } = req.body;

    // Delivery agents can set PICKED_UP, OUT_FOR_DELIVERY, or DELIVERED
    if (req.user!.role === 'Delivery' && !DELIVERY_ALLOWED_STATUSES.includes(status as any)) {
      return res.status(403).json({ error: `Delivery agents can only set status to: ${DELIVERY_ALLOWED_STATUSES.join(', ')}` });
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

    const order = await Order.findByIdAndUpdate(req.params.orderId, updateData, { new: true }).lean() as any;
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Respond immediately
    res.json(order);

    // Targeted room emit — only shop staff and the customer receive this
    emitToShop(req, order.shopId, 'order_updated', order);
    emitToUser(req, String(order.customerId), 'order_updated', order);

    // Fire-and-forget notifications
    setImmediate(async () => {
      try {
        const customer = await User.findById(order.customerId).select('expoPushToken').lean() as any;
        if (customer?.expoPushToken) {
          await sendPushNotification(
            [customer.expoPushToken],
            'Order Status Updated 🧺',
            `Your order is now: ${status.replace(/_/g, ' ')}`,
            { orderId: order._id, status }
          );
        }

        if (req.user!.role === 'Delivery') {
          const shopAdmins = await User.find({ shopId: order.shopId, role: 'ShopAdmin' })
            .select('expoPushToken')
            .lean() as any[];
          const adminTokens = shopAdmins.map((a: any) => a.expoPushToken).filter(Boolean) as string[];
          if (adminTokens.length > 0) {
            await sendPushNotification(
              adminTokens,
              'Order Status Updated',
              `Order #${String(order._id).slice(-4)} is now: ${status.replace(/_/g, ' ')}`,
              { orderId: order._id, status }
            );
          }
        }
      } catch (e) {
        console.error('Failed to send status-update notification:', e);
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

    if (!deliveryBoyName) {
      const staff = await User.findById(deliveryBoyId).select('name').lean() as any;
      if (staff?.name) {
        deliveryBoyName = staff.name;
      } else {
        deliveryBoyName = 'Delivery Staff';
      }
    }

    let newStatus = req.body.status || currentOrder.status;
    if (!req.body.status) {
      if (['PLACED', 'ACCEPTED'].includes(currentOrder.status)) {
        newStatus = 'PICKUP_ASSIGNED';
      } else if (['PICKED_UP', 'WASHING', 'IRONING', 'READY_FOR_DELIVERY'].includes(currentOrder.status)) {
        newStatus = 'OUT_FOR_DELIVERY';
      }
    }

    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      { deliveryBoyId, deliveryBoyName, status: newStatus },
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
            'Delivery Boy Assigned 🚚',
            `${deliveryBoyName} has been assigned to pick up your laundry.`,
            { orderId: order._id }
          );
        }
        if (deliveryBoy?.expoPushToken) {
          await sendPushNotification(
            [deliveryBoy.expoPushToken],
            'New Pickup Assigned 📦',
            `You have been assigned a new pickup for ${order.customerName || 'a customer'}.`,
            { orderId: order._id }
          );
        }
      } catch (e) {
        console.error('Failed to send assign notification:', e);
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

// Update KG item weights (Delivery agent — after weighing clothes at delivery time)
// Body: { items: [{ itemId: string, kgWeight: number }] }
// Each KG item's price is computed as kgWeight * (catalog pricePerKg from the item record)
// After update, totalAmount is recalculated and kgPriceUpdated is set to true.
router.patch('/:orderId/kg-weight', requireAuth, requireRole(['Delivery', 'ShopAdmin', 'SuperAdmin']), async (req: AuthRequest, res: Response) => {
  try {
    const { items: weightUpdates } = req.body;
    if (!Array.isArray(weightUpdates) || weightUpdates.length === 0) {
      return res.status(400).json({ error: 'items array with { itemId, kgWeight } entries is required' });
    }

    const order = await Order.findById(req.params.orderId) as any;
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Fetch catalog items to get pricePerKg values
    const { Item } = require('@wow/shared');
    const itemIds = weightUpdates.map((u: any) => u.itemId);
    const catalogItems = await Item.find({ _id: { $in: itemIds } }).select('_id pricePerKg').lean() as any[];
    const catalogMap: Record<string, number> = {};
    catalogItems.forEach((ci: any) => {
      catalogMap[ci._id] = ci.pricePerKg || 0;
    });

    // Apply weights to order items
    let addedKgTotal = 0;
    const updatedItems = order.items.map((it: any) => {
      const update = weightUpdates.find((u: any) => u.itemId === it.itemId);
      if (update && it.unit === 'KG') {
        const kgWeight = Math.max(0, Number(update.kgWeight) || 0);
        const pricePerKg = catalogMap[it.itemId] || 0;
        const kgPrice = Math.round(kgWeight * pricePerKg * 100) / 100;
        addedKgTotal += kgPrice;
        return { ...it.toObject(), kgWeight, price: kgPrice };
      }
      // Non-KG items already have price; add them to running total
      if (it.unit !== 'KG') {
        addedKgTotal += it.price * it.quantity;
      }
      return it;
    });

    // Recalculate total from scratch (perItem + KG + fees - discount + tax)
    const perItemSubtotal = updatedItems
      .filter((it: any) => it.unit !== 'KG')
      .reduce((s: number, it: any) => s + it.price * it.quantity, 0);

    const kgSubtotal = updatedItems
      .filter((it: any) => it.unit === 'KG')
      .reduce((s: number, it: any) => s + (it.price || 0), 0);

    const newTotal = perItemSubtotal + kgSubtotal
      + (order.taxAmount || 0)
      + (order.deliveryFee || 0)
      - (order.discountAmount || 0)
      + ((order.washPreferences || []).reduce((s: number, p: any) => s + (p.price || 0), 0));

    order.items = updatedItems;
    order.totalAmount = Math.round(newTotal * 100) / 100;
    order.kgPriceUpdated = true;
    await order.save();

    const updatedOrder = order.toObject();
    res.json(updatedOrder);

    // Notify customer and shop
    emitToShop(req, updatedOrder.shopId, 'order_updated', updatedOrder);
    emitToUser(req, String(updatedOrder.customerId), 'order_updated', updatedOrder);

    // Push notification to customer
    setImmediate(async () => {
      try {
        const customer = await User.findById(updatedOrder.customerId).select('expoPushToken').lean() as any;
        if (customer?.expoPushToken) {
          await sendPushNotification(
            [customer.expoPushToken],
            'Order Total Updated 🏋️',
            `Your KG items have been weighed. Total: ₹${updatedOrder.totalAmount}`,
            { orderId: updatedOrder._id }
          );
        }
      } catch (e) {
        console.error('Failed to send kg-weight notification:', e);
      }
    });
  } catch (err) {
    console.error('Failed to update kg weights:', err);
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
    const order = await Order.findById(req.params.orderId).lean() as any;
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Guard: allow verifying for pickup / ongoing stages
    const verifiableStatuses = ['PLACED', 'ACCEPTED', 'PICKUP_ASSIGNED', 'PICKED_UP'];
    if (!verifiableStatuses.includes(order.status)) {
      return res.status(400).json({ error: `Cannot verify items. Order status is: ${order.status}` });
    }

    const shop = await Shop.findById(order.shopId).select('taxPercent deliveryFee').lean() as any;
    const taxPercent = shop?.taxPercent || 0;
    const deliveryFeeAmt = shop?.deliveryFee || 0;

    const itemSubtotal = items.reduce((sum: number, item: any) => sum + (Number(item.price || 0) * Number(item.quantity || 0)), 0);
    const washPrefsCost = (order.washPreferences || []).reduce((sum: number, wp: any) => sum + Number(wp.price || 0), 0);
    const taxAmount = (itemSubtotal * taxPercent) / 100;
    const discountAmount = order.discountAmount || 0;
    const grandTotal = Math.max(0, itemSubtotal - discountAmount + taxAmount + deliveryFeeAmt + washPrefsCost);

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.orderId,
      {
        items,
        totalAmount: grandTotal,
        taxAmount,
        deliveryFee: deliveryFeeAmt,
        status: 'PICKED_UP',
      },
      { new: true }
    ).lean() as any;

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
            'Items Verified ✅',
            `Your laundry items have been verified. Grand total: ₹${grandTotal.toFixed(2)}.`,
            { orderId: order._id }
          );
        }
      } catch (e) {
        console.error('Failed to send verify notification:', e);
      }
    });
  } catch (err) {
    console.error('Failed to verify order', err);
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
    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      { paymentMode, paymentStatus: 'SUCCESS', status: 'DELIVERED' },
      { new: true }
    ).lean();
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    // Targeted room emit for payment
    const paidOrder = order as any;
    if (paidOrder?.shopId) emitToShop(req, paidOrder.shopId, 'order_updated', order);
    if (paidOrder?.customerId) emitToUser(req, String(paidOrder.customerId), 'order_updated', order);

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

// Used if we want to run this service independently
if (require.main === module) {
  const express = require('express');
  const app = express();
  app.use(express.json());
  app.use('/orders', router);

  const { connectDB } = require('@wow/shared');
  connectDB().then(() => {
    const port = process.env.PORT || 3003;
    app.listen(port, () => console.log(`Order Service running on port ${port}`));
  });
}

export default router;
