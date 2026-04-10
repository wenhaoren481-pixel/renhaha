import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, User, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useFactories } from '@/hooks/useData';
import { toast } from 'sonner';
import type { Factory } from '@/types';

export default function Factories() {
  const { factories, addFactory, updateFactory, deleteFactory } = useFactories();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFactory, setEditingFactory] = useState<Factory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    manager: '',
    phone: '',
    address: '',
  });

  const filteredFactories = factories.filter(factory =>
    factory.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    factory.manager.toLowerCase().includes(searchQuery.toLowerCase()) ||
    factory.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = () => {
    if (!formData.name) {
      toast.error('请输入工厂名称');
      return;
    }

    if (editingFactory) {
      updateFactory(editingFactory.id, formData);
      toast.success('工厂更新成功');
    } else {
      addFactory(formData);
      toast.success('工厂添加成功');
    }

    setIsDialogOpen(false);
    setEditingFactory(null);
    setFormData({ name: '', manager: '', phone: '', address: '' });
  };

  const handleEdit = (factory: Factory) => {
    setEditingFactory(factory);
    setFormData({
      name: factory.name,
      manager: factory.manager,
      phone: factory.phone,
      address: factory.address,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个工厂吗？')) {
      deleteFactory(id);
      toast.success('工厂已删除');
    }
  };

  const getInitials = (name: string) => {
    return name.charAt(0);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">加工厂管理</h1>
          <p className="text-gray-500 mt-1">管理您的加工厂信息</p>
        </div>
        <Button
          onClick={() => {
            setEditingFactory(null);
            setFormData({ name: '', manager: '', phone: '', address: '' });
            setIsDialogOpen(true);
          }}
          className="bg-blue-500 hover:bg-blue-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          新增工厂
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="搜索工厂..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFactories.map((factory) => (
              <div
                key={factory.id}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white text-lg font-bold">
                    {getInitials(factory.name)}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(factory)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(factory.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-3">{factory.name}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <User className="w-4 h-4" />
                    <span>{factory.manager}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Phone className="w-4 h-4" />
                    <span>{factory.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <MapPin className="w-4 h-4" />
                    <span>{factory.address}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFactory ? '编辑工厂' : '新增工厂'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>工厂名称</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入工厂名称"
              />
            </div>
            <div>
              <Label>联系人</Label>
              <Input
                value={formData.manager}
                onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                placeholder="请输入联系人姓名"
              />
            </div>
            <div>
              <Label>联系电话</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="请输入联系电话"
              />
            </div>
            <div>
              <Label>地址</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="请输入工厂地址"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} className="bg-blue-500 hover:bg-blue-600">
              {editingFactory ? '更新' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
