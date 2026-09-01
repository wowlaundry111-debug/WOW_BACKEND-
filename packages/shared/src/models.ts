import mongoose, { Schema } from 'mongoose';
import { IUser, IShop, ICategory, IItem, IOrder, IOffer } from './types';

const UserSchema = new Schema<IUser>({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toHexString() },
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['SuperAdmin', 'ShopAdmin', 'Delivery', 'Customer'], required: true },
  shopId: { type: String, required: false },
  expoPushToken: { type: String, required: false },
  address: { type: String, required: false },
  image: { type: String, required: false },
  selectedWashPreferences: [{ type: String }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// -- User indexes --
// Critical: notification dispatch queries User.find({ shopId, role: 'ShopAdmin' }) on every order
UserSchema.index({ shopId: 1, role: 1 });
// Admin user list filtering/pagination
UserSchema.index({ role: 1 });

const ShopSchema = new Schema<IShop>({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toHexString() },
  name: { type: String, required: true },
  ownerId: { type: String, required: true },
  branches: [{ type: String }],
  paymentInfo: {
    upiId: { type: String },
    bankName: { type: String },
    accountNo: { type: String },
    qrValue: { type: String },
  },
  isOpen: { type: Boolean, default: true },
  instructions: { type: String },
  pickupTimings: [{ type: String }],
  contactNumber: { type: String },
  washPreferences: [{
    id: { type: String },
    name: { type: String },
    description: { type: String },
    price: { type: Number },
    enabled: { type: Boolean, default: true }
  }],
  promoBanners: [{
    id: { type: String },
    badge: { type: String },
    title: { type: String },
    subtitle: { type: String },
    type: { type: String, default: 'promo' }
  }],
  minOrderValue: { type: Number },
  taxPercent: { type: Number },
  deliveryFee: { type: Number },
  androidAppUrl: { type: String },
  iosAppUrl: { type: String },
}, { timestamps: true });

const CategorySchema = new Schema<ICategory>({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toHexString() },
  shopId: { type: String, required: true },
  name: { type: String, required: true },
  image: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// -- Category indexes --
// Every catalog load: Category.find({ shopId, isActive: true })
// Single-field shopId alone still scans all shop categories to filter isActive
CategorySchema.index({ shopId: 1, isActive: 1 });

const ItemSchema = new Schema<IItem>({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toHexString() },
  shopId: { type: String, required: true },
  categoryId: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  pricePerItem: { type: Number },
  pricePerKg: { type: Number },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// -- Item indexes --
// Every catalog load: Item.find({ shopId, isActive: true })
ItemSchema.index({ shopId: 1, isActive: 1 });
// Category cascade delete: Item.deleteMany({ categoryId })
ItemSchema.index({ shopId: 1, categoryId: 1, isActive: 1 });

const OfferSchema = new Schema<IOffer>({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toHexString() },
  shopId: { type: String, required: true },
  code: { type: String, required: true },
  discountPercent: { type: Number, required: true },
  maxDiscount: { type: Number, required: true },
  minOrderValue: { type: Number, required: true },
  description: { type: String, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// -- Offer indexes --
// Coupon validation: Offer.findOne({ shopId, code }) — previously full collection scan
OfferSchema.index({ shopId: 1, code: 1 }, { unique: true });
OfferSchema.index({ shopId: 1, isActive: 1 });

const OrderSchema = new Schema<IOrder>({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toHexString() },
  shopId: { type: String, required: true },
  customerId: { type: String, required: true },
  customerName: { type: String },
  customerPhone: { type: String },
  customerAddress: { type: String },
  deliveryBoyId: { type: String },
  deliveryBoyName: { type: String },
  status: {
    type: String,
    enum: ['PLACED', 'ACCEPTED', 'PICKUP_ASSIGNED', 'PICKED_UP', 'WASHING', 'IRONING', 'OUT_FOR_DELIVERY', 'DELIVERED'],
    default: 'PLACED'
  },
  items: [{
    itemId: { type: String, required: true },
    name: { type: String },
    quantity: { type: Number, required: true },
    unit: { type: String },
    price: { type: Number, required: true }
  }],
  washPreferences: [{
    name: { type: String },
    price: { type: Number }
  }],
  totalAmount: { type: Number, required: true },
  taxAmount: { type: Number },
  deliveryFee: { type: Number },
  discountAmount: { type: Number, default: 0 },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'],
    default: 'PENDING',
  },
  paymentMode: {
    type: String,
    enum: ['COD', 'UPI', 'CARD', 'WALLET'],
  },
  pickupAddress: { type: String },
  deliveryAddress: { type: String },
  pickupDriverId: { type: String },
  deliveryDriverId: { type: String },
  pickupTime: { type: String },
  adminNotes: { type: String },
  isArchived: { type: Boolean, default: false },
  archivedAt: { type: Date },
}, { timestamps: true });

// -- Order indexes --
// Most critical: shop order listing with sort (fires on every admin/delivery page load)
OrderSchema.index({ shopId: 1, createdAt: -1 });
OrderSchema.index({ shopId: 1, isArchived: 1, createdAt: -1 });
// Status filtering for admin dashboard views
OrderSchema.index({ shopId: 1, status: 1 });
// Customer order history
OrderSchema.index({ customerId: 1, createdAt: -1 });
// Delivery boy task list: find active orders assigned to them
OrderSchema.index({ deliveryBoyId: 1, status: 1 });
// Archive query: Order.updateMany({ status: 'DELIVERED', isArchived: false })
OrderSchema.index({ status: 1, isArchived: 1 });

// Export models (creates them on whichever connection is active)
export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const Shop = mongoose.models.Shop || mongoose.model<IShop>('Shop', ShopSchema);
export const Category = mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
export const Item = mongoose.models.Item || mongoose.model<IItem>('Item', ItemSchema);
export const Offer = mongoose.models.Offer || mongoose.model<IOffer>('Offer', OfferSchema);
export const Order = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
