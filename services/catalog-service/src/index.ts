import { Router, Request, Response } from 'express';
import { Category, Item, Shop, Offer, requireAuth, requireRole, AuthRequest, catalogCache, log } from '@wow/shared';

const router = Router();

// ── Cache TTLs ────────────────────────────────────────────────────────────────
const SHOPS_LIST_TTL   = 60_000;  // 60 seconds — shop list changes rarely
const CATALOG_TTL      = 30_000;  // 30 seconds — catalog called on every app open
const OFFERS_TTL       = 60_000;  // 60 seconds

// ── HTTP Cache Headers Helper ─────────────────────────────────────────────────
// stale-while-revalidate: browser/CDN serves old response INSTANTLY while
// refreshing in the background. Repeat loads feel like 0ms.
import crypto from 'crypto';

function setCacheHeaders(res: Response, data: unknown, maxAge: number, staleWhileRevalidate: number) {
  const etag = `"${crypto.createHash('sha1').update(JSON.stringify(data)).digest('hex').slice(0, 16)}"`;
  res.setHeader('Cache-Control', `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`);
  res.setHeader('ETag', etag);
  res.setHeader('Vary', 'Accept-Encoding');
  return etag;
}

function sendWithCache(req: Request, res: Response, data: unknown, maxAge: number, swr: number) {
  const etag = setCacheHeaders(res, data, maxAge, swr);
  if (req.headers['if-none-match'] === etag) {
    return res.status(304).end(); // 0 bytes — browser uses its cached copy
  }
  res.json(data);
}

// ── Socket Event Helper ───────────────────────────────────────────────────────
const emitSocketEvent = (req: Request, event: string, data: any) => {
  const io = req.app.get('io');
  if (io) io.emit(event, data);
};

// Evict any legacy un-sanitized shops:list cache on service startup
catalogCache.delete('shops:list').catch?.(() => {});

// ── Public Sanitizer Helper ───────────────────────────────────────────────────
// Strips sensitive banking information (accountNo, bankName) from public responses.
// Only keeps upiId and qrValue if configured (used by delivery collection).
const sanitizeShopForPublic = (shop: any) => {
  if (!shop) return shop;
  const { paymentInfo, ...rest } = shop;
  const sanitized: any = { ...rest };
  if (paymentInfo && (paymentInfo.upiId || paymentInfo.qrValue)) {
    sanitized.paymentInfo = {
      upiId: paymentInfo.upiId || '',
      qrValue: paymentInfo.qrValue || '',
    };
  }
  return sanitized;
};

// ── GET /shops/admin/all — all shops with full admin details (SuperAdmin only) ──
// Defined before /shops/:shopId to avoid route param collision.
router.get('/shops/admin/all', requireAuth, requireRole(['SuperAdmin']), async (req: AuthRequest, res: Response) => {
  try {
    const shops = await Shop.find({}).lean();
    res.json(shops);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch admin shops' });
  }
});

// ── GET /shops — cached shop list ─────────────────────────────────────────────
// Hottest public read — every customer app open hits this.
router.get('/shops', async (req: Request, res: Response) => {
  try {
    const CACHE_KEY = 'shops:list';
    const cached = await catalogCache.get(CACHE_KEY);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return sendWithCache(req, res, cached, 30, 60);
    }

    const rawShops = await Shop.find({})
      .select('_id name branches isOpen instructions pickupTimings contactNumber washPreferences minOrderValue taxPercent deliveryFee paymentInfo promoBanners promoCode androidAppUrl iosAppUrl')
      .lean();

    const shops = rawShops.map(sanitizeShopForPublic);

    await catalogCache.set(CACHE_KEY, shops, SHOPS_LIST_TTL);
    res.setHeader('X-Cache', 'MISS');
    return sendWithCache(req, res, shops, 30, 60);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch shops' });
  }
});

// ── GET /shops/:shopId/admin — single shop with full admin/bank details ────────
router.get('/shops/:shopId/admin', requireAuth, requireRole(['SuperAdmin', 'ShopAdmin']), async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role === 'ShopAdmin' && req.user!.shopId !== req.params.shopId) {
      return res.status(403).json({ error: 'Forbidden: Cannot access other shop settings' });
    }
    const shop = await Shop.findById(req.params.shopId).lean();
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    res.json(shop);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch shop admin settings' });
  }
});

