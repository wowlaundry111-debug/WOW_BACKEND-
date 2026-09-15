import * as dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { User, Shop, Category, Item, Offer, Order, connectDB } from '@wow/shared';

const SHOPS = [
  {
    _id: 'shop_lawgate',
    name: 'WOW Laundry Lawgate',
    ownerId: 'super_admin_1',
    branches: ['Lawgate Main'],
    contactNumber: '62808-32724',
    paymentInfo: { upiId: 'wowlawgate@upi', bankName: 'HDFC Bank', accountNo: '111122223333', qrValue: 'upi://pay?pa=wowlawgate@upi' },
  },
  {
    _id: 'shop_agi',
    name: 'WOW Laundry AGI',
    ownerId: 'super_admin_1',
    branches: ['AGI Campus'],
    contactNumber: '62808-32724',
    paymentInfo: { upiId: 'wowagi@upi', bankName: 'ICICI Bank', accountNo: '444455556666', qrValue: 'upi://pay?pa=wowagi@upi' },
  }
];

const USERS = [
  // Super Admin
  { _id: 'super_admin_1', shopId: '', role: 'SuperAdmin', name: 'Platform Owner', phone: '9999999999', email: 'superadmin@wow.com', address: 'HQ' },
  
  // Lawgate Users
  { _id: 'admin_lawgate', shopId: 'shop_lawgate', role: 'ShopAdmin', name: 'Lawgate Admin', phone: '9876543210', email: 'admin.lawgate@wow.com', address: 'Lawgate Main' },
  { _id: 'delivery_lawgate', shopId: 'shop_lawgate', role: 'Delivery', name: 'Lawgate Delivery', phone: '9000000001', email: 'delivery.lawgate@wow.com', address: 'Lawgate Area' },
  { _id: 'customer_lawgate', shopId: 'shop_lawgate', role: 'Customer', name: 'Lawgate Customer', phone: '9000000002', email: 'customer.lawgate@wow.com', address: 'Hostel 1' },

  // AGI Users
  { _id: 'admin_agi', shopId: 'shop_agi', role: 'ShopAdmin', name: 'AGI Admin', phone: '9876543211', email: 'admin.agi@wow.com', address: 'AGI Campus' },
  { _id: 'delivery_agi', shopId: 'shop_agi', role: 'Delivery', name: 'AGI Delivery', phone: '9000000011', email: 'delivery.agi@wow.com', address: 'AGI Area' },
  { _id: 'customer_agi', shopId: 'shop_agi', role: 'Customer', name: 'AGI Customer', phone: '9000000012', email: 'customer.agi@wow.com', address: 'Hostel A' },
];

const CATEGORIES = [
  // Lawgate (Jalandhar) Categories
  { _id: 'cat_lg_laundry', shopId: 'shop_lawgate', name: 'LAUNDRY', image: 'normal' },
  { _id: 'cat_lg_sub_reg', shopId: 'shop_lawgate', parentCategoryId: 'cat_lg_laundry', name: 'REGULAR WASH', image: 'normal' },
  { _id: 'cat_lg_sub_exp', shopId: 'shop_lawgate', parentCategoryId: 'cat_lg_laundry', name: 'EXPRESS WASH', image: 'easyWash' },

  { _id: 'cat_lg_dryclean', shopId: 'shop_lawgate', name: 'DRY CLEAN', image: 'dryClean' },
  { _id: 'cat_lg_sub_men', shopId: 'shop_lawgate', parentCategoryId: 'cat_lg_dryclean', name: "MEN'S WEAR", image: 'suits' },
  { _id: 'cat_lg_sub_women', shopId: 'shop_lawgate', parentCategoryId: 'cat_lg_dryclean', name: "WOMEN'S WEAR", image: 'wedding_dress' },
  { _id: 'cat_lg_sub_house', shopId: 'shop_lawgate', parentCategoryId: 'cat_lg_dryclean', name: 'HOUSEHOLD ITEMS', image: 'bedding' },
  { _id: 'cat_lg_sub_shoes', shopId: 'shop_lawgate', parentCategoryId: 'cat_lg_dryclean', name: 'SHOES', image: 'shoes' },
  { _id: 'cat_lg_sub_bags', shopId: 'shop_lawgate', parentCategoryId: 'cat_lg_dryclean', name: 'BAGS & OTHER ITEMS', image: 'bag' },

  { _id: 'cat_lg_blanket', shopId: 'shop_lawgate', name: 'BLANKETS', image: 'blanket' },

  // AGI Categories
  { _id: 'cat_agi_laundry', shopId: 'shop_agi', name: 'LAUNDRY', image: 'normal' },
  { _id: 'cat_agi_sub_reg', shopId: 'shop_agi', parentCategoryId: 'cat_agi_laundry', name: 'REGULAR WASH', image: 'normal' },
  { _id: 'cat_agi_sub_exp', shopId: 'shop_agi', parentCategoryId: 'cat_agi_laundry', name: 'EXPRESS WASH', image: 'easyWash' },

  { _id: 'cat_agi_dryclean', shopId: 'shop_agi', name: 'DRY CLEAN', image: 'dryClean' },
  { _id: 'cat_agi_sub_men', shopId: 'shop_agi', parentCategoryId: 'cat_agi_dryclean', name: "MEN'S WEAR", image: 'suits' },
  { _id: 'cat_agi_sub_women', shopId: 'shop_agi', parentCategoryId: 'cat_agi_dryclean', name: "WOMEN'S WEAR", image: 'wedding_dress' },
  { _id: 'cat_agi_sub_house', shopId: 'shop_agi', parentCategoryId: 'cat_agi_dryclean', name: 'HOUSEHOLD ITEMS', image: 'bedding' },
  { _id: 'cat_agi_sub_shoes', shopId: 'shop_agi', parentCategoryId: 'cat_agi_dryclean', name: 'SHOES', image: 'shoes' },
  { _id: 'cat_agi_sub_bags', shopId: 'shop_agi', parentCategoryId: 'cat_agi_dryclean', name: 'BAGS & OTHER ITEMS', image: 'bag' },

  { _id: 'cat_agi_blanket', shopId: 'shop_agi', name: 'BLANKETS', image: 'blanket' },
];

