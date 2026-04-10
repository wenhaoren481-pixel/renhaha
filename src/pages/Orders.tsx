import { useState } from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useOrders, useProducts, useShops } from '@/hooks/useData';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import type { Order } from '@/types';

export default function Orders() {
  const { orders, addOrder, updateOrder, deleteOrder } = useOrders();
  const { products } = useProducts();
  const { shops } = useShops();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [formData, setFormData] = useState({
    productId: '',
    shopId: '',
    quantity: 1,
    status: 'pending' as Order['status'],
  });

  const filteredOrders = orders.filter(order =>
    order.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.shopName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = () => {
    const product = products.find(p => p.id === formData.productId);
    const shop = shops.find(s => s.id === formData.shopId);
    
    if (!product || !shop) {
      toast.error('请选择产品和店铺');
      return;
    }

    const totalPrice = product.price * formData.quantity;
    const profit = (product.price - product.cost) * formData.quantity;

    if (editingOrder) {
      updateOrder(editingOrder.id, {
        ...formData,
        productName: product.name,
        shopName: shop.name,
        totalPrice,
        profit,
      });
      toast.success('订单更新成功');
    } else {
      addOrder({
        ...formData,
        productName: product.name,
        shopName: shop.name,
        totalPrice,
        profit,
      });
      toast.success('订单创建成功');
    }

    setIsDialogOpen(false);
    setEditingOrder(null);
    setFormData({ productId: '', shopId: '', quantity: 1, status: 'pending' });
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setFormData({
      productId: order.productId,
      shopId: order.shopId,
      quantity: order.quantity,
      status: order.status,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个订单吗？')) {
      deleteOrder(id);
      toast.success('订单已删除');
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">订单管理</h1>
          <p className="text-gray-500 mt-1">管理您的所有订单</p>
        </div>
        <Button
          onClick={() => {
            setEditingOrder(null);
            setFormData({ productId: '', shopId: '', quantity: 1, status: 'pending' });
            setIsDialogOpen(true);
          }}
          className="bg-blue-500 hover:bg-blue-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          新建订单
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="搜索订单..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">暂无订单数据</p>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(true)}
              >
                创建第一个订单
              </Button>
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
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">利润</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-sm">{order.id.slice(-6)}</td>
                      <td className="py-3 px-4 text-sm">{order.productName}</td>
                      <td className="py-3 px-4 text-sm">{order.shopName}</td>
                      <td className="py-3 px-4 text-sm">{order.quantity}</td>
                      <td className="py-3 px-4 text-sm">{formatCurrency(order.totalPrice)}</td>
                      <td className="py-3 px-4 text-sm text-green-600">{formatCurrency(order.profit)}</td>
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
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(order)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(order.id)}
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingOrder ? '编辑订单' : '新建订单'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>产品</Label>
              <Select
                value={formData.productId}
                onValueChange={(value) => setFormData({ ...formData, productId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择产品" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - {formatCurrency(product.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>店铺</Label>
              <Select
                value={formData.shopId}
                onValueChange={(value) => setFormData({ ...formData, shopId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择店铺" />
                </SelectTrigger>
                <SelectContent>
                  {shops.map((shop) => (
                    <SelectItem key={shop.id} value={shop.id}>
                      {shop.name} ({shop.platform})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>数量</Label>
              <Input
                type="number"
                min={1}
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div>
              <Label>状态</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as Order['status'] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">待处理</SelectItem>
                  <SelectItem value="processing">处理中</SelectItem>
                  <SelectItem value="completed">已完成</SelectItem>
                  <SelectItem value="cancelled">已取消</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} className="bg-blue-500 hover:bg-blue-600">
              {editingOrder ? '更新' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