// ── GET /shops/:shopId — single shop (sanitized for public) ───────────────────
router.get('/shops/:shopId', async (req: Request, res: Response) => {
  try {
    const CACHE_KEY = `shop:${req.params.shopId}`;
    const cached = await catalogCache.get(CACHE_KEY);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return sendWithCache(req, res, cached, 30, 60);
    }

    const shop = await Shop.findById(req.params.shopId).lean();
    if (!shop) return res.status(404).json({ error: 'Shop not found' });

    const sanitizedShop = sanitizeShopForPublic(shop);

    await catalogCache.set(CACHE_KEY, sanitizedShop, SHOPS_LIST_TTL);
    res.setHeader('X-Cache', 'MISS');
    return sendWithCache(req, res, sanitizedShop, 30, 60);
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
    await catalogCache.delete('shops:list');
    res.status(201).json(shop);
    emitSocketEvent(req, 'shop_created', sanitizeShopForPublic(shop));
  } catch (err: any) {
    log.error('Failed to create shop', { error: err.message });
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
      'pickupTimings', 'contactNumber', 'washPreferences', 'promoBanners', 'promoCode',
      'minOrderValue', 'taxPercent', 'deliveryFee', 'androidAppUrl', 'iosAppUrl',
    ];

    const updates: Record<string, any> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    // Preserve existing sensitive fields if paymentInfo is partially updated
    if (req.body.paymentInfo !== undefined) {
      const existingShop = (await Shop.findById(req.params.shopId).lean()) as any;
      const existingPayment = existingShop?.paymentInfo || {};
      updates.paymentInfo = {
        ...existingPayment,
        ...req.body.paymentInfo,
      };
    }

    const shop = await Shop.findByIdAndUpdate(req.params.shopId, updates, { new: true }).lean();
    if (!shop) return res.status(404).json({ error: 'Shop not found' });

    // Sync with Offer collection if promoCode is updated
    if (req.body.promoCode && req.body.promoCode.code) {
      try {
        await Offer.findOneAndUpdate(
          { shopId: req.params.shopId, code: String(req.body.promoCode.code).trim().toUpperCase() },
          {
            shopId: req.params.shopId,
            code: String(req.body.promoCode.code).trim().toUpperCase(),
            discountPercent: Number(req.body.promoCode.discountPercent) || 0,
            maxDiscount: Number(req.body.promoCode.maxDiscount) || 0,
            minOrderValue: Number(req.body.promoCode.minOrderValue) || 0,
            description: req.body.promoCode.description || '',
            isActive: req.body.promoCode.isActive !== false,
          },
          { upsert: true, new: true }
        );
        await catalogCache.delete(`offers:${req.params.shopId}`);
        await catalogCache.delete('offers:all');
      } catch (syncErr: any) {
        log.warn('Failed to sync Offer model', { error: syncErr.message });
      }
    }

    // Invalidate both the list cache and this shop's individual cache
    await catalogCache.delete('shops:list');
    await catalogCache.delete(`shop:${req.params.shopId}`);
    await catalogCache.delete(`catalog:${req.params.shopId}`);

    res.json(shop);
    emitSocketEvent(req, 'shop_updated', sanitizeShopForPublic(shop));
  } catch (err: any) {
    log.error('Failed to update shop', { error: err.message });
    res.status(500).json({ error: 'Failed to update shop' });
  }
});

// ── DELETE /shops/:shopId ─────────────────────────────────────────────────────
router.delete('/shops/:shopId', requireAuth, requireRole(['SuperAdmin']), async (req: AuthRequest, res: Response) => {
  try {
    const shop = await Shop.findByIdAndDelete(req.params.shopId).lean();
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    await catalogCache.delete('shops:list');
    await catalogCache.delete(`shop:${req.params.shopId}`);
    await catalogCache.delete(`catalog:${req.params.shopId}`);
    res.json({ message: 'Shop deleted successfully' });
    emitSocketEvent(req, 'shop_deleted', { shopId: req.params.shopId });
  } catch (err: any) {
    log.error('Failed to delete shop', { error: err.message });
    res.status(500).json({ error: 'Failed to delete shop' });
  }
});

