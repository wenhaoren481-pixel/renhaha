import { useState, useEffect } from 'react';
import type { Product, Shop, Factory, Order, DashboardStats } from '@/types';

const PRODUCTS_KEY = 'order_manager_products';
const SHOPS_KEY = 'order_manager_shops';
const FACTORIES_KEY = 'order_manager_factories';
const ORDERS_KEY = 'order_manager_orders';

// 初始数据
const initialProducts: Product[] = [
  { id: '1', name: '纯棉T恤', description: '夏季新款', cost: 25, price: 69 },
  { id: '2', name: '无线耳机', description: '蓝牙5.0', cost: 45, price: 129 },
];

const initialShops: Shop[] = [
  { id: '1', name: '潮流服饰店', platform: '淘宝', url: 'https://shop1.taobao.com' },
  { id: '2', name: '数码专营店', platform: '京东', url: 'https://shop2.jd.com' },
];

const initialFactories: Factory[] = [
  { id: '1', name: '广州服装厂', manager: '张经理', phone: '13800138001', address: '广州市白云区' },
  { id: '2', name: '深圳电子厂', manager: '李经理', phone: '13800138002', address: '深圳市宝安区' },
];

// Products
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(PRODUCTS_KEY);
    if (stored) {
      setProducts(JSON.parse(stored));
    } else {
      setProducts(initialProducts);
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(initialProducts));
    }
  }, []);

  const saveProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(newProducts));
  };

  const addProduct = (product: Omit<Product, 'id'>) => {
    const newProduct = { ...product, id: Date.now().toString() };
    const updated = [...products, newProduct];
    saveProducts(updated);
  };

  const updateProduct = (id: string, product: Partial<Product>) => {
    const updated = products.map(p => p.id === id ? { ...p, ...product } : p);
    saveProducts(updated);
  };

  const deleteProduct = (id: string) => {
    const updated = products.filter(p => p.id !== id);
    saveProducts(updated);
  };

  return { products, addProduct, updateProduct, deleteProduct };
}

// Shops
export function useShops() {
  const [shops, setShops] = useState<Shop[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(SHOPS_KEY);
    if (stored) {
      setShops(JSON.parse(stored));
    } else {
      setShops(initialShops);
      localStorage.setItem(SHOPS_KEY, JSON.stringify(initialShops));
    }
  }, []);

  const saveShops = (newShops: Shop[]) => {
    setShops(newShops);
    localStorage.setItem(SHOPS_KEY, JSON.stringify(newShops));
  };

  const addShop = (shop: Omit<Shop, 'id'>) => {
    const newShop = { ...shop, id: Date.now().toString() };
    const updated = [...shops, newShop];
    saveShops(updated);
  };

  const updateShop = (id: string, shop: Partial<Shop>) => {
    const updated = shops.map(s => s.id === id ? { ...s, ...shop } : s);
    saveShops(updated);
  };

  const deleteShop = (id: string) => {
    const updated = shops.filter(s => s.id !== id);
    saveShops(updated);
  };

  return { shops, addShop, updateShop, deleteShop };
}

// Factories
export function useFactories() {
  const [factories, setFactories] = useState<Factory[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(FACTORIES_KEY);
    if (stored) {
      setFactories(JSON.parse(stored));
    } else {
      setFactories(initialFactories);
      localStorage.setItem(FACTORIES_KEY, JSON.stringify(initialFactories));
    }
  }, []);

  const saveFactories = (newFactories: Factory[]) => {
    setFactories(newFactories);
    localStorage.setItem(FACTORIES_KEY, JSON.stringify(newFactories));
  };

  const addFactory = (factory: Omit<Factory, 'id'>) => {
    const newFactory = { ...factory, id: Date.now().toString() };
    const updated = [...factories, newFactory];
    saveFactories(updated);
  };

  const updateFactory = (id: string, factory: Partial<Factory>) => {
    const updated = factories.map(f => f.id === id ? { ...f, ...factory } : f);
    saveFactories(updated);
  };

  const deleteFactory = (id: string) => {
    const updated = factories.filter(f => f.id !== id);
    saveFactories(updated);
  };

  return { factories, addFactory, updateFactory, deleteFactory };
}

// Orders
export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(ORDERS_KEY);
    if (stored) {
      setOrders(JSON.parse(stored));
    }
  }, []);

  const saveOrders = (newOrders: Order[]) => {
    setOrders(newOrders);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(newOrders));
  };

  const addOrder = (order: Omit<Order, 'id' | 'createdAt'>) => {
    const newOrder: Order = {
      ...order,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...orders, newOrder];
    saveOrders(updated);
  };

  const updateOrder = (id: string, order: Partial<Order>) => {
    const updated = orders.map(o => o.id === id ? { ...o, ...order } : o);
    saveOrders(updated);
  };

  const deleteOrder = (id: string) => {
    const updated = orders.filter(o => o.id !== id);
    saveOrders(updated);
  };

  return { orders, addOrder, updateOrder, deleteOrder };
}

// Dashboard Stats
export function useDashboardStats(): DashboardStats {
  const [orders] = useState<Order[]>(() => {
    const stored = localStorage.getItem(ORDERS_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const todayProfit = orders
    .filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate >= today;
    })
    .reduce((sum, o) => sum + o.profit, 0);

  const monthProfit = orders
    .filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    })
    .reduce((sum, o) => sum + o.profit, 0);

  return {
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    todayProfit,
    monthProfit,
  };
}
