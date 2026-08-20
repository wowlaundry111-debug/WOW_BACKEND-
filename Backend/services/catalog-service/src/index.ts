import { Router, Request, Response } from 'express';
import { Category, Item, Shop, Offer, requireAuth, requireRole, AuthRequest } from '@wow/shared';

const router = Router();

// Get all shops — public fields only, no financial data
router.get('/shops', async (req: Request, res: Response) => {
  try {
    const shops = await Shop.find({})
      .select('_id name branches isOpen instructions pickupTimings contactNumber washPreferences minOrderValue taxPercent deliveryFee')
      .lean();
    res.json(shops);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch shops' });
  }
});

// Get shop details (includes payment info for admins fetching their own shop)
router.get('/shops/:shopId', async (req: Request, res: Response) => {
  try {
    const shop = await Shop.findById(req.params.shopId).lean();
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    res.json(shop);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch shop' });
  }
});

// Add a new shop (SuperAdmin only)
router.post('/shops', requireAuth, requireRole(['SuperAdmin']), async (req: AuthRequest, res: Response) => {
  try {
    const { name, branches, paymentInfo } = req.body;
    const shop = await Shop.create({
      name,
      ownerId: req.user?._id || 'super_admin_1',
      branches: branches || [],
      paymentInfo: paymentInfo || {}
    });
    res.status(201).json(shop);
  } catch (err) {
    console.error('Failed to create shop:', err);
    res.status(500).json({ error: 'Failed to create shop' });
  }
});

// Update a shop — whitelist allowed fields
router.patch('/shops/:shopId', requireAuth, requireRole(['SuperAdmin', 'ShopAdmin']), async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role === 'ShopAdmin' && req.user!.shopId !== req.params.shopId) {
      return res.status(403).json({ error: 'Forbidden: Cannot update other shops' });
    }

    const allowed = [
      'name', 'branches', 'paymentInfo', 'isOpen', 'instructions',
      'pickupTimings', 'contactNumber', 'washPreferences',
      'minOrderValue', 'taxPercent', 'deliveryFee'
    ];
    const updates: Record<string, any> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const shop = await Shop.findByIdAndUpdate(req.params.shopId, updates, { new: true }).lean();
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    res.json(shop);
  } catch (err) {
    console.error('Failed to update shop:', err);
    res.status(500).json({ error: 'Failed to update shop' });
  }
});

// Delete a shop (SuperAdmin only)
router.delete('/shops/:shopId', requireAuth, requireRole(['SuperAdmin']), async (req: AuthRequest, res: Response) => {
  try {
    const shop = await Shop.findByIdAndDelete(req.params.shopId).lean();
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    res.json({ message: 'Shop deleted successfully' });
  } catch (err) {
    console.error('Failed to delete shop:', err);
    res.status(500).json({ error: 'Failed to delete shop' });
  }
});

// Combined catalog endpoint — single round-trip for categories + items
router.get('/shops/:shopId/catalog', async (req: Request, res: Response) => {
  try {
    const { shopId } = req.params;
    const [categories, items] = await Promise.all([
      Category.find({ shopId, isActive: true }).lean(),
      Item.find({ shopId, isActive: true }).lean(),
    ]);
    res.json({ categories, items });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch catalog' });
  }
});

