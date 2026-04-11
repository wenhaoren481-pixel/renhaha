import { useState } from 'react';
import { Plus, Search, Eye, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOrders } from '@/hooks/useData';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import dayjs from 'dayjs';

export default function Orders() {
  const navigate = useNavigate();
  const { orders, deleteOrder } = useOrders();
  const [searchQuery, setSearchQuery] = useState('');

  // 模糊搜索订单
  const filteredOrders = searchQuery.trim()
    ? orders.filter(order => 
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.logo && order.logo.toLowerCase().includes(searchQuery.toLowerCase())) ||
        order.productName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : orders;

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个订单吗？')) {
      deleteOrder(id);
      toast.success('订单已删除');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-700">待开始</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">进行中</Badge>;
      case 'paused':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-700">已暂停</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-700">已完成</Badge>;
      default:
        return <Badge variant="secondary">未知</Badge>;
    }
  };

  const isOverdue = (order: any) => {
    if (order.status === 'completed') return false;
    return dayjs().isAfter(dayjs(order.deliveryDate));
  };

  // 排序并过滤后的订单列表
  const sortedOrders = [...filteredOrders].sort((a, b) => 
    dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
  );

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">订单管理</h1>
          <p className="text-gray-500 mt-1 text-sm md:text-base">管理所有生产订单</p>
        </div>
        <Button
          onClick={() => navigate('/orders/create')}
          className="bg-blue-500 hover:bg-blue-600 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          新建订单
        </Button>
      </div>

      {/* 搜索栏 */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="搜索订单号、客户、Logo、产品..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* 订单列表 */}
      <Card>
        <CardContent className="p-6">
          {sortedOrders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">暂无订单数据</p>
              <Button onClick={() => navigate('/orders/create')}>
                创建第一个订单
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">订单号</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">客户</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">产品</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">工序数</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">发货日期</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedOrders.map((order) => (
                    <tr 
                      key={order.id || order.createdAt} 
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={(e) => {
                        // 确保点击的是行本身，而不是按钮
                        const target = e.target as HTMLElement;
                        if (target.closest('button')) return;
                        
                        if (order.id && order.id.startsWith('188')) {
                          navigate(`/orders/${order.id}`);
                        } else {
                          toast.error('该订单号无效，请删除后重新创建');
                        }
                      }}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-medium ${!order.id || !order.id.startsWith('188') ? 'text-red-500' : ''}`}>
                            {order.id && order.id.startsWith('188') ? order.id : '【订单号无效】'}
                            {order.logo && order.id && order.id.startsWith('188') ? `-${order.logo}` : ''}
                          </span>
                          {isOverdue(order) && (
                            <span title="已超期"><AlertCircle className="w-4 h-4 text-red-500" /></span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{order.customerName}</p>
                          <p className="text-xs text-gray-500">{order.customerPhone}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p>{order.productName}</p>
                          <p className="text-xs text-gray-500">{order.material}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm">
                          {order.processes.length} 道
                          {order.currentProcessIndex < order.processes.length && (
                            <span className="text-gray-500 ml-1">
                              (第{order.currentProcessIndex + 1}道)
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className={`text-sm ${isOverdue(order) ? 'text-red-500 font-medium' : ''}`}>
                            {dayjs(order.deliveryDate).format('MM-DD')}
                          </p>
                          {isOverdue(order) && (
                            <p className="text-xs text-red-500">
                              超期 {dayjs().diff(dayjs(order.deliveryDate), 'day')} 天
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/orders/${order.id}`);
                            }}
                            title="查看详情"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(order.id);
                            }}
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
