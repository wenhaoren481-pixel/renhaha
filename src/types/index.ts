// ==================== 生产配置（工序+工厂合并）====================
export interface ProcessConfig {
  id: string;
  processName: string;     // 工序名称（如：印刷）
  factoryName: string;     // 工厂名称（如：广州印刷厂）
  defaultDuration: number; // 默认天数
}

// ==================== 产品 ====================
export interface Product {
  id: string;
  name: string;
  description: string;
  cost: number;
  price: number;
}

// ==================== 店铺 ====================
export interface Shop {
  id: string;
  name: string;
  platform: string;
  url: string;
}

// ==================== 订单工序（运行时）====================
export interface OrderProcess {
  id: string;
  processName: string;     // 工序名称
  factoryName: string;     // 工厂名称
  plannedDuration: number; // 计划天数（可修改）
  
  // 计时相关
  status: 'pending' | 'running' | 'paused' | 'completed';
  startedAt?: string;
  pausedAt?: string;
  completedAt?: string;
  actualDuration?: number; // 实际用时（小时）
  
  // 历史记录
  history?: {
    startedAt: string;
    endedAt: string;
    duration: number;
  }[];
}

// ==================== 订单 ====================
export interface Order {
  id: string; // 内部订单号 188XXX
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  productId: string;
  productName: string;
  material: string;
  logo: string;
  
  // 时间相关
  createdAt: string;
  deliveryDate: string;
  
  // 工序流程
  processes: OrderProcess[];
  currentProcessIndex: number;
  
  // 状态
  status: 'pending' | 'processing' | 'paused' | 'completed';
  
  // 统计
  totalPlannedDays: number;
  actualSpentDays: number;
}

// ==================== 订单号计数器 ====================
export interface OrderCounter {
  lastNumber: number; // 003, 006, 009...
}

// ==================== 看板统计 ====================
export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  completedOrders: number;
  todayNewOrders: number;
  overdueOrders: number;
}