// Get all categories for a shop
router.get('/shops/:shopId/categories', async (req: Request, res: Response) => {
  try {
    const categories = await Category.find({ shopId: req.params.shopId, isActive: true }).lean();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get all items for a shop
router.get('/shops/:shopId/items', async (req: Request, res: Response) => {
  try {
    const items = await Item.find({ shopId: req.params.shopId, isActive: true }).lean();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// Add a category (Admin only)
router.post('/categories', requireAuth, requireRole(['ShopAdmin', 'SuperAdmin']), async (req: AuthRequest, res: Response) => {
  try {
    const { shopId, name, image } = req.body;
    const category = await Category.create({ shopId, name, image, isActive: true });
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update a category — whitelist fields
router.patch('/categories/:id', requireAuth, requireRole(['ShopAdmin', 'SuperAdmin']), async (req: AuthRequest, res: Response) => {
  try {
    const allowed = ['name', 'image', 'isActive'];
    const updates: Record<string, any> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const category = await Category.findByIdAndUpdate(req.params.id, updates, { new: true }).lean();
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete a category (Admin only)
router.delete('/categories/:id', requireAuth, requireRole(['ShopAdmin', 'SuperAdmin']), async (req: AuthRequest, res: Response) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id).lean();
    if (!category) return res.status(404).json({ error: 'Category not found' });
    await Item.deleteMany({ categoryId: req.params.id });
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Add an item (Admin only)
router.post('/items', requireAuth, requireRole(['ShopAdmin', 'SuperAdmin']), async (req: AuthRequest, res: Response) => {
  try {
    const { shopId, categoryId, name, price, pricePerKg, pricePerItem, description, image } = req.body;
    const item = await Item.create({ shopId, categoryId, name, price, pricePerKg, pricePerItem, description, image, isActive: true });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// Update an item — whitelist fields
router.patch('/items/:id', requireAuth, requireRole(['ShopAdmin', 'SuperAdmin']), async (req: AuthRequest, res: Response) => {
  try {
    const allowed = ['name', 'description', 'pricePerItem', 'pricePerKg', 'image', 'isActive', 'categoryId'];
    const updates: Record<string, any> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const item = await Item.findByIdAndUpdate(req.params.id, updates, { new: true }).lean();
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Delete an item (Admin only)
router.delete('/items/:id', requireAuth, requireRole(['ShopAdmin', 'SuperAdmin']), async (req: AuthRequest, res: Response) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id).lean();
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// Get offers — filtered by shopId when provided
router.get('/offers', async (req: Request, res: Response) => {
  try {
    const query: Record<string, any> = {};
    if (req.query.shopId) query.shopId = req.query.shopId;
    const offers = await Offer.find(query).lean();
    res.json(offers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch offers' });
  }
});

// Create an offer (Admin only)
router.post('/offers', requireAuth, requireRole(['ShopAdmin', 'SuperAdmin']), async (req: AuthRequest, res: Response) => {
  try {
    const { shopId, code, discountPercent, maxDiscount, minOrderValue, description } = req.body;
    const targetShopId = req.user!.role === 'ShopAdmin' ? req.user!.shopId : shopId;
    const offer = await Offer.create({
      shopId: targetShopId,
      code: code.toUpperCase(),
      discountPercent,
      maxDiscount,
      minOrderValue,
      description,
    });
    res.status(201).json(offer);
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'An offer with this code already exists for this shop' });
    }
    console.error('Failed to create offer:', err);
    res.status(500).json({ error: 'Failed to create offer' });
  }
});

// Update an offer (Admin only)
router.patch('/offers/:id', requireAuth, requireRole(['ShopAdmin', 'SuperAdmin']), async (req: AuthRequest, res: Response) => {
  try {
    const allowed = ['code', 'discountPercent', 'maxDiscount', 'minOrderValue', 'description', 'isActive'];
    const updates: Record<string, any> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (updates.code) updates.code = updates.code.toUpperCase();
    const offer = await Offer.findByIdAndUpdate(req.params.id, updates, { new: true }).lean();
    if (!offer) return res.status(404).json({ error: 'Offer not found' });
    res.json(offer);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update offer' });
  }
});

// Delete an offer (Admin only)
router.delete('/offers/:id', requireAuth, requireRole(['ShopAdmin', 'SuperAdmin']), async (req: AuthRequest, res: Response) => {
  try {
    const offer = await Offer.findByIdAndDelete(req.params.id).lean();
    if (!offer) return res.status(404).json({ error: 'Offer not found' });
    res.json({ message: 'Offer deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete offer' });
  }
});

// Used if we want to run this service independently
if (require.main === module) {
  const express = require('express');
  const app = express();
  app.use(express.json());
  app.use('/catalog', router);

  const { connectDB } = require('@wow/shared');
  connectDB().then(() => {
    const port = process.env.PORT || 3002;
    app.listen(port, () => console.log(`Catalog Service running on port ${port}`));
  });
}

export default router;
