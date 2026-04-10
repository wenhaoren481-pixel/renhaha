import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, GripVertical, ArrowLeft, Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useProducts, useProcessConfigs, useOrders, useOrderCounter } from '@/hooks/useData';
import type { OrderProcess } from '@/types';

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
  const { processConfigs } = useProcessConfigs();
  const { addOrder } = useOrders();
  const { generateOrderId } = useOrderCounter();

  const [orderId, setOrderId] = useState('');
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    productId: '',
    material: '',
    logo: '',
    deliveryDate: dayjs().add(7, 'day').format('YYYY-MM-DD'),
  });
  const [processes, setProcesses] = useState<OrderProcess[]>([]);

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

    const order = {
      id: orderId,
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      customerAddress: formData.customerAddress,
      productId: formData.productId,
      productName: product?.name || '',
      material: formData.material,
      logo: formData.logo,
      createdAt: new Date().toISOString(),
      deliveryDate: formData.deliveryDate,
      processes: processes,
      currentProcessIndex: 0,
      status: 'pending' as const,
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
              <div>
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
            </CardContent>
          </Card>

          {/* 发货日期 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">发货日期</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <Input
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
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
