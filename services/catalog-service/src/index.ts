import { Router, Request, Response } from 'express';
import { Category, Item, Shop, Offer, requireAuth, requireRole, AuthRequest, catalogCache } from '@wow/shared';

const router = Router();

// ── Cache TTLs ────────────────────────────────────────────────────────────────
const SHOPS_LIST_TTL   = 60_000;  // 60 seconds — shop list changes rarely
const CATALOG_TTL      = 30_000;  // 30 seconds — catalog called on every app open
const OFFERS_TTL       = 60_000;  // 60 seconds

// ── Socket Event Helper ───────────────────────────────────────────────────────
const emitSocketEvent = (req: Request, event: string, data: any) => {
  const io = req.app.get('io');
  if (io) io.emit(event, data);
};

// ── GET /shops — cached shop list ─────────────────────────────────────────────
// Hottest public read — every customer app open hits this.
router.get('/shops', async (req: Request, res: Response) => {
  try {
    const CACHE_KEY = 'shops:list';
    const cached = catalogCache.get(CACHE_KEY);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    const shops = await Shop.find({})
      .select('_id name branches isOpen instructions pickupTimings contactNumber washPreferences minOrderValue taxPercent deliveryFee paymentInfo promoBanners androidAppUrl iosAppUrl')
      .lean();

    catalogCache.set(CACHE_KEY, shops, SHOPS_LIST_TTL);
    res.setHeader('X-Cache', 'MISS');
    res.json(shops);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch shops' });
  }
});

// ── GET /shops/:shopId — single shop ──────────────────────────────────────────
router.get('/shops/:shopId', async (req: Request, res: Response) => {
  try {
    const CACHE_KEY = `shop:${req.params.shopId}`;
    const cached = catalogCache.get(CACHE_KEY);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    const shop = await Shop.findById(req.params.shopId).lean();
    if (!shop) return res.status(404).json({ error: 'Shop not found' });

    catalogCache.set(CACHE_KEY, shop, SHOPS_LIST_TTL);
    res.setHeader('X-Cache', 'MISS');
    res.json(shop);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch shop' });
  }
});

// ── POST /shops — create shop (SuperAdmin only) ───────────────────────────────
router.post('/shops', requireAuth, requireRole(['SuperAdmin']), async (req: AuthRequest, res: Response) => {
  try {
    const { name, branches, paymentInfo } = req.body;
    const shop = await Shop.create({
      name,
      ownerId: req.user?._id || 'super_admin_1',
      branches: branches || [],
      paymentInfo: paymentInfo || {},
    });
    // Invalidate shop list cache
    catalogCache.delete('shops:list');
    res.status(201).json(shop);
    emitSocketEvent(req, 'shop_created', shop);
  } catch (err) {
    console.error('Failed to create shop:', err);
    res.status(500).json({ error: 'Failed to create shop' });
  }
});

