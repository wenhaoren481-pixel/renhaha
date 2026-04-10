import { ShoppingCart, Clock, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardStats, useOrders } from '@/hooks/useData';
import { formatCurrency } from '@/lib/utils';

export default function Dashboard() {
  const stats = useDashboardStats();
  const { orders } = useOrders();

  const recentOrders = orders.slice(-5).reverse();

  const statCards = [
    {
      title: '总订单数',
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: 'bg-blue-500',
    },
    {
      title: '待处理订单',
      value: stats.pendingOrders,
      icon: Clock,
      color: 'bg-amber-500',
    },
    {
      title: '今日利润',
      value: formatCurrency(stats.todayProfit),
      icon: TrendingUp,
      color: 'bg-emerald-500',
    },
    {
      title: '本月利润',
      value: formatCurrency(stats.monthProfit),
      icon: Calendar,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">首页看板</h1>
        <p className="text-gray-500 mt-1">查看您的业务概况</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>最近订单</CardTitle>
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
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">产品</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">店铺</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">数量</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">总价</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-sm">{order.id.slice(-6)}</td>
                      <td className="py-3 px-4 text-sm">{order.productName}</td>
                      <td className="py-3 px-4 text-sm">{order.shopName}</td>
                      <td className="py-3 px-4 text-sm">{order.quantity}</td>
                      <td className="py-3 px-4 text-sm">{formatCurrency(order.totalPrice)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          order.status === 'completed' ? 'bg-green-100 text-green-700' :
                          order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {order.status === 'completed' ? '已完成' :
                           order.status === 'pending' ? '待处理' :
                           order.status === 'processing' ? '处理中' : '已取消'}
                        </span>
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
