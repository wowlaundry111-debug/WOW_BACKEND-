// WOW Laundry Core TypeScript Types

export type Role = 'SuperAdmin' | 'ShopAdmin' | 'Customer' | 'Delivery';

export type OrderStatus =
  | 'PLACED'
  | 'ACCEPTED'
  | 'PICKUP_ASSIGNED'
  | 'PICKED_UP'
  | 'WASHING'
  | 'IRONING'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export type PaymentMode = 'COD' | 'UPI' | 'CARD' | 'WALLET';

export interface WashPreference {
  id: string;
  name: string;
  description: string;
  price: number;
  enabled?: boolean;
}

export interface PromoBanner {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  type?: 'promo' | 'free';
}

export interface Shop {
  _id: string;
  name: string;
  ownerId: string;
  branches: string[];
  paymentInfo: {
    upiId: string;
    bankName: string;
    accountNo: string;
    qrValue: string; // UPI dynamic payload or static text
  };
  isOpen?: boolean;
  instructions?: string;
  pickupTimings?: string[];
  contactNumber?: string;
  washPreferences?: WashPreference[];
  promoBanners?: PromoBanner[];
  minOrderValue?: number;
  taxPercent?: number;
  deliveryFee?: number;
  createdAt: string;
}

export interface User {
  _id: string;
  shopId?: string; // Tenant isolation key — absent for SuperAdmin and unlinked Customer
  role: Role;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  image?: string; // Profile picture URL
  selectedWashPreferences?: string[];
  expoPushToken?: string;
  isActive?: boolean;
}

export interface Category {
  _id: string;
  shopId: string; // Tenant isolation key
  name: string;
  image?: string; // category image URL or base64
  isActive?: boolean;
}

export interface Item {
  _id: string;
  shopId: string; // Tenant isolation key
  categoryId: string;
  name: string;
  image?: string;
  description?: string;
  pricePerKg?: number;
  pricePerItem?: number;
}

export interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  unit: 'KG' | 'ITEM';
  price: number; // resolved unit price at order time
}

export interface CartItem {
  itemId: string;
  name: string;
  quantity: number;
  unit: 'KG' | 'ITEM';
  price: number;
  image?: string;
}

export interface Order {
  _id: string;
  shopId: string; // Tenant isolation key
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  deliveryBoyId?: string;
  deliveryBoyName?: string;
  items: OrderItem[];
  washPreferences?: {
    name: string;
    price: number;
  }[];
  status: OrderStatus;
  totalAmount: number;
  taxAmount?: number;
  deliveryFee?: number;
  discountAmount?: number;
  paymentStatus?: PaymentStatus;
  paymentMode?: PaymentMode;
  pickupAddress?: string;
  deliveryAddress?: string;
  pickupTime?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Offer {
  _id: string;
  shopId: string; // Tenant isolation key
  code: string;
  discountPercent: number;
  maxDiscount: number;
  minOrderValue: number;
  description: string;
  isActive?: boolean;
}
