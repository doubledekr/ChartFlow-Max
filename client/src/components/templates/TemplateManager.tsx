import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Copy, File } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ChartTemplate } from '@shared/schema';

interface TemplateManagerProps {
  onSelectTemplate?: (template: ChartTemplate) => void;
  currentTemplate?: ChartTemplate | null;
}

export function TemplateManager({ onSelectTemplate, currentTemplate }: TemplateManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    config: {
      chartType: 'candlestick',
      colorScheme: 'blue',
      showVolume: true,
      gridLines: true,
    },
    elements: [],
  });

  const { data: templates = [], isLoading } = useQuery<ChartTemplate[]>({
    queryKey: ['/api/templates'],
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: any) => {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
      });
      if (!response.ok) throw new Error('Failed to create template');
      return response.json();
    },
    onSuccess: (template) => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      setIsCreateOpen(false);
      setNewTemplate({
        name: '',
        description: '',
        config: {
          chartType: 'candlestick',
          colorScheme: 'blue',
          showVolume: true,
          gridLines: true,
        },
        elements: [],
      });
      toast({ title: 'Template created successfully' });
      onSelectTemplate?.(template);
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete template');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({ title: 'Template deleted successfully' });
      if (currentTemplate) {
        onSelectTemplate?.(undefined as any);
      }
    },
  });

  const saveCurrentAsTemplate = () => {
    setNewTemplate({
      name: 'Custom Chart Template',
      description: 'Saved from current chart design',
      config: {
        chartType: 'candlestick',
        colorScheme: 'blue',
        showVolume: true,
        gridLines: true,
      },
      elements: [],
    });
    setIsCreateOpen(true);
  };

  const handleCreateTemplate = () => {
    if (!newTemplate.name.trim()) {
      toast({
        title: 'Template name required',
        description: 'Please provide a name for your template',
        variant: 'destructive',
      });
      return;
    }

    createTemplateMutation.mutate(newTemplate);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 rounded"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Chart Templates</h3>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={saveCurrentAsTemplate}
            data-testid="button-save-as-template"
          >
            Save Current
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-create-template">
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Chart Template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Template Name</label>
                  <Input
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    placeholder="My Financial Chart Template"
                    data-testid="input-template-name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description (Optional)</label>
                  <Textarea
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                    placeholder="Template for quarterly earnings analysis..."
                    rows={3}
                    data-testid="textarea-template-description"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTemplate} disabled={createTemplateMutation.isPending}>
                    Create Template
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            <File className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p>No templates yet. Create your first chart template to save your design for reuse.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {templates.map((template) => (
            <Card 
              key={template.id}
              className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                currentTemplate?.id === template.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => onSelectTemplate?.(template)}
              data-testid={`template-card-${template.id}`}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    {template.description && (
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="ghost"
                      data-testid={`button-delete-template-${template.id}`}
                      onClick={() => deleteTemplateMutation.mutate(template.id)}
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex justify-between items-center">
                  <div className="flex gap-2 items-center">
                    <Badge variant="outline">
                      {(template.elements as any[])?.length || 0} elements
                    </Badge>
                    {template.isPublic && (
                      <Badge variant="secondary">Public</Badge>
                    )}
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    {new Date(template.updatedAt || template.createdAt || Date.now()).toLocaleDateString()}
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