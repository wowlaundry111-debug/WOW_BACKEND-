export type Role = 'SuperAdmin' | 'ShopAdmin' | 'Delivery' | 'Customer' | 'Operator';
export type OrderStatus = 'PLACED' | 'ACCEPTED' | 'PICKUP_ASSIGNED' | 'PICKED_UP' | 'WASHING' | 'IRONING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
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

export interface IShopPromoCode {
  code: string;
  discountPercent: number;
  maxDiscount: number;
  minOrderValue: number;
  description?: string;
  isActive: boolean;
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
  promoCode?: IShopPromoCode;
  minOrderValue?: number;
  taxPercent?: number;
  deliveryFee?: number;
  androidAppUrl?: string;
  iosAppUrl?: string;
  partnerAppUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategory {
  _id: string;
  shopId: string;
  name: string;
  image?: string;
  isActive: boolean;
  parentCategoryId?: string; // null/undefined = top-level; set = sub-category
  singleItemSelection?: boolean; // When true, only one item from this sub-category can be selected (any qty)
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
  isBucket?: boolean; // Bucket items shown as large tappable count cards in customer UI
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
  deliveryBoyPhone?: string;
  shopPhone?: string;
  cancelledAt?: Date;
  cancellationReason?: string;
  status: OrderStatus;
  items: {
    itemId: string;
    name?: string;
    quantity: number;
    unit?: string;
    price: number;
    kgWeight?: number; // set by delivery agent after weighing
    categoryName?: string;    // human-readable breadcrumb stamped at order creation
    subCategoryName?: string; // populated only when item belongs to a sub-category
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
  couponCode?: string;
  couponDiscountPercent?: number;
  couponMaxDiscount?: number;
  couponMinOrderValue?: number;
  paymentStatus?: PaymentStatus;
  paymentMode?: PaymentMode;
  pickupAddress: string;
  deliveryAddress: string;
  pickupTime?: string;
  adminNotes?: string;
  isArchived?: boolean;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
