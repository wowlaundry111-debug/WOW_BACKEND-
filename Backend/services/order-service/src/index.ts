import { Router, Request, Response } from 'express';
import { Order, Shop, User, requireAuth, requireRole, AuthRequest, sendPushNotification } from '@wow/shared';

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

// Get orders — paginated, role-scoped
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const skip = (page - 1) * limit;

    const query: Record<string, any> = { isArchived: { $ne: true } };

    if (user.role === 'Customer') {
      query.customerId = user._id;
    } else if (['ShopAdmin', 'Delivery'].includes(user.role) && user.shopId) {
      query.shopId = user.shopId;
    }

    // Optional status filter
    if (req.query.status) query.status = req.query.status;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(query),
    ]);

    res.json({ orders, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
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

// Update order status (Admin/Delivery)
router.patch('/:orderId/status', requireAuth, requireRole(['ShopAdmin', 'SuperAdmin', 'Delivery']), async (req: AuthRequest, res: Response) => {
  try {
    const { status, paymentMode, paymentStatus } = req.body;
    const updateData: Record<string, any> = { status };
    if (paymentMode) updateData.paymentMode = paymentMode;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    const order = await Order.findByIdAndUpdate(req.params.orderId, updateData, { new: true }).lean() as any;
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Respond immediately
    res.json(order);

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
    const { deliveryBoyId, deliveryBoyName } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      { deliveryBoyId, deliveryBoyName, status: 'PICKUP_ASSIGNED' },
      { new: true }
    ).lean() as any;
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Respond immediately
    res.json(order);

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

// Verify order items (Delivery)
router.patch('/:orderId/verify', requireAuth, requireRole(['Delivery', 'ShopAdmin', 'SuperAdmin']), async (req: AuthRequest, res: Response) => {
  try {
    const { items } = req.body;
    const order = await Order.findById(req.params.orderId).lean() as any;
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const shop = await Shop.findById(order.shopId).select('taxPercent deliveryFee').lean() as any;
    const taxPercent = shop?.taxPercent || 0;
    const deliveryFeeAmt = shop?.deliveryFee || 0;

    const itemSubtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const washPrefsCost = (order.washPreferences || []).reduce((sum: number, wp: any) => sum + wp.price, 0);
    const taxAmount = (itemSubtotal * taxPercent) / 100;
    const discountAmount = order.discountAmount || 0;
    const grandTotal = itemSubtotal - discountAmount + taxAmount + deliveryFeeAmt + washPrefsCost;

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

// Record payment — persists payment status to DB
router.patch('/:orderId/payment', requireAuth, requireRole(['Delivery', 'ShopAdmin', 'SuperAdmin']), async (req: AuthRequest, res: Response) => {
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
