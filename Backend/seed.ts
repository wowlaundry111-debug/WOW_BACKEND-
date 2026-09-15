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
    paymentInfo: { upiId: 'wowlawgate@upi', bankName: 'HDFC Bank', accountNo: '111122223333', qrValue: 'upi://pay?pa=wowlawgate@upi' },
  },
  {
    _id: 'shop_agi',
    name: 'WOW Laundry AGI',
    ownerId: 'super_admin_1',
    branches: ['AGI Campus'],
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
];

const ITEMS = [
  // Lawgate Items
  { _id: 'item_lg_1', shopId: 'shop_lawgate', categoryId: 'cat_lawgate_sub1', name: 'T-Shirt Wash & Iron', description: 'Standard wash, fabric softener, and steam iron.', pricePerItem: 20 },
  { _id: 'item_lg_2', shopId: 'shop_lawgate', categoryId: 'cat_lawgate_sub1', name: 'Denim Jeans', description: 'Tough wash for denims with color protection.', pricePerItem: 40 },
  { _id: 'item_lg_3', shopId: 'shop_lawgate', categoryId: 'cat_lawgate_sub2', name: 'Regular Wash (Per KG)', description: 'Everyday clothing mixed wash. Max 5kg per cycle.', pricePerKg: 60, isBucket: true },
  { _id: 'item_lg_4', shopId: 'shop_lawgate', categoryId: 'cat_lawgate_sub3', name: 'Heavy Winter Jacket', description: 'Dry cleaning for heavy winter coats and jackets.', pricePerItem: 250 },
  { _id: 'item_lg_5', shopId: 'shop_lawgate', categoryId: 'cat_lawgate_sub4', name: 'Designer Dress Dryclean', description: 'Premium care for delicate and designer wear.', pricePerItem: 350 },
  { _id: 'item_lg_6', shopId: 'shop_lawgate', categoryId: 'cat_lawgate_sub5', name: 'Double Bedsheet Set', description: 'Includes 1 double bedsheet and 2 pillow covers.', pricePerItem: 120 },

  // AGI Items (Mirroring Lawgate)
  { _id: 'item_agi_1', shopId: 'shop_agi', categoryId: 'cat_agi_sub1', name: 'T-Shirt Wash & Iron', description: 'Standard wash, fabric softener, and steam iron.', pricePerItem: 20 },
  { _id: 'item_agi_2', shopId: 'shop_agi', categoryId: 'cat_agi_sub1', name: 'Denim Jeans', description: 'Tough wash for denims with color protection.', pricePerItem: 40 },
  { _id: 'item_agi_3', shopId: 'shop_agi', categoryId: 'cat_agi_sub2', name: 'Regular Wash (Per KG)', description: 'Everyday clothing mixed wash. Max 5kg per cycle.', pricePerKg: 60, isBucket: true },
  { _id: 'item_agi_4', shopId: 'shop_agi', categoryId: 'cat_agi_sub3', name: 'Heavy Winter Jacket', description: 'Dry cleaning for heavy winter coats and jackets.', pricePerItem: 250 },
  { _id: 'item_agi_5', shopId: 'shop_agi', categoryId: 'cat_agi_sub4', name: 'Designer Dress Dryclean', description: 'Premium care for delicate and designer wear.', pricePerItem: 350 },
  { _id: 'item_agi_6', shopId: 'shop_agi', categoryId: 'cat_agi_sub5', name: 'Double Bedsheet Set', description: 'Includes 1 double bedsheet and 2 pillow covers.', pricePerItem: 120 },
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
      { itemId: 'item_lg_1', name: 'T-Shirt Wash & Iron', quantity: 2, unit: 'ITEM', price: 20 },
      { itemId: 'item_lg_3', name: 'Regular Wash (Per KG)', quantity: 3, unit: 'KG', price: 60 }
    ],
    totalAmount: 220,
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
      { itemId: 'item_lg_4', name: 'Heavy Winter Jacket', quantity: 1, unit: 'ITEM', price: 250 }
    ],
    totalAmount: 250,
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