const createItemsForShop = (shopId: string, p: string) => [
  // Laundry — Regular Wash
  { _id: `item_${p}_wf_1`, shopId, categoryId: `cat_${p}_sub_reg`, name: 'WASH + FOLD', description: 'TIME 72 HRS', pricePerKg: 50, isBucket: true },
  { _id: `item_${p}_wf_2`, shopId, categoryId: `cat_${p}_sub_reg`, name: 'WASH + FOLD + IRON', description: 'TIME 72 HRS', pricePerKg: 90, isBucket: true },

  // Laundry — Express Wash
  { _id: `item_${p}_exp_1`, shopId, categoryId: `cat_${p}_sub_exp`, name: 'EXPRESS WASH 24 HRS', description: 'WASH + FOLD', pricePerKg: 80, isBucket: true },
  { _id: `item_${p}_exp_2`, shopId, categoryId: `cat_${p}_sub_exp`, name: 'EXPRESS WASH 12 HRS', description: 'WASH + FOLD', pricePerKg: 90, isBucket: true },
  { _id: `item_${p}_exp_3`, shopId, categoryId: `cat_${p}_sub_exp`, name: 'EXPRESS WASH 12 HRS', description: 'WASH + PRESS + IRON', pricePerKg: 150, isBucket: true },
  { _id: `item_${p}_exp_4`, shopId, categoryId: `cat_${p}_sub_exp`, name: 'EXPRESS WASH 14 HRS', description: 'WASH + PRESS  + IRON', pricePerKg: 120, isBucket: true },

  // Dry Clean — Men's Wear
  { _id: `item_${p}_m_1`, shopId, categoryId: `cat_${p}_sub_men`, name: 'Shirt / T-Shirt', pricePerItem: 150, image: 'tshirt' },
  { _id: `item_${p}_m_2`, shopId, categoryId: `cat_${p}_sub_men`, name: 'Trouser / Jeans', pricePerItem: 150, image: 'jeans' },
  { _id: `item_${p}_m_3`, shopId, categoryId: `cat_${p}_sub_men`, name: 'Coat', pricePerItem: 300, image: 'suits' },
  { _id: `item_${p}_m_4`, shopId, categoryId: `cat_${p}_sub_men`, name: 'Suit – 2 Pcs', pricePerItem: 350, image: 'suits' },
  { _id: `item_${p}_m_5`, shopId, categoryId: `cat_${p}_sub_men`, name: 'Suit – 3 Pcs', pricePerItem: 450, image: 'suits' },
  { _id: `item_${p}_m_6`, shopId, categoryId: `cat_${p}_sub_men`, name: 'Half Jacket', pricePerItem: 250, image: 'leather' },
  { _id: `item_${p}_m_7`, shopId, categoryId: `cat_${p}_sub_men`, name: 'Kurta Pajama', pricePerItem: 350, image: 'suits' },
  { _id: `item_${p}_m_8`, shopId, categoryId: `cat_${p}_sub_men`, name: 'Sherwani – Normal', pricePerItem: 500, image: 'suits' },
  { _id: `item_${p}_m_9`, shopId, categoryId: `cat_${p}_sub_men`, name: 'Sherwani – Jari Work', pricePerItem: 1000, image: 'suits' },
  { _id: `item_${p}_m_10`, shopId, categoryId: `cat_${p}_sub_men`, name: 'Leather Jacket', pricePerItem: 500, image: 'leather' },
  { _id: `item_${p}_m_11`, shopId, categoryId: `cat_${p}_sub_men`, name: 'Jacket', pricePerItem: 300, image: 'leather' },

  // Dry Clean — Women's Wear
  { _id: `item_${p}_w_1`, shopId, categoryId: `cat_${p}_sub_women`, name: 'Kurta', pricePerItem: 200, image: 'wedding_dress' },
  { _id: `item_${p}_w_2`, shopId, categoryId: `cat_${p}_sub_women`, name: 'Salwar', pricePerItem: 200, image: 'wedding_dress' },
  { _id: `item_${p}_w_3`, shopId, categoryId: `cat_${p}_sub_women`, name: 'Saree', pricePerItem: 360, image: 'wedding_dress' },
  { _id: `item_${p}_w_4`, shopId, categoryId: `cat_${p}_sub_women`, name: 'Dress', pricePerItem: 400, image: 'wedding_dress' },
  { _id: `item_${p}_w_5`, shopId, categoryId: `cat_${p}_sub_women`, name: 'Lehenga – Normal', pricePerItem: 500, image: 'wedding_dress' },
  { _id: `item_${p}_w_6`, shopId, categoryId: `cat_${p}_sub_women`, name: 'Shawl', pricePerItem: 200, image: 'wedding_dress' },
  { _id: `item_${p}_w_7`, shopId, categoryId: `cat_${p}_sub_women`, name: 'Shirt / T-Shirt', pricePerItem: 150, image: 'tshirt' },
  { _id: `item_${p}_w_8`, shopId, categoryId: `cat_${p}_sub_women`, name: 'Trouser / Jeans', pricePerItem: 150, image: 'jeans' },
  { _id: `item_${p}_w_9`, shopId, categoryId: `cat_${p}_sub_women`, name: 'Dupatta', pricePerItem: 100, image: 'wedding_dress' },

  // Dry Clean — Household Items (Linen & Furnishings)
  { _id: `item_${p}_h_3`, shopId, categoryId: `cat_${p}_sub_house`, name: 'Bedsheet – Single', pricePerItem: 150, image: 'bedding' },
  { _id: `item_${p}_h_4`, shopId, categoryId: `cat_${p}_sub_house`, name: 'Bedsheet – Double', pricePerItem: 200, image: 'bedding' },
  { _id: `item_${p}_h_7`, shopId, categoryId: `cat_${p}_sub_house`, name: 'Carpet', pricePerItem: 50, description: 'Per Sq. Ft.', image: 'rugs' },
  { _id: `item_${p}_h_8`, shopId, categoryId: `cat_${p}_sub_house`, name: 'Door Mat', pricePerItem: 100, description: 'Per Piece', image: 'rugs' },
  { _id: `item_${p}_h_9`, shopId, categoryId: `cat_${p}_sub_house`, name: 'Curtain', pricePerItem: 200, description: 'Starting at ₹200 / Panel', image: 'curtains' },

  // Dry Clean — Shoes
  { _id: `item_${p}_s_1`, shopId, categoryId: `cat_${p}_sub_shoes`, name: 'Sports Shoes', pricePerItem: 200, image: 'shoes' },
  { _id: `item_${p}_s_2`, shopId, categoryId: `cat_${p}_sub_shoes`, name: 'Canvas Shoes', pricePerItem: 250, image: 'shoes' },
  { _id: `item_${p}_s_3`, shopId, categoryId: `cat_${p}_sub_shoes`, name: 'Leather Shoes', pricePerItem: 300, image: 'shoes' },
  { _id: `item_${p}_s_4`, shopId, categoryId: `cat_${p}_sub_shoes`, name: 'Suede Leather Shoes', pricePerItem: 500, image: 'shoes' },
  { _id: `item_${p}_s_5`, shopId, categoryId: `cat_${p}_sub_shoes`, name: 'Boots', pricePerItem: 550, image: 'shoes' },

  // Dry Clean — Bags & Other Items
  { _id: `item_${p}_b_1`, shopId, categoryId: `cat_${p}_sub_bags`, name: 'Trolley Bag – Small', pricePerItem: 300, image: 'bag' },
  { _id: `item_${p}_b_2`, shopId, categoryId: `cat_${p}_sub_bags`, name: 'Trolley Bag – Large', pricePerItem: 400, image: 'bag' },
  { _id: `item_${p}_b_3`, shopId, categoryId: `cat_${p}_sub_bags`, name: 'Soft Toys', pricePerItem: 150, description: 'Starting from ₹150 (As per size)', image: 'bag' },

  // Blankets & Winter Items
  { _id: `item_${p}_blk_1`, shopId, categoryId: `cat_${p}_blanket`, name: 'Blanket Double Bed', pricePerItem: 300, description: '₹300 Per Unit', image: 'blanket' },
  { _id: `item_${p}_blk_2`, shopId, categoryId: `cat_${p}_blanket`, name: 'Blanket Single Bed', pricePerItem: 250, description: '₹250 Per Unit', image: 'blanket' },
  { _id: `item_${p}_blk_3`, shopId, categoryId: `cat_${p}_blanket`, name: 'Rajaai / Quilt', pricePerItem: 300, description: '₹300 Per Unit', image: 'bedding' },
  { _id: `item_${p}_blk_4`, shopId, categoryId: `cat_${p}_blanket`, name: 'Blanket Single / Double Ply', pricePerItem: 300, description: '₹300 Per Unit', image: 'blanket' },
  { _id: `item_${p}_blk_5`, shopId, categoryId: `cat_${p}_blanket`, name: 'Very Small Blanket / Winter Rajai Cover', pricePerItem: 200, description: '₹200 Per Unit', image: 'blanket' },
];

