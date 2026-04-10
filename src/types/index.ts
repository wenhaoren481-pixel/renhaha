export interface Product {
  id: string;
  name: string;
  description: string;
  cost: number;
  price: number;
}

export interface Shop {
  id: string;
  name: string;
  platform: string;
  url: string;
}

export interface Factory {
  id: string;
  name: string;
  manager: string;
  phone: string;
  address: string;
}

export interface Order {
  id: string;
  productId: string;
  productName: string;
  shopId: string;
  shopName: string;
  quantity: number;
  totalPrice: number;
  profit: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  todayProfit: number;
  monthProfit: number;
}
