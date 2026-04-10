import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useProcessConfigs } from '@/hooks/useData';
import { toast } from 'sonner';
import type { ProcessConfig } from '@/types';

export default function ProductionConfig() {
  const { processConfigs, addProcessConfig, updateProcessConfig, deleteProcessConfig } = useProcessConfigs();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ProcessConfig | null>(null);
  const [formData, setFormData] = useState({
    processName: '',
    factoryName: '',
    defaultDuration: 1,
  });

  const filteredConfigs = processConfigs.filter(config =>
    config.processName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    config.factoryName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 按工序名称分组
  const groupedConfigs = filteredConfigs.reduce((acc, config) => {
    if (!acc[config.processName]) {
      acc[config.processName] = [];
    }
    acc[config.processName].push(config);
    return acc;
  }, {} as Record<string, ProcessConfig[]>);

  const handleSubmit = () => {
    if (!formData.processName.trim()) {
      toast.error('请输入工序名称');
      return;
    }
    if (!formData.factoryName.trim()) {
      toast.error('请输入工厂名称');
      return;
    }

    if (editingConfig) {
      updateProcessConfig(editingConfig.id, formData);
      toast.success('配置更新成功');
    } else {
      addProcessConfig(formData.processName, formData.factoryName, formData.defaultDuration);
      toast.success('配置添加成功');
    }

    setIsDialogOpen(false);
    setEditingConfig(null);
    setFormData({ processName: '', factoryName: '', defaultDuration: 1 });
  };

  const handleEdit = (config: ProcessConfig) => {
    setEditingConfig(config);
    setFormData({
      processName: config.processName,
      factoryName: config.factoryName,
      defaultDuration: config.defaultDuration,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string, processName: string, factoryName: string) => {
    if (confirm(`确定要删除"${processName} - ${factoryName}"吗？`)) {
      deleteProcessConfig(id);
      toast.success('配置已删除');
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">生产配置</h1>
          <p className="text-gray-500 mt-1 text-sm md:text-base">管理工序及对应工厂</p>
        </div>
        <Button
          onClick={() => {
            setEditingConfig(null);
            setFormData({ processName: '', factoryName: '', defaultDuration: 1 });
            setIsDialogOpen(true);
          }}
          className="bg-blue-500 hover:bg-blue-600 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          添加配置
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="搜索工序或工厂..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {Object.keys(groupedConfigs).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">暂无配置数据</p>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(true)}
              >
                添加第一个配置
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedConfigs).map(([processName, configs]) => (
                <div key={processName} className="border border-gray-200 rounded-xl overflow-hidden">
                  {/* 工序标题 */}
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">
                          {processName.charAt(0)}
                        </span>
                      </div>
                      <span className="font-semibold text-gray-900">{processName}</span>
                      <span className="text-sm text-gray-500">({configs.length} 个工厂)</span>
                    </div>
                  </div>
                  
                  {/* 工厂列表 */}
                  <div className="divide-y divide-gray-100">
                    {configs.map((config) => (
                      <div 
                        key={config.id} 
                        className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-4">
                          <span className="font-medium text-gray-700">{config.factoryName}</span>
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">
                            <Clock className="w-3 h-3" />
                            {config.defaultDuration} 天
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(config)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(config.id, config.processName, config.factoryName)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingConfig ? '编辑配置' : '添加配置'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>工序名称 <span className="text-red-500">*</span></Label>
              <Input
                value={formData.processName}
                onChange={(e) => setFormData({ ...formData, processName: e.target.value })}
                placeholder="如：印刷、覆膜、模切..."
              />
            </div>
            <div>
              <Label>工厂名称 <span className="text-red-500">*</span></Label>
              <Input
                value={formData.factoryName}
                onChange={(e) => setFormData({ ...formData, factoryName: e.target.value })}
                placeholder="如：广州印刷厂..."
              />
            </div>
            <div>
              <Label>默认生产周期（天）</Label>
              <Input
                type="number"
                min={1}
                max={30}
                value={formData.defaultDuration}
                onChange={(e) => setFormData({ ...formData, defaultDuration: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} className="bg-blue-500 hover:bg-blue-600">
              {editingConfig ? '更新' : '添加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