const ITEMS = [
  ...createItemsForShop('shop_lawgate', 'lg'),
  ...createItemsForShop('shop_agi', 'agi'),
];

const OFFERS = [
  { _id: 'offer_lawgate_1', shopId: 'shop_lawgate', code: 'WELCOME10', discountPercent: 10, maxDiscount: 50, minOrderValue: 100, description: '10% off' },
  { _id: 'offer_agi_1', shopId: 'shop_agi', code: 'STUDENT20', discountPercent: 20, maxDiscount: 100, minOrderValue: 150, description: '20% off for students' },
];

const ORDERS = [
  {
    _id: 'order_1',
    shopId: 'shop_lawgate',
    customerId: 'customer_lawgate',
    customerName: 'Lawgate Customer',
    customerPhone: '9000000002',
    customerAddress: 'Hostel 1',
    status: 'PLACED',
    items: [
      { itemId: 'item_lg_wf_1', name: 'WASH + FOLD', quantity: 3, unit: 'KG', price: 50 },
      { itemId: 'item_lg_m_1', name: 'Shirt / T-Shirt', quantity: 2, unit: 'ITEM', price: 150 }
    ],
    totalAmount: 450,
    paymentStatus: 'PENDING',
    paymentMode: 'COD',
    pickupAddress: 'Hostel 1',
    deliveryAddress: 'Hostel 1',
    createdAt: new Date().toISOString()
  },
  {
    _id: 'order_2',
    shopId: 'shop_lawgate',
    customerId: 'customer_lawgate',
    customerName: 'Lawgate Customer',
    customerPhone: '9000000002',
    customerAddress: 'Hostel 1',
    status: 'WASHING',
    items: [
      { itemId: 'item_lg_m_3', name: 'Coat', quantity: 1, unit: 'ITEM', price: 300 }
    ],
    totalAmount: 300,
    paymentStatus: 'SUCCESS',
    paymentMode: 'UPI',
    pickupAddress: 'Hostel 1',
    deliveryAddress: 'Hostel 1',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

const seed = async () => {
  await connectDB();

  console.log('Clearing old data...');
  await Shop.deleteMany({});
  await User.deleteMany({});
  await Category.deleteMany({});
  await Item.deleteMany({});
  await Offer.deleteMany({});
  await Order.deleteMany({});

  console.log('Inserting shops...');
  await Shop.insertMany(SHOPS);

  console.log('Inserting users...');
  await User.insertMany(USERS);

  console.log('Inserting categories...');
  await Category.insertMany(CATEGORIES);

  console.log('Inserting items...');
  await Item.insertMany(ITEMS);

  console.log('Inserting offers...');
  await Offer.insertMany(OFFERS);

  console.log('Inserting orders...');
  await Order.insertMany(ORDERS);

  console.log('Database seeded successfully with Lawgate and AGI!');
  process.exit(0);
};

seed();