// ── PATCH /shops/:shopId — update shop ───────────────────────────────────────
router.patch('/shops/:shopId', requireAuth, requireRole(['SuperAdmin', 'ShopAdmin']), async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role === 'ShopAdmin' && req.user!.shopId !== req.params.shopId) {
      return res.status(403).json({ error: 'Forbidden: Cannot update other shops' });
    }

    // Validate UPI ID format if provided and non-empty
    if (req.body.paymentInfo?.upiId && req.body.paymentInfo.upiId.trim().length > 0) {
      const upiId = req.body.paymentInfo.upiId.trim();
      const UPI_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.\-_]+$/;
      if (!UPI_REGEX.test(upiId)) {
        return res.status(400).json({ error: 'Invalid UPI ID format. Expected format: yourname@bankname (e.g. rahul@okaxis)' });
      }
      if (!req.body.paymentInfo.qrValue) {
        req.body.paymentInfo.qrValue = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(req.body.paymentInfo.bankName || 'WOW Laundry')}&cu=INR`;
      }
    }

    const allowed = [
      'name', 'branches', 'paymentInfo', 'isOpen', 'instructions',
      'pickupTimings', 'contactNumber', 'washPreferences', 'promoBanners',
      'minOrderValue', 'taxPercent', 'deliveryFee', 'androidAppUrl', 'iosAppUrl',
    ];

    const updates: Record<string, any> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const shop = await Shop.findByIdAndUpdate(req.params.shopId, updates, { new: true }).lean();
    if (!shop) return res.status(404).json({ error: 'Shop not found' });

    // Invalidate both the list cache and this shop's individual cache
    catalogCache.delete('shops:list');
    catalogCache.delete(`shop:${req.params.shopId}`);
    catalogCache.delete(`catalog:${req.params.shopId}`);

    res.json(shop);
    emitSocketEvent(req, 'shop_updated', shop);
  } catch (err) {
    console.error('Failed to update shop:', err);
    res.status(500).json({ error: 'Failed to update shop' });
  }
});

// ── DELETE /shops/:shopId ─────────────────────────────────────────────────────
router.delete('/shops/:shopId', requireAuth, requireRole(['SuperAdmin']), async (req: AuthRequest, res: Response) => {
  try {
    const shop = await Shop.findByIdAndDelete(req.params.shopId).lean();
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    catalogCache.delete('shops:list');
    catalogCache.delete(`shop:${req.params.shopId}`);
    catalogCache.delete(`catalog:${req.params.shopId}`);
    res.json({ message: 'Shop deleted successfully' });
    emitSocketEvent(req, 'shop_deleted', { shopId: req.params.shopId });
  } catch (err) {
    console.error('Failed to delete shop:', err);
    res.status(500).json({ error: 'Failed to delete shop' });
  }
});

// ── GET /shops/:shopId/catalog — combined cached endpoint ─────────────────────
// Single round-trip for categories + items. Most frequently called endpoint.
router.get('/shops/:shopId/catalog', async (req: Request, res: Response) => {
  try {
    const { shopId } = req.params;
    const CACHE_KEY = `catalog:${shopId}`;

    const cached = catalogCache.get(CACHE_KEY);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    const [categories, items] = await Promise.all([
      Category.find({ shopId, isActive: true }).lean(),
      Item.find({ shopId, isActive: true }).lean(),
    ]);

    const result = { categories, items };
    catalogCache.set(CACHE_KEY, result, CATALOG_TTL);
    res.setHeader('X-Cache', 'MISS');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch catalog' });
  }
});

// ── GET /shops/:shopId/categories ────────────────────────────────────────────
router.get('/shops/:shopId/categories', async (req: Request, res: Response) => {
  try {
    const categories = await Category.find({ shopId: req.params.shopId, isActive: true }).lean();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// ── GET /shops/:shopId/items ──────────────────────────────────────────────────
router.get('/shops/:shopId/items', async (req: Request, res: Response) => {
  try {
    const items = await Item.find({ shopId: req.params.shopId, isActive: true }).lean();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// ── POST /categories ──────────────────────────────────────────────────────────
router.post('/categories', requireAuth, requireRole(['ShopAdmin', 'SuperAdmin']), async (req: AuthRequest, res: Response) => {
  try {
    const { shopId, name, image } = req.body;
    const category = await Category.create({ shopId, name, image, isActive: true });
    // Invalidate catalog cache for this shop
    catalogCache.delete(`catalog:${shopId}`);
    res.status(201).json(category);
    emitSocketEvent(req, 'category_created', category);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// ── PATCH /categories/:id ─────────────────────────────────────────────────────
router.patch('/categories/:id', requireAuth, requireRole(['ShopAdmin', 'SuperAdmin']), async (req: AuthRequest, res: Response) => {
  try {
    const allowed = ['name', 'image', 'isActive'];
    const updates: Record<string, any> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const category = await Category.findByIdAndUpdate(req.params.id, updates, { new: true }).lean() as any;
    if (!category) return res.status(404).json({ error: 'Category not found' });
    // Invalidate catalog cache
    if (category.shopId) catalogCache.delete(`catalog:${category.shopId}`);
    res.json(category);
    emitSocketEvent(req, 'category_updated', category);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// ── DELETE /categories/:id ────────────────────────────────────────────────────
router.delete('/categories/:id', requireAuth, requireRole(['ShopAdmin', 'SuperAdmin']), async (req: AuthRequest, res: Response) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id).lean() as any;
    if (!category) return res.status(404).json({ error: 'Category not found' });
    await Item.deleteMany({ categoryId: req.params.id });
    if (category.shopId) catalogCache.delete(`catalog:${category.shopId}`);
    res.json({ message: 'Category deleted successfully' });
    emitSocketEvent(req, 'category_deleted', { categoryId: req.params.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// ── POST /items ───────────────────────────────────────────────────────────────
router.post('/items', requireAuth, requireRole(['ShopAdmin', 'SuperAdmin']), async (req: AuthRequest, res: Response) => {
  try {
    const { shopId, categoryId, name, price, pricePerKg, pricePerItem, description, image } = req.body;
    const item = await Item.create({ shopId, categoryId, name, price, pricePerKg, pricePerItem, description, image, isActive: true });
    if (shopId) catalogCache.delete(`catalog:${shopId}`);
    res.status(201).json(item);
    emitSocketEvent(req, 'item_created', item);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// ── PATCH /items/:id ──────────────────────────────────────────────────────────
router.patch('/items/:id', requireAuth, requireRole(['ShopAdmin', 'SuperAdmin']), async (req: AuthRequest, res: Response) => {
  try {
    const allowed = ['name', 'description', 'pricePerItem', 'pricePerKg', 'image', 'isActive', 'categoryId'];
    const updates: Record<string, any> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const item = await Item.findByIdAndUpdate(req.params.id, updates, { new: true }).lean() as any;
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.shopId) catalogCache.delete(`catalog:${item.shopId}`);
    res.json(item);
    emitSocketEvent(req, 'item_updated', item);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// ── DELETE /items/:id ─────────────────────────────────────────────────────────
router.delete('/items/:id', requireAuth, requireRole(['ShopAdmin', 'SuperAdmin']), async (req: AuthRequest, res: Response) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id).lean() as any;
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.shopId) catalogCache.delete(`catalog:${item.shopId}`);
    res.json({ message: 'Item deleted successfully' });
    emitSocketEvent(req, 'item_deleted', { itemId: req.params.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// ── GET /offers ───────────────────────────────────────────────────────────────
router.get('/offers', async (req: Request, res: Response) => {
  try {
    const shopId = req.query.shopId as string;
    const CACHE_KEY = shopId ? `offers:${shopId}` : 'offers:all';
    const cached = catalogCache.get(CACHE_KEY);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    const query: Record<string, any> = {};
    if (shopId) query.shopId = shopId;
    const offers = await Offer.find(query).lean();

    catalogCache.set(CACHE_KEY, offers, OFFERS_TTL);
    res.setHeader('X-Cache', 'MISS');
    res.json(offers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch offers' });
  }
});

// ── POST /offers ──────────────────────────────────────────────────────────────
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
    // Invalidate offers cache
    catalogCache.delete(`offers:${targetShopId}`);
    catalogCache.delete('offers:all');
    res.status(201).json(offer);
    emitSocketEvent(req, 'offer_created', offer);
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'An offer with this code already exists for this shop' });
    }
    console.error('Failed to create offer:', err);
    res.status(500).json({ error: 'Failed to create offer' });
  }
});

// ── PATCH /offers/:id ─────────────────────────────────────────────────────────
router.patch('/offers/:id', requireAuth, requireRole(['ShopAdmin', 'SuperAdmin']), async (req: AuthRequest, res: Response) => {
  try {
    const allowed = ['code', 'discountPercent', 'maxDiscount', 'minOrderValue', 'description', 'isActive'];
    const updates: Record<string, any> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (updates.code) updates.code = updates.code.toUpperCase();
    const offer = await Offer.findByIdAndUpdate(req.params.id, updates, { new: true }).lean() as any;
    if (!offer) return res.status(404).json({ error: 'Offer not found' });
    catalogCache.delete(`offers:${offer.shopId}`);
    catalogCache.delete('offers:all');
    res.json(offer);
    emitSocketEvent(req, 'offer_updated', offer);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update offer' });
  }
});

// ── DELETE /offers/:id ────────────────────────────────────────────────────────
router.delete('/offers/:id', requireAuth, requireRole(['ShopAdmin', 'SuperAdmin']), async (req: AuthRequest, res: Response) => {
  try {
    const offer = await Offer.findByIdAndDelete(req.params.id).lean() as any;
    if (!offer) return res.status(404).json({ error: 'Offer not found' });
    catalogCache.delete(`offers:${offer.shopId}`);
    catalogCache.delete('offers:all');
    res.json({ message: 'Offer deleted successfully' });
    emitSocketEvent(req, 'offer_deleted', { offerId: req.params.id });
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
