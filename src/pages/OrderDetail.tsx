import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, CheckCircle, RotateCcw, Clock, AlertCircle, Edit2, Save, X, Ban, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useOrders, useProducts, useShops } from '@/hooks/useData';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { orders, updateOrder } = useOrders();
  const { products } = useProducts();
  const { shops } = useShops();
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingProcesses, setIsEditingProcesses] = useState(false);
  
  // 编辑表单数据
  const [editData, setEditData] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    productId: '',
    shopId: '',
    material: '',
    logo: '',
    spec: '',
    orderDate: '',
    deliveryDate: '',
  });

  const order = orders.find(o => o.id === id);

  // 初始化编辑数据
  useEffect(() => {
    if (order) {
      setEditData({
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerAddress: order.customerAddress,
        productId: order.productId,
        shopId: order.shopId || '',
        material: order.material,
        logo: order.logo,
        spec: order.spec || '',
        orderDate: order.orderDate || dayjs(order.createdAt).format('YYYY-MM-DD'),
        deliveryDate: order.deliveryDate,
      });
    }
  }, [order]);

  // 计算当前工序已用时间（秒）
  useEffect(() => {
    if (!order || order.status !== 'processing') return;

    const currentProcess = order.processes[order.currentProcessIndex];
    if (!currentProcess || currentProcess.status !== 'running') return;

    const interval = setInterval(() => {
      const startTime = dayjs(currentProcess.startedAt);
      const now = dayjs();
      const elapsed = now.diff(startTime, 'second');
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [order]);

  if (!order) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">订单不存在</p>
        <Button onClick={() => navigate('/orders')} className="mt-4">
          返回订单列表
        </Button>
      </div>
    );
  }

  const currentProcess = order.processes[order.currentProcessIndex];
  const isLastProcess = order.currentProcessIndex >= order.processes.length - 1;
  const isOverdue = dayjs().isAfter(dayjs(order.deliveryDate)) && order.status !== 'completed';

  // 保存编辑
  const handleSave = () => {
    const product = products.find(p => p.id === editData.productId);
    const shop = shops.find(s => s.id === editData.shopId);
    
    updateOrder(order.id, {
      customerName: editData.customerName,
      customerPhone: editData.customerPhone,
      customerAddress: editData.customerAddress,
      productId: editData.productId,
      productName: product?.name || order.productName,
      shopId: editData.shopId,
      shopName: shop?.name || order.shopName,
      material: editData.material,
      logo: editData.logo,
      spec: editData.spec,
      orderDate: editData.orderDate,
      deliveryDate: editData.deliveryDate,
    });
    
    setIsEditing(false);
    toast.success('订单已更新');
  };

  // 取消编辑
  const handleCancel = () => {
    setEditData({
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress,
      productId: order.productId,
      shopId: order.shopId || '',
      material: order.material,
      logo: order.logo,
      spec: order.spec || '',
      orderDate: order.orderDate || dayjs(order.createdAt).format('YYYY-MM-DD'),
      deliveryDate: order.deliveryDate,
    });
    setIsEditing(false);
  };

  // 取消某道工序（跳过它）
  const handleCancelProcess = (processIndex: number) => {
    const process = order.processes[processIndex];
    if (!process) return;

    if (!confirm(`确定要取消"${process.processName}"工序吗？\n取消后，该工序及后续工序将重置为未开始状态。`)) {
      return;
    }

    const updatedProcesses = [...order.processes];
    
    // 取消当前工序（标记为已完成但跳过）
    updatedProcesses[processIndex] = {
      ...updatedProcesses[processIndex],
      status: 'completed',
      completedAt: new Date().toISOString(),
      actualDuration: 0,
      plannedDuration: 0, // 取消的工序时间为0
    };

    // 后续工序重置为未开始
    for (let i = processIndex + 1; i < updatedProcesses.length; i++) {
      updatedProcesses[i] = {
        ...updatedProcesses[i],
        status: 'pending',
        startedAt: undefined,
        pausedAt: undefined,
        completedAt: undefined,
        actualDuration: 0,
      };
    }

    // 更新当前工序索引到下一道
    const newCurrentIndex = processIndex + 1;
    
    updateOrder(order.id, {
      processes: updatedProcesses,
      currentProcessIndex: newCurrentIndex < updatedProcesses.length ? newCurrentIndex : processIndex,
      status: newCurrentIndex < updatedProcesses.length ? 'processing' : 'completed',
    });

    toast.success(`已取消"${process.processName}"工序`);
  };

  // 更新工序时间
  const handleUpdateProcessDuration = (processIndex: number, newDuration: number) => {
    if (newDuration < 0) return;
    
    const updatedProcesses = [...order.processes];
    updatedProcesses[processIndex] = {
      ...updatedProcesses[processIndex],
      plannedDuration: newDuration,
    };

    // 重新计算总预计天数
    const newTotalDays = updatedProcesses.reduce((sum, p) => sum + p.plannedDuration, 0);

    updateOrder(order.id, {
      processes: updatedProcesses,
      totalPlannedDays: newTotalDays,
    });
  };

  // 开始生产
  const handleStart = () => {
    const updatedProcesses = [...order.processes];
    updatedProcesses[0] = {
      ...updatedProcesses[0],
      status: 'running',
      startedAt: new Date().toISOString(),
    };

    updateOrder(order.id, {
      status: 'processing',
      processes: updatedProcesses,
    });
    toast.success('生产开始');
  };

  // 暂停/继续
  const handlePauseResume = () => {
    if (!currentProcess) return;

    const updatedProcesses = [...order.processes];
    
    if (currentProcess.status === 'running') {
      const elapsed = dayjs().diff(dayjs(currentProcess.startedAt), 'hour');
      updatedProcesses[order.currentProcessIndex] = {
        ...currentProcess,
        status: 'paused',
        pausedAt: new Date().toISOString(),
        actualDuration: (currentProcess.actualDuration || 0) + elapsed,
      };
      updateOrder(order.id, { status: 'paused', processes: updatedProcesses });
      toast.success('已暂停');
    } else if (currentProcess.status === 'paused') {
      updatedProcesses[order.currentProcessIndex] = {
        ...currentProcess,
        status: 'running',
        startedAt: new Date().toISOString(),
      };
      updateOrder(order.id, { status: 'processing', processes: updatedProcesses });
      toast.success('继续生产');
    }
  };

  // 完成当前工序
  const handleComplete = () => {
    if (!currentProcess) return;

    const elapsed = dayjs().diff(dayjs(currentProcess.startedAt), 'hour');
    const updatedProcesses = [...order.processes];
    
    updatedProcesses[order.currentProcessIndex] = {
      ...currentProcess,
      status: 'completed',
      completedAt: new Date().toISOString(),
      actualDuration: (currentProcess.actualDuration || 0) + elapsed,
    };

    if (isLastProcess) {
      updateOrder(order.id, {
        status: 'completed',
        processes: updatedProcesses,
        actualSpentDays: order.actualSpentDays + Math.ceil(elapsed / 24),
      });
      toast.success('订单生产完成！');
    } else {
      updatedProcesses[order.currentProcessIndex + 1] = {
        ...updatedProcesses[order.currentProcessIndex + 1],
        status: 'running',
        startedAt: new Date().toISOString(),
      };
      updateOrder(order.id, {
        currentProcessIndex: order.currentProcessIndex + 1,
        processes: updatedProcesses,
        actualSpentDays: order.actualSpentDays + Math.ceil(elapsed / 24),
      });
      toast.success(`进入下一工序：${updatedProcesses[order.currentProcessIndex + 1].processName}`);
    }
  };

  // 退回上一步
  const handleGoBack = () => {
    if (order.currentProcessIndex === 0) {
      toast.error('已经是第一道工序');
      return;
    }

    const updatedProcesses = [...order.processes];
    
    if (currentProcess) {
      updatedProcesses[order.currentProcessIndex] = {
        ...currentProcess,
        status: 'pending',
        startedAt: undefined,
        pausedAt: undefined,
        actualDuration: 0,
      };
    }

    updatedProcesses[order.currentProcessIndex - 1] = {
      ...updatedProcesses[order.currentProcessIndex - 1],
      status: 'running',
      startedAt: new Date().toISOString(),
      completedAt: undefined,
      actualDuration: 0,
    };

    updateOrder(order.id, {
      currentProcessIndex: order.currentProcessIndex - 1,
      processes: updatedProcesses,
    });
    toast.success('已退回上一步，重新计时');
  };

  // 格式化时间
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 计算进度
  const calculateProgress = () => {
    if (order.status === 'completed') return 100;
    const completedCount = order.processes.filter(p => p.status === 'completed').length;
    return Math.round((completedCount / order.processes.length) * 100);
  };

  return (
    <div className="p-4 md:p-8">
      {/* 头部 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/orders')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">订单详情</h1>
            <span className="font-mono text-lg text-blue-600">
              {order.id}{order.logo ? `-${order.logo}` : ''}
            </span>
            {isOverdue && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                已超期 {dayjs().diff(dayjs(order.deliveryDate), 'day')} 天
              </Badge>
            )}
          </div>
        </div>
        {/* 编辑按钮 */}
        {!isEditing && (
          <Button 
            variant="outline" 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2"
          >
            <Edit2 className="w-4 h-4" />
            编辑订单
          </Button>
        )}
        {isEditing && (
          <div className="flex gap-2">
            <Button 
              onClick={handleSave}
              className="bg-green-500 hover:bg-green-600 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              保存
            </Button>
            <Button 
              variant="outline" 
              onClick={handleCancel}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              取消
            </Button>
          </div>
        )}
      </div>

      {/* 进度条 */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex justify-between text-sm mb-2">
            <span>生产进度</span>
            <span>{calculateProgress()}%</span>
          </div>
          <Progress value={calculateProgress()} className="h-2" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：基本信息 */}
        <div className="space-y-6">
          {/* 客户信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">客户信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isEditing ? (
                <>
                  <div>
                    <Label>姓名</Label>
                    <Input
                      value={editData.customerName}
                      onChange={(e) => setEditData({ ...editData, customerName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>电话</Label>
                    <Input
                      value={editData.customerPhone}
                      onChange={(e) => setEditData({ ...editData, customerPhone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>地址</Label>
                    <Input
                      value={editData.customerAddress}
                      onChange={(e) => setEditData({ ...editData, customerAddress: e.target.value })}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="text-gray-500 text-sm">姓名</span>
                    <p className="font-medium">{order.customerName}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">电话</span>
                    <p>{order.customerPhone}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">地址</span>
                    <p>{order.customerAddress || '-'}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* 产品信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">产品信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isEditing ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>产品</Label>
                      <Select
                        value={editData.productId}
                        onValueChange={(value) => setEditData({ ...editData, productId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>店铺</Label>
                      <Select
                        value={editData.shopId}
                        onValueChange={(value) => setEditData({ ...editData, shopId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择店铺" />
                        </SelectTrigger>
                        <SelectContent>
                          {shops.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>材质</Label>
                      <Input
                        value={editData.material}
                        onChange={(e) => setEditData({ ...editData, material: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Logo</Label>
                      <Input
                        value={editData.logo}
                        onChange={(e) => setEditData({ ...editData, logo: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>规格</Label>
                      <Input
                        value={editData.spec}
                        onChange={(e) => setEditData({ ...editData, spec: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="text-gray-500 text-sm">产品</span>
                    <p className="font-medium">{order.productName}</p>
                  </div>
                  {order.shopName && (
                    <div>
                      <span className="text-gray-500 text-sm">店铺</span>
                      <p>{order.shopName}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500 text-sm">材质</span>
                    <p>{order.material || '-'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">Logo</span>
                    <p>{order.logo || '-'}</p>
                  </div>
                  {order.spec && (
                    <div>
                      <span className="text-gray-500 text-sm">规格</span>
                      <p>{order.spec}</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* 时间信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">时间信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isEditing ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>下单日期</Label>
                    <Input
                      type="date"
                      value={editData.orderDate}
                      onChange={(e) => setEditData({ ...editData, orderDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>发货日期</Label>
                    <Input
                      type="date"
                      value={editData.deliveryDate}
                      onChange={(e) => setEditData({ ...editData, deliveryDate: e.target.value })}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <span className="text-gray-500 text-sm">下单日期</span>
                    <p>{order.orderDate || dayjs(order.createdAt).format('YYYY-MM-DD')}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">发货日期</span>
                    <p className={isOverdue ? 'text-red-500 font-medium' : ''}>
                      {order.deliveryDate}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">预计周期</span>
                    <p>{order.totalPlannedDays} 天</p>
                  </div>
                  {order.status === 'completed' && (
                    <div>
                      <span className="text-gray-500 text-sm">实际用时</span>
                      <p>{order.actualSpentDays} 天</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 右侧：工序流程 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">工序流程</CardTitle>
              <div className="flex gap-2">
                {/* 编辑工序按钮 */}
                {!isEditing && !isEditingProcesses && order.status !== 'completed' && (
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditingProcesses(true)}
                    className="flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    编辑工序
                  </Button>
                )}
                {isEditingProcesses && (
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditingProcesses(false)}
                    className="flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    完成编辑
                  </Button>
                )}
                
                {/* 生产控制按钮 */}
                {!isEditing && !isEditingProcesses && order.status === 'pending' && (
                  <Button onClick={handleStart} className="bg-green-500 hover:bg-green-600">
                    <Play className="w-4 h-4 mr-2" />
                    开始生产
                  </Button>
                )}
                {!isEditing && !isEditingProcesses && order.status === 'processing' && currentProcess?.status === 'running' && (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handlePauseResume}>
                      <Pause className="w-4 h-4 mr-2" />
                      暂停
                    </Button>
                    <Button onClick={handleComplete} className="bg-green-500 hover:bg-green-600">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {isLastProcess ? '完成订单' : '完成并下一道'}
                    </Button>
                  </div>
                )}
                {!isEditing && !isEditingProcesses && order.status === 'paused' && (
                  <div className="flex gap-2">
                    <Button onClick={handlePauseResume} className="bg-blue-500 hover:bg-blue-600">
                      <Play className="w-4 h-4 mr-2" />
                      继续
                    </Button>
                    <Button variant="outline" onClick={handleGoBack}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      退回上一步
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.processes.map((process, index) => {
                  const isCurrent = index === order.currentProcessIndex;
                  const isCompleted = process.status === 'completed';
                  const isCanceled = isCompleted && process.plannedDuration === 0;
                  
                  return (
                    <div
                      key={process.id}
                      className={`p-4 rounded-lg border ${
                        isCanceled
                          ? 'border-gray-300 bg-gray-100'
                          : isCurrent && order.status !== 'completed'
                          ? 'border-blue-500 bg-blue-50'
                          : isCompleted
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {/* 序号 */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isCanceled
                            ? 'bg-gray-400 text-white'
                            : isCompleted
                            ? 'bg-green-500 text-white'
                            : isCurrent
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-500'
                        }`}>
                          {isCanceled ? (
                            <Ban className="w-4 h-4" />
                          ) : isCompleted ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <span className="text-sm font-medium">{index + 1}</span>
                          )}
                        </div>

                        {/* 工序信息 */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${isCanceled ? 'text-gray-500 line-through' : ''}`}>
                              {process.processName}
                            </span>
                            {isCanceled && (
                              <Badge variant="secondary" className="bg-gray-200 text-gray-600">
                                已取消
                              </Badge>
                            )}
                            {isCurrent && order.status !== 'completed' && !isCanceled && (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                进行中
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {process.factoryName} · 
                            {isEditingProcesses ? (
                              <span className="inline-flex items-center gap-1 ml-1">
                                计划
                                <Input
                                  type="number"
                                  min={0}
                                  max={30}
                                  value={process.plannedDuration}
                                  onChange={(e) => handleUpdateProcessDuration(index, parseInt(e.target.value) || 0)}
                                  className="w-16 h-6 text-xs inline-block"
                                />
                                天
                              </span>
                            ) : (
                              ` 计划 ${process.plannedDuration} 天`
                            )}
                          </p>
                        </div>

                        {/* 计时显示 */}
                        {isCurrent && order.status !== 'completed' && process.status === 'running' && (
                          <div className="flex items-center gap-2 text-blue-600">
                            <Clock className="w-4 h-4 animate-pulse" />
                            <span className="font-mono font-medium">
                              {formatTime(elapsedTime)}
                            </span>
                          </div>
                        )}

                        {/* 实际用时 */}
                        {isCompleted && !isCanceled && process.actualDuration !== undefined && (
                          <div className="text-sm text-green-600">
                            实际 {Math.round(process.actualDuration * 10) / 10} 小时
                          </div>
                        )}

                        {/* 取消按钮 - 编辑模式下显示 */}
                        {isEditingProcesses && !isCanceled && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelProcess(index)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Ban className="w-4 h-4 mr-1" />
                            取消
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
