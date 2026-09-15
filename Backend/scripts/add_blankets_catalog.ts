import * as dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { Shop, Category, Item, connectDB } from '../packages/shared/src';

const BLANKET_ITEMS_DATA = [
  { name: 'Blanket Double Bed', pricePerItem: 300, description: '₹300 Per Unit', image: 'blanket' },
  { name: 'Blanket Single Bed', pricePerItem: 250, description: '₹250 Per Unit', image: 'blanket' },
  { name: 'Rajaai / Quilt', pricePerItem: 300, description: '₹300 Per Unit', image: 'bedding' },
  { name: 'Blanket Single / Double Ply', pricePerItem: 300, description: '₹300 Per Unit', image: 'blanket' },
  { name: 'Very Small Blanket / Winter Rajai Cover', pricePerItem: 200, description: '₹200 Per Unit', image: 'blanket' },
];

export async function addBlanketCategoryAndItems() {
  await connectDB();

  const shops = await Shop.find({}).lean();
  console.log(`Found ${shops.length} shop(s) to process.`);

  for (const shop of shops) {
    const shopId = String(shop._id);
    const shopName = shop.name || shopId;
    console.log(`\n--- Processing Shop: ${shopName} (${shopId}) ---`);

    // 1. Find or create top-level Blanket category
    let blanketCategory = await Category.findOne({
      shopId,
      parentCategoryId: null,
      name: { $regex: /^(blanket|blankets & winter items)/i }
    });

    if (!blanketCategory) {
      console.log(`Creating main category 'BLANKETS & WINTER ITEMS' for shop ${shopName}...`);
      blanketCategory = await Category.create({
        shopId,
        name: 'BLANKETS & WINTER ITEMS',
        image: 'blanket',
        parentCategoryId: null,
        isActive: true,
      });
      console.log(`Created category with ID: ${blanketCategory._id}`);
    } else {
      console.log(`Found existing category: ${blanketCategory.name} (ID: ${blanketCategory._id})`);
    }

    const categoryId = String(blanketCategory._id);

    // 2. Add or update items in this category
    for (const itemDef of BLANKET_ITEMS_DATA) {
      const existingItem = await Item.findOne({
        shopId,
        name: { $regex: new RegExp(`^${itemDef.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      });

      if (existingItem) {
        console.log(`Updating existing item: '${existingItem.name}' in category '${categoryId}'`);
        existingItem.categoryId = categoryId;
        existingItem.pricePerItem = itemDef.pricePerItem;
        existingItem.description = itemDef.description;
        existingItem.image = itemDef.image;
        existingItem.isActive = true;
        existingItem.isBucket = false;
        await existingItem.save();
      } else {
        console.log(`Creating new item: '${itemDef.name}' (₹${itemDef.pricePerItem})`);
        await Item.create({
          shopId,
          categoryId,
          name: itemDef.name,
          pricePerItem: itemDef.pricePerItem,
          description: itemDef.description,
          image: itemDef.image,
          isActive: true,
          isBucket: false,
        });
      }
    }
  }

  console.log('\nAll shops updated successfully with Blanket category & winter items!');
  await mongoose.disconnect();
}

if (require.main === module) {
  addBlanketCategoryAndItems()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error adding blanket category:', err);
      process.exit(1);
    });
}
