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
  // Lawgate Categories
  { _id: 'cat_lawgate_1', shopId: 'shop_lawgate', name: 'Everyday Wear' },
  { _id: 'cat_lawgate_2', shopId: 'shop_lawgate', name: 'Winter Jackets & Coats' },
  { _id: 'cat_lawgate_3', shopId: 'shop_lawgate', name: 'Premium Drycleaning' },
  { _id: 'cat_lawgate_4', shopId: 'shop_lawgate', name: 'Bedsheets & Curtains' },

  // AGI Categories
  { _id: 'cat_agi_1', shopId: 'shop_agi', name: 'Student Wash & Fold' },
  { _id: 'cat_agi_2', shopId: 'shop_agi', name: 'Formals & Interview Wear' },
  { _id: 'cat_agi_3', shopId: 'shop_agi', name: 'Hostel Bedding' },
];

const ITEMS = [
  // Lawgate Items
  { _id: 'item_lg_1', shopId: 'shop_lawgate', categoryId: 'cat_lawgate_1', name: 'T-Shirt Wash & Iron', description: 'Standard wash, fabric softener, and steam iron.', pricePerItem: 20 },
  { _id: 'item_lg_2', shopId: 'shop_lawgate', categoryId: 'cat_lawgate_1', name: 'Denim Jeans', description: 'Tough wash for denims with color protection.', pricePerItem: 40 },
  { _id: 'item_lg_3', shopId: 'shop_lawgate', categoryId: 'cat_lawgate_1', name: 'Regular Wash (Per KG)', description: 'Everyday clothing mixed wash. Max 5kg per cycle.', pricePerKg: 60 },
  { _id: 'item_lg_4', shopId: 'shop_lawgate', categoryId: 'cat_lawgate_2', name: 'Heavy Winter Jacket', description: 'Dry cleaning for heavy winter coats and jackets.', pricePerItem: 250 },
  { _id: 'item_lg_5', shopId: 'shop_lawgate', categoryId: 'cat_lawgate_3', name: 'Designer Dress Dryclean', description: 'Premium care for delicate and designer wear.', pricePerItem: 350 },
  { _id: 'item_lg_6', shopId: 'shop_lawgate', categoryId: 'cat_lawgate_4', name: 'Double Bedsheet Set', description: 'Includes 1 double bedsheet and 2 pillow covers.', pricePerItem: 120 },

  // AGI Items
  { _id: 'item_agi_1', shopId: 'shop_agi', categoryId: 'cat_agi_1', name: 'Student Budget Wash (Per KG)', description: 'Affordable wash and fold for everyday hostel clothes.', pricePerKg: 50 },
  { _id: 'item_agi_2', shopId: 'shop_agi', categoryId: 'cat_agi_1', name: 'T-Shirt / Top', description: 'Single item wash and fold.', pricePerItem: 15 },
  { _id: 'item_agi_3', shopId: 'shop_agi', categoryId: 'cat_agi_2', name: 'Two-Piece Suit Dryclean', description: 'Perfect for placements and interviews.', pricePerItem: 200 },
  { _id: 'item_agi_4', shopId: 'shop_agi', categoryId: 'cat_agi_2', name: 'Formal Shirt Steam Press', description: 'Crisp steam ironing for formal shirts.', pricePerItem: 25 },
  { _id: 'item_agi_5', shopId: 'shop_agi', categoryId: 'cat_agi_3', name: 'Hostel Blanket Wash', description: 'Deep clean for single hostel blankets.', pricePerItem: 150 },
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
    paymentMode: 'CASH',
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
    paymentStatus: 'PAID',
    paymentMode: 'ONLINE',
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
