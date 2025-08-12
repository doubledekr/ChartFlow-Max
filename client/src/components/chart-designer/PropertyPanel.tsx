import { Settings } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useChartDesigner } from '@/hooks/useChartDesigner';

export function PropertyPanel() {
  const { selectedElement, updateElement, updateTitle } = useChartDesigner();

  if (!selectedElement) {
    return (
      <div className="p-4 border-t border-gray-200">
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center">
            <Settings className="mr-2 text-primary" size={16} />
            Properties
          </h3>
          <div className="text-sm text-gray-500 text-center py-8">
            Select an element to edit its properties
          </div>
        </div>
      </div>
    );
  }

  const handleContentChange = (content: string) => {
    updateElement(selectedElement.id, { content });
    if (selectedElement.type === 'title') {
      updateTitle({ text: content });
    }
  };

  const handleStyleChange = (styleKey: string, value: string | number) => {
    updateElement(selectedElement.id, {
      style: { ...selectedElement.style, [styleKey]: value }
    });
  };

  const handlePositionChange = (axis: 'x' | 'y', value: string) => {
    const numValue = parseInt(value) || 0;
    updateElement(selectedElement.id, { [axis]: numValue });
  };

  return (
    <div className="flex-1 p-4 border-t border-gray-200" data-testid="property-panel">
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 flex items-center">
          <Settings className="mr-2 text-primary" size={16} />
          Properties
        </h3>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-900 capitalize">
              {selectedElement.type} Selected
            </span>
          </div>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="element-content" className="text-sm font-medium text-gray-700 mb-1">
                Text
              </Label>
              <Input
                id="element-content"
                type="text"
                value={selectedElement.content}
                onChange={(e) => handleContentChange(e.target.value)}
                className="text-sm"
                data-testid="input-element-content"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="element-font-size" className="text-sm font-medium text-gray-700 mb-1">
                  Font Size
                </Label>
                <Input
                  id="element-font-size"
                  type="number"
                  value={selectedElement.style.fontSize || 14}
                  onChange={(e) => handleStyleChange('fontSize', parseInt(e.target.value) || 14)}
                  className="text-sm"
                  data-testid="input-element-font-size"
                />
              </div>
              <div>
                <Label htmlFor="element-font-weight" className="text-sm font-medium text-gray-700 mb-1">
                  Font Weight
                </Label>
                <Select 
                  value={selectedElement.style.fontWeight || '400'} 
                  onValueChange={(value) => handleStyleChange('fontWeight', value)}
                >
                  <SelectTrigger className="text-sm" data-testid="select-element-font-weight">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="400">Regular</SelectItem>
                    <SelectItem value="500">Medium</SelectItem>
                    <SelectItem value="600">Semi-bold</SelectItem>
                    <SelectItem value="700">Bold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="element-color" className="text-sm font-medium text-gray-700 mb-1">
                Color
              </Label>
              <input
                id="element-color"
                type="color"
                value={selectedElement.style.color || '#000000'}
                onChange={(e) => handleStyleChange('color', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                data-testid="input-element-color"
              />
            </div>
            
            {selectedElement.style.backgroundColor && (
              <div>
                <Label htmlFor="element-bg-color" className="text-sm font-medium text-gray-700 mb-1">
                  Background Color
                </Label>
                <input
                  id="element-bg-color"
                  type="color"
                  value={selectedElement.style.backgroundColor}
                  onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                  data-testid="input-element-bg-color"
                />
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="element-x" className="text-sm font-medium text-gray-700 mb-1">
                  X Position
                </Label>
                <Input
                  id="element-x"
                  type="number"
                  value={selectedElement.x}
                  onChange={(e) => handlePositionChange('x', e.target.value)}
                  className="text-sm"
                  data-testid="input-element-x"
                />
              </div>
              <div>
                <Label htmlFor="element-y" className="text-sm font-medium text-gray-700 mb-1">
                  Y Position
                </Label>
                <Input
                  id="element-y"
                  type="number"
                  value={selectedElement.y}
                  onChange={(e) => handlePositionChange('y', e.target.value)}
                  className="text-sm"
                  data-testid="input-element-y"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
