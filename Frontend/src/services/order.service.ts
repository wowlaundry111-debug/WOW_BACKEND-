import api from './api';
import { Order, OrderItem } from '../types';

interface PlaceOrderPayload {
  shopId: string;
  items: OrderItem[];
  washPreferences?: { name: string; price: number }[];
  totalAmount: number;
  discountAmount: number;
  taxAmount?: number;
  deliveryFee?: number;
  pickupAddress: string;
  deliveryAddress: string;
  pickupTime?: string;
}

class OrderService {
  async placeOrder(payload: PlaceOrderPayload): Promise<Order> {
    const response = await api.post('/orders', payload);
    return response.data;
  }
}

export default new OrderService();
