import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, TrendingUp, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ChartTemplate, ChartInstance } from '@shared/schema';

interface InstanceManagerProps {
  selectedTemplate?: ChartTemplate | null;
  onSelectInstance?: (instance: ChartInstance) => void;
}

export function InstanceManager({ selectedTemplate, onSelectInstance }: InstanceManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newInstance, setNewInstance] = useState({
    name: '',
    symbol: 'AAPL',
    timeframe: '1Y'
  });

  const { data: instances = [], isLoading } = useQuery<ChartInstance[]>({
    queryKey: ['/api/instances'],
  });

  const createInstanceMutation = useMutation({
    mutationFn: async (instanceData: { templateId: string; name: string; symbol: string; timeframe: string }) => {
      const response = await fetch('/api/instances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(instanceData),
      });
      if (!response.ok) throw new Error('Failed to create instance');
      return response.json();
    },
    onSuccess: (instance) => {
      queryClient.invalidateQueries({ queryKey: ['/api/instances'] });
      setIsCreateOpen(false);
      setNewInstance({ name: '', symbol: 'AAPL', timeframe: '1Y' });
      toast({ title: 'Chart instance created successfully' });
      onSelectInstance?.(instance);
    },
  });

  const deleteInstanceMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/instances/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete instance');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/instances'] });
      toast({ title: 'Chart instance deleted successfully' });
    },
  });

  const handleCreateInstance = () => {
    if (!selectedTemplate) {
      toast({
        title: 'No template selected',
        description: 'Please select a template first',
        variant: 'destructive',
      });
      return;
    }

    if (!newInstance.name.trim() || !newInstance.symbol.trim()) {
      toast({
        title: 'Missing required fields',
        description: 'Please provide both name and symbol',
        variant: 'destructive',
      });
      return;
    }

    createInstanceMutation.mutate({
      templateId: selectedTemplate.id,
      name: newInstance.name,
      symbol: newInstance.symbol.toUpperCase(),
      timeframe: newInstance.timeframe,
    });
  };

  const getLastPrice = (instance: ChartInstance): string => {
    try {
      const data = instance.polygonData as any[];
      if (data && data.length > 0) {
        return `$${data[data.length - 1].close.toFixed(2)}`;
      }
    } catch {
      // Ignore parsing errors
    }
    return 'Loading...';
  };

  const getDataAge = (instance: ChartInstance): string => {
    if (!instance.lastDataUpdate) return 'No data';
    const age = Date.now() - new Date(instance.lastDataUpdate).getTime();
    const hours = Math.floor(age / (1000 * 60 * 60));
    if (hours < 1) return 'Just updated';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Chart Instances</h3>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={!selectedTemplate} data-testid="button-create-instance">
              New Instance
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Chart Instance</DialogTitle>
              {selectedTemplate && (
                <p className="text-sm text-gray-600">Using template: {selectedTemplate.name}</p>
              )}
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Instance Name</label>
                <Input
                  value={newInstance.name}
                  onChange={(e) => setNewInstance({ ...newInstance, name: e.target.value })}
                  placeholder="AAPL Q4 2024 Analysis"
                  data-testid="input-instance-name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Stock Symbol</label>
                <Input
                  value={newInstance.symbol}
                  onChange={(e) => setNewInstance({ ...newInstance, symbol: e.target.value.toUpperCase() })}
                  placeholder="AAPL"
                  data-testid="input-instance-symbol"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Timeframe</label>
                <Select 
                  value={newInstance.timeframe} 
                  onValueChange={(value) => setNewInstance({ ...newInstance, timeframe: value })}
                >
                  <SelectTrigger data-testid="select-instance-timeframe">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1D">1 Day</SelectItem>
                    <SelectItem value="1W">1 Week</SelectItem>
                    <SelectItem value="1M">1 Month</SelectItem>
                    <SelectItem value="3M">3 Months</SelectItem>
                    <SelectItem value="6M">6 Months</SelectItem>
                    <SelectItem value="1Y">1 Year</SelectItem>
                    <SelectItem value="2Y">2 Years</SelectItem>
                    <SelectItem value="5Y">5 Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateInstance} disabled={createInstanceMutation.isPending}>
                  Create Instance
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!selectedTemplate && (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            <p>Select a template to view and create chart instances.</p>
          </CardContent>
        </Card>
      )}

      {selectedTemplate && instances.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            <p>No instances yet. Create your first chart instance from the selected template.</p>
          </CardContent>
        </Card>
      )}

      {selectedTemplate && instances.length > 0 && (
        <div className="grid gap-3">
          {instances
            .filter(instance => instance.templateId === selectedTemplate.id)
            .map((instance) => (
              <Card 
                key={instance.id}
                className="cursor-pointer transition-colors hover:bg-gray-50"
                onClick={() => onSelectInstance?.(instance)}
                data-testid={`instance-card-${instance.id}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">{instance.name}</CardTitle>
                      <p className="text-sm text-gray-600">
                        {instance.symbol} • {instance.timeframe}
                      </p>
                    </div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="ghost"
                        data-testid={`button-delete-instance-${instance.id}`}
                        onClick={() => deleteInstanceMutation.mutate(instance.id)}
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2 items-center">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="font-medium">{getLastPrice(instance)}</span>
                      <Badge variant="outline">{(instance.elements as any[])?.length || 0} annotations</Badge>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <div>Data: {getDataAge(instance)}</div>
                      <div>{new Date(instance.updatedAt || instance.createdAt || Date.now()).toLocaleDateString()}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}