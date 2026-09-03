export type Role = 'SuperAdmin' | 'ShopAdmin' | 'Delivery' | 'Customer';
export type OrderStatus = 'PLACED' | 'ACCEPTED' | 'PICKUP_ASSIGNED' | 'PICKED_UP' | 'WASHING' | 'IRONING' | 'OUT_FOR_DELIVERY' | 'DELIVERED';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
export type PaymentMode = 'COD' | 'UPI' | 'CARD' | 'WALLET';

export interface IUser {
  _id: string;
  name: string;
  phone: string;
  email: string;
  role: Role;
  shopId?: string;
  expoPushToken?: string;
  address?: string;
  image?: string;
  password?: string;
  selectedWashPreferences?: string[];
  isActive?: boolean;
}

export interface IWashPreference {
  id: string;
  name: string;
  description: string;
  price: number;
}

export interface IPromoBanner {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  type?: 'promo' | 'free';
}

export interface IShop {
  _id: string;
  name: string;
  ownerId: string;
  branches: string[];
  paymentInfo?: {
    upiId?: string;
    bankName?: string;
    accountNo?: string;
    qrValue?: string;
  };
  isOpen?: boolean;
  instructions?: string;
  pickupTimings?: string[];
  contactNumber?: string;
  washPreferences?: IWashPreference[];
  promoBanners?: IPromoBanner[];
  minOrderValue?: number;
  taxPercent?: number;
  deliveryFee?: number;
  androidAppUrl?: string;
  iosAppUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategory {
  _id: string;
  shopId: string;
  name: string;
  image?: string;
  isActive: boolean;
}

export interface IItem {
  _id: string;
  shopId: string;
  categoryId: string;
  name: string;
  description?: string;
  pricePerItem?: number;
  pricePerKg?: number;
  price?: number;
  unit?: 'KG' | 'ITEM';
  image?: string;
  isActive: boolean;
}


export interface IOffer {
  _id: string;
  shopId: string;
  code: string;
  discountPercent: number;
  maxDiscount: number;
  minOrderValue: number;
  description: string;
  isActive?: boolean;
}

export interface IOrder {
  _id: string;
  shopId: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  deliveryBoyId?: string;
  deliveryBoyName?: string;
  status: OrderStatus;
  items: {
    itemId: string;
    name?: string;
    quantity: number;
    unit?: string;
    price: number;
    kgWeight?: number; // set by delivery agent after weighing
  }[];
  washPreferences?: {
    name: string;
    price: number;
  }[];
  totalAmount: number;
  kgPriceUpdated?: boolean; // true once delivery agent has weighed and finalized KG item prices
  taxAmount?: number;
  deliveryFee?: number;
  discountAmount?: number;
  paymentStatus?: PaymentStatus;
  paymentMode?: PaymentMode;
  pickupAddress: string;
  deliveryAddress: string;
  pickupDriverId?: string;
  deliveryDriverId?: string;
  pickupTime?: string;
  adminNotes?: string;
  isArchived?: boolean;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
