import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, GripVertical, ArrowLeft, Calendar, ChevronDown, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { useProducts, useProcessConfigs, useOrders, useOrderCounter, useShops } from '@/hooks/useData';
import type { OrderProcess, Order } from '@/types';

// 拖拽相关
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// 可拖拽的工序项组件
function SortableProcessItem({ 
  process, 
  index, 
  onDurationChange, 
  onDelete 
}: { 
  process: OrderProcess; 
  index: number;
  onDurationChange: (id: string, duration: number) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: process.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg mb-3"
    >
      <div {...attributes} {...listeners} className="cursor-grab text-gray-400">
        <GripVertical className="w-5 h-5" />
      </div>
      
      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-blue-600 font-medium text-sm">{index + 1}</span>
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium">{process.processName}</p>
        <p className="text-sm text-gray-500">{process.factoryName}</p>
      </div>
      
      <div className="flex items-center gap-2 w-28">
        <Input
          type="number"
          min={1}
          max={30}
          value={process.plannedDuration}
          onChange={(e) => onDurationChange(process.id, parseInt(e.target.value) || 1)}
          className="h-9 text-center"
        />
        <span className="text-sm text-gray-500 whitespace-nowrap">天</span>
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(process.id)}
        className="text-red-500 hover:text-red-600"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

export default function OrderCreate() {
  const navigate = useNavigate();
  const { products } = useProducts();
  const { shops } = useShops();
  const { processConfigs } = useProcessConfigs();
  const { addOrder } = useOrders();
  const { generateOrderId } = useOrderCounter();

  const [orderId, setOrderId] = useState('');
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    productId: '',
    shopId: '',
    material: '',
    logo: '',
    spec: '',
    orderDate: dayjs().format('YYYY-MM-DD'),
    deliveryDate: dayjs().add(7, 'day').format('YYYY-MM-DD'),
  });
  const [processes, setProcesses] = useState<OrderProcess[]>([]);
  const [batchInput, setBatchInput] = useState('');

  // 智能解析批量输入的文本
  const parseBatchInput = () => {
    if (!batchInput.trim()) {
      toast.error('请输入需要解析的内容');
      return;
    }

    const text = batchInput.trim();
    
    // 提取手机号（11位数字，以1开头）
    const phoneRegex = /1[3-9]\d{9}/;
    const phoneMatch = text.match(phoneRegex);
    const phone = phoneMatch ? phoneMatch[0] : '';
    
    // 移除手机号后的剩余文本
    let remainingText = text.replace(phone, '').trim();
    
    // 去除常见的分隔符
    remainingText = remainingText.replace(/[,，\s]+/g, ' ').trim();
    
    // 尝试识别地址（包含省、市、区、路、号、栋、单元等关键词）
    const addressKeywords = ['省', '市', '区', '县', '镇', '乡', '村', '路', '街', '道', '号', '栋', '单元', '楼', '室', '层'];
    let name = '';
    let address = '';
    
    // 按空格分割
    const parts = remainingText.split(/\s+/).filter(p => p.length > 0);
    
    if (parts.length >= 2) {
      // 判断哪个部分是地址
      const part1 = parts[0];
      const part2 = parts.slice(1).join('');
      
      const part1IsAddress = addressKeywords.some(kw => part1.includes(kw));
      const part2IsAddress = addressKeywords.some(kw => part2.includes(kw));
      
      if (part1IsAddress && !part2IsAddress) {
        // 第一个是地址，第二个是姓名
        address = part1;
        name = part2;
      } else if (!part1IsAddress && part2IsAddress) {
        // 第一个是姓名，第二个是地址
        name = part1;
        address = part2;
      } else if (part1.length <= 4 && part2.length > 4) {
        // 短的可能是姓名，长的可能是地址
        name = part1;
        address = part2;
      } else {
        // 默认：第一个是姓名，后面的是地址
        name = part1;
        address = parts.slice(1).join('');
      }
    } else if (parts.length === 1) {
      // 只有一个部分，判断是姓名还是地址
      const partIsAddress = addressKeywords.some(kw => parts[0].includes(kw));
      if (partIsAddress) {
        address = parts[0];
      } else {
        name = parts[0];
      }
    }
    
    // 更新表单
    setFormData(prev => ({
      ...prev,
      customerName: name,
      customerPhone: phone,
      customerAddress: address,
    }));
    
    if (name || phone || address) {
      toast.success('解析成功！');
    } else {
      toast.warning('未能识别出有效信息，请检查输入格式');
    }
  };

  // 生成订单号
  useEffect(() => {
    setOrderId(generateOrderId());
  }, []);

  // 拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setProcesses((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addProcess = (configId: string) => {
    const config = processConfigs.find(p => p.id === configId);
    if (!config) return;

    const newProcess: OrderProcess = {
      id: Date.now().toString(),
      processName: config.processName,
      factoryName: config.factoryName,
      plannedDuration: config.defaultDuration,
      status: 'pending',
    };

    setProcesses([...processes, newProcess]);
  };

  const updateProcessDuration = (processId: string, duration: number) => {
    setProcesses(processes.map(p => 
      p.id === processId ? { ...p, plannedDuration: duration } : p
    ));
  };

  const deleteProcess = (processId: string) => {
    setProcesses(processes.filter(p => p.id !== processId));
  };

  const calculateTotalDays = () => {
    return processes.reduce((sum, p) => sum + p.plannedDuration, 0);
  };

  const handleSubmit = () => {
    // 验证
    if (!formData.customerName.trim()) {
      toast.error('请输入客户姓名');
      return;
    }
    if (!formData.customerPhone.trim()) {
      toast.error('请输入客户电话');
      return;
    }
    if (!formData.productId) {
      toast.error('请选择产品');
      return;
    }
    if (processes.length === 0) {
      toast.error('请至少添加一道工序');
      return;
    }

    const product = products.find(p => p.id === formData.productId);
    const shop = shops.find(s => s.id === formData.shopId);

    const order: Order = {
      id: orderId,
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      customerAddress: formData.customerAddress,
      productId: formData.productId,
      productName: product?.name || '',
      shopId: formData.shopId,
      shopName: shop?.name || '',
      material: formData.material,
      logo: formData.logo,
      spec: formData.spec,
      createdAt: new Date().toISOString(),
      orderDate: formData.orderDate,
      deliveryDate: formData.deliveryDate,
      processes: processes,
      currentProcessIndex: 0,
      status: 'pending',
      totalPlannedDays: calculateTotalDays(),
      actualSpentDays: 0,
    };

    addOrder(order);
    toast.success('订单创建成功！');
    navigate('/orders');
  };

  // 已选择的配置ID
  const selectedConfigIds = processes.map(p => {
    const config = processConfigs.find(c => 
      c.processName === p.processName && c.factoryName === p.factoryName
    );
    return config?.id;
  });

  // 可选的配置（按工序名称分组）
  const availableConfigs = processConfigs.filter(p => !selectedConfigIds.includes(p.id));

  return (
    <div className="p-4 md:p-8">
      {/* 头部 */}
      <div className="flex items-center gap-4 mb-6 md:mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate('/orders')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">新建订单</h1>
          <p className="text-gray-500 mt-1 text-sm md:text-base">
            订单号：<span className="font-mono font-medium text-blue-600">{orderId}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：基本信息 */}
        <div className="space-y-6">
          {/* 客户信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">客户信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 批量输入 */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <Label className="text-blue-700 flex items-center gap-2">
                  <Wand2 className="w-4 h-4" />
                  批量输入（自动解析）
                </Label>
                <p className="text-xs text-blue-500 mt-1 mb-2">
                  粘贴包含姓名、电话、地址的文本，如：张三 13800138000 北京市朝阳区xxx
                </p>
                <div className="flex gap-2">
                  <Textarea
                    value={batchInput}
                    onChange={(e) => setBatchInput(e.target.value)}
                    placeholder="张三 13800138000 北京市朝阳区xxx"
                    className="flex-1 min-h-[60px] resize-none bg-white"
                  />
                  <Button 
                    onClick={parseBatchInput}
                    className="bg-blue-500 hover:bg-blue-600 h-auto px-4"
                  >
                    <Wand2 className="w-4 h-4 mr-1" />
                    解析
                  </Button>
                </div>
              </div>
              
              <div className="border-t border-gray-100 pt-4">
                <Label>客户姓名 <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="请输入客户姓名"
                />
              </div>
              <div>
                <Label>联系电话 <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  placeholder="请输入联系电话"
                />
              </div>
              <div>
                <Label>收货地址</Label>
                <Input
                  value={formData.customerAddress}
                  onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                  placeholder="请输入收货地址"
                />
              </div>
            </CardContent>
          </Card>

          {/* 产品信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">产品信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 产品和店铺 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>选择产品 <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.productId}
                    onValueChange={(value) => setFormData({ ...formData, productId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="请选择产品" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>选择店铺</Label>
                  <Select
                    value={formData.shopId}
                    onValueChange={(value) => setFormData({ ...formData, shopId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="请选择店铺" />
                    </SelectTrigger>
                    <SelectContent>
                      {shops.map((shop) => (
                        <SelectItem key={shop.id} value={shop.id}>
                          {shop.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* 材质、Logo、规格 */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>材质</Label>
                  <Input
                    value={formData.material}
                    onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                    placeholder="如：250g铜版纸"
                  />
                </div>
                <div>
                  <Label>Logo</Label>
                  <Input
                    value={formData.logo}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                    placeholder="Logo信息"
                  />
                </div>
                <div>
                  <Label>规格 (mm)</Label>
                  <Input
                    value={formData.spec}
                    onChange={(e) => setFormData({ ...formData, spec: e.target.value })}
                    placeholder="如：100*80*50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 日期信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">日期信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>下单日期</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <Input
                      type="date"
                      value={formData.orderDate}
                      onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>发货日期</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <Input
                      type="date"
                      value={formData.deliveryDate}
                      onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                预计生产周期：{calculateTotalDays()} 天
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：工序流程 */}
        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">工序流程</CardTitle>
              {availableConfigs.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-40">
                      <Plus className="w-4 h-4 mr-1" />
                      <span>添加工序</span>
                      <ChevronDown className="w-4 h-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    {availableConfigs.map((config) => (
                      <DropdownMenuItem 
                        key={config.id} 
                        onClick={() => addProcess(config.id)}
                      >
                        <span className="font-medium">{config.processName}</span>
                        <span className="text-gray-500 mx-1">-</span>
                        <span className="text-gray-600">{config.factoryName}</span>
                        <span className="text-blue-500 ml-auto">{config.defaultDuration}天</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </CardHeader>
            <CardContent>
              {processes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>请添加工序</p>
                  <p className="text-sm mt-1">拖拽可调整顺序</p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={processes.map(p => p.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {processes.map((process, index) => (
                      <SortableProcessItem
                        key={process.id}
                        process={process}
                        index={index}
                        onDurationChange={updateProcessDuration}
                        onDelete={deleteProcess}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 底部操作 */}
      <div className="flex justify-end gap-4 mt-8">
        <Button variant="outline" onClick={() => navigate('/orders')}>
          取消
        </Button>
        <Button onClick={handleSubmit} className="bg-blue-500 hover:bg-blue-600">
          创建订单
        </Button>
      </div>
    </div>
  );
}
