import { useState, useEffect } from 'react';
import type { 
  ProcessConfig, 
  Product, 
  Shop, 
  Order, 
  OrderCounter,
  DashboardStats 
} from '@/types';

// ==================== Storage Keys ====================
const PROCESS_CONFIGS_KEY = 'order_manager_process_configs';
const PRODUCTS_KEY = 'order_manager_products';
const SHOPS_KEY = 'order_manager_shops';
const ORDERS_KEY = 'order_manager_orders';
const ORDER_COUNTER_KEY = 'order_manager_order_counter';

// ==================== 初始数据 ====================
const initialProcessConfigs: ProcessConfig[] = [
  { id: '1', processName: '印刷', factoryName: '广州印刷厂', defaultDuration: 2 },
  { id: '2', processName: '印刷', factoryName: '深圳印刷厂', defaultDuration: 1 },
  { id: '3', processName: '覆膜', factoryName: '深圳包装厂', defaultDuration: 1 },
  { id: '4', processName: '模切', factoryName: '深圳包装厂', defaultDuration: 1 },
  { id: '5', processName: '糊盒', factoryName: '深圳包装厂', defaultDuration: 2 },
  { id: '6', processName: '过油', factoryName: '广州印刷厂', defaultDuration: 1 },
];

const initialProducts: Product[] = [
  { id: '1', name: '手提袋', description: '纸质手提袋', cost: 2, price: 5 },
  { id: '2', name: '包装盒', description: '礼品包装盒', cost: 5, price: 12 },
];

const initialShops: Shop[] = [
  { id: '1', name: '淘宝店铺', platform: '淘宝', url: 'https://shop1.taobao.com' },
  { id: '2', name: '京东店铺', platform: '京东', url: 'https://shop2.jd.com' },
];

// ==================== 生产配置管理（工序+工厂合并）====================
export function useProcessConfigs() {
  const [processConfigs, setProcessConfigs] = useState<ProcessConfig[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(PROCESS_CONFIGS_KEY);
    if (stored) {
      setProcessConfigs(JSON.parse(stored));
    } else {
      setProcessConfigs(initialProcessConfigs);
      localStorage.setItem(PROCESS_CONFIGS_KEY, JSON.stringify(initialProcessConfigs));
    }
  }, []);

  const saveProcessConfigs = (newConfigs: ProcessConfig[]) => {
    setProcessConfigs(newConfigs);
    localStorage.setItem(PROCESS_CONFIGS_KEY, JSON.stringify(newConfigs));
  };

  const addProcessConfig = (processName: string, factoryName: string, defaultDuration: number) => {
    const newConfig: ProcessConfig = {
      id: Date.now().toString(),
      processName,
      factoryName,
      defaultDuration,
    };
    const updated = [...processConfigs, newConfig];
    saveProcessConfigs(updated);
    return newConfig;
  };

  const updateProcessConfig = (id: string, updates: Partial<ProcessConfig>) => {
    const updated = processConfigs.map(p => 
      p.id === id ? { ...p, ...updates } : p
    );
    saveProcessConfigs(updated);
  };

  const deleteProcessConfig = (id: string) => {
    const updated = processConfigs.filter(p => p.id !== id);
    saveProcessConfigs(updated);
  };

  // 获取所有唯一的工序名称
  const getUniqueProcessNames = () => {
    return Array.from(new Set(processConfigs.map(p => p.processName)));
  };

  // 获取某道工序的所有工厂配置
  const getConfigsByProcessName = (processName: string) => {
    return processConfigs.filter(p => p.processName === processName);
  };

  return { 
    processConfigs, 
    addProcessConfig, 
    updateProcessConfig, 
    deleteProcessConfig,
    getUniqueProcessNames,
    getConfigsByProcessName,
  };
}

// ==================== 产品管理 ====================
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

// ==================== 店铺管理 ====================
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

// ==================== 订单号生成器 ====================
export function useOrderCounter() {
  const [counter, setCounter] = useState<OrderCounter>({ lastNumber: 0 });

  useEffect(() => {
    const stored = localStorage.getItem(ORDER_COUNTER_KEY);
    if (stored) {
      setCounter(JSON.parse(stored));
    } else {
      setCounter({ lastNumber: 0 });
    }
  }, []);

  const saveCounter = (newCounter: OrderCounter) => {
    setCounter(newCounter);
    localStorage.setItem(ORDER_COUNTER_KEY, JSON.stringify(newCounter));
  };

  // 生成下一个订单号：188003, 188006, 188009...
  const generateOrderId = () => {
    const nextNumber = counter.lastNumber + 3;
    const orderId = `188${nextNumber.toString().padStart(3, '0')}`;
    saveCounter({ lastNumber: nextNumber });
    return orderId;
  };

  return { counter, generateOrderId };
}

// ==================== 订单管理 ====================
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

  const addOrder = (order: Omit<Order, 'createdAt'>) => {
    const newOrder: Order = {
      ...order,
      createdAt: new Date().toISOString(),
    };
    const updated = [...orders, newOrder];
    saveOrders(updated);
    return newOrder;
  };

  const updateOrder = (id: string, order: Partial<Order>) => {
    const updated = orders.map(o => o.id === id ? { ...o, ...order } : o);
    saveOrders(updated);
  };

  const deleteOrder = (id: string) => {
    const updated = orders.filter(o => o.id !== id);
    saveOrders(updated);
  };

  // 搜索订单
  const searchOrder = (orderId: string) => {
    return orders.find(o => o.id === orderId);
  };

  // 获取今日新增订单
  const getTodayOrders = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate >= today;
    });
  };

  // 获取超期订单
  const getOverdueOrders = () => {
    const now = new Date();
    return orders.filter(o => {
      if (o.status === 'completed') return false;
      const deliveryDate = new Date(o.deliveryDate);
      return now > deliveryDate;
    });
  };

  return { 
    orders, 
    addOrder, 
    updateOrder, 
    deleteOrder, 
    searchOrder,
    getTodayOrders,
    getOverdueOrders,
  };
}

// ==================== 看板统计 ====================
export function useDashboardStats(): DashboardStats {
  const [orders] = useState<Order[]>(() => {
    const stored = localStorage.getItem(ORDERS_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayOrders = orders.filter(o => {
    const orderDate = new Date(o.createdAt);
    return orderDate >= today;
  });

  const overdueOrders = orders.filter(o => {
    if (o.status === 'completed') return false;
    const deliveryDate = new Date(o.deliveryDate);
    return today > deliveryDate;
  });

  return {
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    processingOrders: orders.filter(o => o.status === 'processing').length,
    completedOrders: orders.filter(o => o.status === 'completed').length,
    todayNewOrders: todayOrders.length,
    overdueOrders: overdueOrders.length,
  };
}