// ── GET /shops/:shopId/catalog — combined cached endpoint ─────────────────────
// Single round-trip for categories + items. Most frequently called endpoint.
// Returns categories in a hierarchical structure with subCategories[] populated.
router.get('/shops/:shopId/catalog', async (req: Request, res: Response) => {
  try {
    const { shopId } = req.params;
    const CACHE_KEY = `catalog:${shopId}`;

    const cached = await catalogCache.get(CACHE_KEY);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return sendWithCache(req, res, cached, 30, 60);
    }

    const [allCategories, items] = await Promise.all([
      Category.find({ shopId, isActive: true }).lean(),
      Item.find({ shopId, isActive: true }).lean(),
    ]);

    // Build hierarchical structure: top-level cats get subCategories[] populated
    const catMap: Record<string, any> = {};
    const topLevel: any[] = [];

    for (const cat of allCategories) {
      const c = cat as any;
      const cId = String(c._id);
      catMap[cId] = {
        ...c,
        _id: cId,
        parentCategoryId: c.parentCategoryId ? String(c.parentCategoryId) : null,
        singleItemSelection: Boolean(c.singleItemSelection),
        subCategories: []
      };
    }
    for (const cat of allCategories) {
      const c = cat as any;
      const cId = String(c._id);
      const pId = c.parentCategoryId ? String(c.parentCategoryId) : null;
      if (pId && catMap[pId]) {
        catMap[pId].subCategories.push(catMap[cId]);
      } else {
        topLevel.push(catMap[cId]);
      }
    }

    // Return all categories (with subCategories populated on parents) so flat lookups
    // (find by ID, filter by parentCategoryId, breadcrumbs) work seamlessly everywhere,
    // while also providing categoriesTree for tree-based consumers.
    const allEnrichedCategories = allCategories.map((c: any) => catMap[String(c._id)]);
    const safeItems = items.map((i: any) => ({
      ...i,
      _id: String(i._id),
      categoryId: String(i.categoryId),
      shopId: String(i.shopId)
    }));
    const result = { categories: allEnrichedCategories, categoriesTree: topLevel, items: safeItems };
    await catalogCache.set(CACHE_KEY, result, CATALOG_TTL);
    res.setHeader('X-Cache', 'MISS');
    return sendWithCache(req, res, result, 30, 60);
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
    const { shopId, name, image, parentCategoryId, singleItemSelection } = req.body;

    // Validate parent exists in same shop (if provided)
    if (parentCategoryId) {
      const parent = await Category.findById(parentCategoryId).lean() as any;
      if (!parent) return res.status(404).json({ error: 'Parent category not found' });
      if (parent.shopId !== shopId) return res.status(400).json({ error: 'Parent category belongs to a different shop' });
      // Prevent nesting beyond 2 levels (parent must be top-level)
      if (parent.parentCategoryId) return res.status(400).json({ error: 'Sub-categories can only be one level deep' });
    }

    const category = await Category.create({ shopId, name, image, isActive: true, parentCategoryId: parentCategoryId || null, singleItemSelection: Boolean(singleItemSelection) });
    // Invalidate catalog cache for this shop
    await catalogCache.delete(`catalog:${shopId}`);
    res.status(201).json(category);
    emitSocketEvent(req, 'category_created', category);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// ── PATCH /categories/:id ─────────────────────────────────────────────────────
router.patch('/categories/:id', requireAuth, requireRole(['ShopAdmin', 'SuperAdmin']), async (req: AuthRequest, res: Response) => {
  try {
    const allowed = ['name', 'image', 'isActive', 'parentCategoryId', 'singleItemSelection'];
    const updates: Record<string, any> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const category = await Category.findByIdAndUpdate(req.params.id, updates, { new: true }).lean() as any;
    if (!category) return res.status(404).json({ error: 'Category not found' });
    // Invalidate catalog cache
    if (category.shopId) await catalogCache.delete(`catalog:${category.shopId}`);
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
    // Cascade: delete sub-categories and their items
    const subCats = await Category.find({ parentCategoryId: req.params.id }).lean() as any[];
    for (const sub of subCats) {
      await Item.deleteMany({ categoryId: sub._id });
      await Category.findByIdAndDelete(sub._id);
    }
    await Item.deleteMany({ categoryId: req.params.id });
    if (category.shopId) await catalogCache.delete(`catalog:${category.shopId}`);
    res.json({ message: 'Category deleted successfully' });
    emitSocketEvent(req, 'category_deleted', { categoryId: req.params.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// ── GET /categories/:id/subcategories — lazy-load sub-categories ──────────────
router.get('/categories/:id/subcategories', async (req: Request, res: Response) => {
  try {
    const subCategories = await Category.find({ parentCategoryId: req.params.id, isActive: true }).lean();
    res.json(subCategories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sub-categories' });
  }
});

// ── POST /items ───────────────────────────────────────────────────────────────
router.post('/items', requireAuth, requireRole(['ShopAdmin', 'SuperAdmin']), async (req: AuthRequest, res: Response) => {
  try {
    const { shopId, categoryId, name, price, pricePerKg, pricePerItem, description, image, isBucket } = req.body;

    if (!categoryId) {
      return res.status(400).json({ error: 'Target sub-category ID is required' });
    }

    // Items can be created inside sub-categories or direct categories
    const targetCategory = await Category.findById(categoryId).lean() as any;
    if (!targetCategory) {
      return res.status(404).json({ error: 'Selected category does not exist' });
    }

    const item = await Item.create({ shopId, categoryId, name, price, pricePerKg, pricePerItem, description, image, isActive: true, isBucket: !!isBucket });
    if (shopId) await catalogCache.delete(`catalog:${shopId}`);
    res.status(201).json(item);
    emitSocketEvent(req, 'item_created', item);
  } catch (err: any) {
    log.error('Failed to create item', { error: err.message });
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// ── PATCH /items/:id ──────────────────────────────────────────────────────────
router.patch('/items/:id', requireAuth, requireRole(['ShopAdmin', 'SuperAdmin']), async (req: AuthRequest, res: Response) => {
  try {
    const allowed = ['name', 'description', 'pricePerItem', 'pricePerKg', 'image', 'isActive', 'categoryId', 'isBucket'];
    const updates: Record<string, any> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (updates.categoryId) {
      const targetCategory = await Category.findById(updates.categoryId).lean() as any;
      if (!targetCategory) {
        return res.status(404).json({ error: 'Target category does not exist' });
      }
      if (!targetCategory.parentCategoryId) {
        return res.status(400).json({
          error: 'Items can only belong to a sub-category. Please select a valid sub-category.'
        });
      }
    }

    const item = await Item.findByIdAndUpdate(req.params.id, updates, { new: true }).lean() as any;
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.shopId) await catalogCache.delete(`catalog:${item.shopId}`);
    res.json(item);
    emitSocketEvent(req, 'item_updated', item);
  } catch (err: any) {
    log.error('Failed to update item', { error: err.message });
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// ── DELETE /items/:id ─────────────────────────────────────────────────────────
router.delete('/items/:id', requireAuth, requireRole(['ShopAdmin', 'SuperAdmin']), async (req: AuthRequest, res: Response) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id).lean() as any;
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.shopId) await catalogCache.delete(`catalog:${item.shopId}`);
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
    const cached = await catalogCache.get(CACHE_KEY);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    const query: Record<string, any> = {};
    if (shopId) query.shopId = shopId;
    const offers = await Offer.find(query).lean();

    await catalogCache.set(CACHE_KEY, offers, OFFERS_TTL);
    res.setHeader('X-Cache', 'MISS');
    return sendWithCache(req, res, offers, 60, 120);
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
    await catalogCache.delete(`offers:${targetShopId}`);
    await catalogCache.delete('offers:all');
    res.status(201).json(offer);
    emitSocketEvent(req, 'offer_created', offer);
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'An offer with this code already exists for this shop' });
    }
    log.error('Failed to create offer', { error: err.message });
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
    await catalogCache.delete(`offers:${offer.shopId}`);
    await catalogCache.delete('offers:all');
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
    await catalogCache.delete(`offers:${offer.shopId}`);
    await catalogCache.delete('offers:all');
    res.json({ message: 'Offer deleted successfully' });
    emitSocketEvent(req, 'offer_deleted', { offerId: req.params.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete offer' });
  }
});

export default router;
