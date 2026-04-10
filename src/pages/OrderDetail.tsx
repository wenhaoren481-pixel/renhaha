import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, CheckCircle, RotateCcw, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useOrders } from '@/hooks/useData';
import { toast } from 'sonner';
import dayjs from 'dayjs';
// OrderProcess type is used implicitly

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { orders, updateOrder } = useOrders();
  const [elapsedTime, setElapsedTime] = useState(0);

  const order = orders.find(o => o.id === id);

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
      // 暂停
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
      // 继续
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
      // 最后一道，订单完成
      updateOrder(order.id, {
        status: 'completed',
        processes: updatedProcesses,
        actualSpentDays: order.actualSpentDays + Math.ceil(elapsed / 24),
      });
      toast.success('订单生产完成！');
    } else {
      // 开始下一道
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
    
    // 当前工序重置
    if (currentProcess) {
      updatedProcesses[order.currentProcessIndex] = {
        ...currentProcess,
        status: 'pending',
        startedAt: undefined,
        pausedAt: undefined,
        actualDuration: 0,
      };
    }

    // 上一道工序重新开始
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
            <span className="font-mono text-lg text-blue-600">{order.id}</span>
            {isOverdue && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                已超期 {dayjs().diff(dayjs(order.deliveryDate), 'day')} 天
              </Badge>
            )}
          </div>
        </div>
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
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">客户信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">产品信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-gray-500 text-sm">产品</span>
                <p className="font-medium">{order.productName}</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">材质</span>
                <p>{order.material || '-'}</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Logo</span>
                <p>{order.logo || '-'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">时间信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-gray-500 text-sm">创建日期</span>
                <p>{dayjs(order.createdAt).format('YYYY-MM-DD HH:mm')}</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">发货日期</span>
                <p className={isOverdue ? 'text-red-500 font-medium' : ''}>
                  {dayjs(order.deliveryDate).format('YYYY-MM-DD')}
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
            </CardContent>
          </Card>
        </div>

        {/* 右侧：工序流程 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">工序流程</CardTitle>
              {order.status === 'pending' && (
                <Button onClick={handleStart} className="bg-green-500 hover:bg-green-600">
                  <Play className="w-4 h-4 mr-2" />
                  开始生产
                </Button>
              )}
              {order.status === 'processing' && currentProcess?.status === 'running' && (
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
              {order.status === 'paused' && (
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
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.processes.map((process, index) => (
                  <div
                    key={process.id}
                    className={`p-4 rounded-lg border ${
                      index === order.currentProcessIndex && order.status !== 'completed'
                        ? 'border-blue-500 bg-blue-50'
                        : process.status === 'completed'
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* 序号 */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        process.status === 'completed'
                          ? 'bg-green-500 text-white'
                          : index === order.currentProcessIndex
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}>
                        {process.status === 'completed' ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <span className="text-sm font-medium">{index + 1}</span>
                        )}
                      </div>

                      {/* 工序信息 */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{process.processName}</span>
                          {index === order.currentProcessIndex && order.status !== 'completed' && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                              进行中
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {process.factoryName} · 计划 {process.plannedDuration} 天
                        </p>
                      </div>

                      {/* 计时显示 */}
                      {index === order.currentProcessIndex && 
                       order.status !== 'completed' && 
                       process.status === 'running' && (
                        <div className="flex items-center gap-2 text-blue-600">
                          <Clock className="w-4 h-4 animate-pulse" />
                          <span className="font-mono font-medium">
                            {formatTime(elapsedTime)}
                          </span>
                        </div>
                      )}

                      {/* 实际用时 */}
                      {process.status === 'completed' && process.actualDuration && (
                        <div className="text-sm text-green-600">
                          实际 {Math.round(process.actualDuration * 10) / 10} 小时
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
