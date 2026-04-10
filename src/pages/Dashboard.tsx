import { ShoppingCart, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDashboardStats, useOrders } from '@/hooks/useData';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

export default function Dashboard() {
  const navigate = useNavigate();
  const stats = useDashboardStats();
  const { orders, getOverdueOrders } = useOrders();

  const overdueOrders = getOverdueOrders();
  const recentOrders = [...orders]
    .sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
    .slice(0, 5);

  const statCards = [
    {
      title: '总订单数',
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: 'bg-blue-500',
      onClick: () => navigate('/orders'),
    },
    {
      title: '进行中',
      value: stats.processingOrders,
      icon: Clock,
      color: 'bg-amber-500',
      onClick: () => navigate('/orders'),
    },
    {
      title: '已完成',
      value: stats.completedOrders,
      icon: CheckCircle,
      color: 'bg-green-500',
      onClick: () => navigate('/orders'),
    },
    {
      title: '超期订单',
      value: stats.overdueOrders,
      icon: AlertCircle,
      color: 'bg-red-500',
      onClick: () => navigate('/orders'),
      alert: stats.overdueOrders > 0,
    },
  ];

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

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">首页看板</h1>
        <p className="text-gray-500 mt-1 text-sm md:text-base">查看业务概况和订单状态</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
        {statCards.map((stat, index) => (
          <Card 
            key={index} 
            className={`cursor-pointer hover:shadow-lg transition-shadow ${stat.alert ? 'border-red-300' : ''}`}
            onClick={stat.onClick}
          >
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center">
                <div className={`w-10 h-10 md:w-12 md:h-12 ${stat.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <stat.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div className="ml-3 md:ml-4 min-w-0">
                  <p className="text-xs md:text-sm text-gray-500 truncate">{stat.title}</p>
                  <p className={`text-xl md:text-2xl font-bold ${stat.alert ? 'text-red-600' : 'text-gray-900'}`}>
                    {stat.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 超期订单警告 */}
      {overdueOrders.length > 0 && (
        <Card className="mb-6 border-red-300 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-red-700 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              超期订单提醒
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overdueOrders.slice(0, 3).map((order) => (
                <div 
                  key={order.id} 
                  className="flex items-center justify-between p-3 bg-white rounded-lg cursor-pointer hover:bg-gray-50"
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-medium">{order.id}</span>
                    <span>{order.customerName}</span>
                    <span className="text-gray-500">{order.productName}</span>
                  </div>
                  <span className="text-red-600 font-medium">
                    超期 {dayjs().diff(dayjs(order.deliveryDate), 'day')} 天
                  </span>
                </div>
              ))}
              {overdueOrders.length > 3 && (
                <p className="text-center text-sm text-red-600">
                  还有 {overdueOrders.length - 3} 个超期订单
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 最近订单 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>最近订单</CardTitle>
          <button 
            onClick={() => navigate('/orders')}
            className="text-sm text-blue-500 hover:text-blue-600"
          >
            查看全部
          </button>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              暂无订单数据
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">订单号</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">客户</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">产品</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">工序</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr 
                      key={order.id} 
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      <td className="py-3 px-4 font-mono">{order.id}</td>
                      <td className="py-3 px-4">{order.customerName}</td>
                      <td className="py-3 px-4">{order.productName}</td>
                      <td className="py-3 px-4">
                        {order.currentProcessIndex < order.processes.length 
                          ? `${order.processes[order.currentProcessIndex]?.processName || '-'} (${order.currentProcessIndex + 1}/${order.processes.length})`
                          : '已完成'
                        }
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(order.status)}</td>
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
