import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, Move, Edit3 } from 'lucide-react';

interface ElementPropertiesPanelProps {
  selectedElement: any;
  properties: any;
  onUpdateProperty: (property: string, value: any) => void;
}

export function ElementPropertiesPanel({ 
  selectedElement, 
  properties, 
  onUpdateProperty 
}: ElementPropertiesPanelProps) {
  console.log('ElementPropertiesPanel - selectedElement:', selectedElement);
  console.log('ElementPropertiesPanel - properties:', properties);
  
  if (!selectedElement || !properties) {
    return (
      <Card>
        <div className="p-4 text-center text-gray-500">
          <Edit3 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">Select a chart element to edit its properties</p>
        </div>
      </Card>
    );
  }

  const isChartGroup = properties.type === 'financial-chart-group' || properties.type === 'financial-chart-line';
  const elementType = properties.type;
  
  console.log('ElementPropertiesPanel - elementType:', elementType);
  console.log('ElementPropertiesPanel - isChartGroup:', isChartGroup);
  console.log('ElementPropertiesPanel - properties.properties:', properties.properties);

  return (
    <Card>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          {isChartGroup ? (
            <TrendingUp className="h-4 w-4 text-blue-600" />
          ) : (
            <Move className="h-4 w-4 text-gray-600" />
          )}
          <h3 className="text-sm font-medium">
            {isChartGroup ? 'Financial Chart Line' : 
             elementType === 'y-axis-labels' ? 'Y-Axis Labels' : 
             elementType === 'x-axis-labels' ? 'X-Axis Labels' :
             elementType === 'y-axis-line' ? 'Y-Axis Line' :
             elementType === 'x-axis-line' ? 'X-Axis Line' : 'Chart Element'}
          </h3>
          {isChartGroup && (
            <Badge variant="outline" className="text-xs">
              {properties.symbol} · {properties.timeframe}
            </Badge>
          )}
        </div>

        <div className="space-y-4">
          {/* Chart line properties - only show if properties exist */}
          {isChartGroup && properties.properties && (
            <div>
              <Label className="text-xs">Line Thickness: {properties.properties.strokeWidth}px</Label>
              <Slider
                value={[properties.properties.strokeWidth]}
                onValueChange={([value]) => onUpdateProperty('strokeWidth', value)}
                min={1}
                max={20}
                step={1}
                className="mt-2"
              />
            </div>
          )}
          
          {isChartGroup && properties.properties && (
            <div>
              <Label className="text-xs">Opacity: {Math.round(properties.properties.opacity * 100)}%</Label>
              <Slider
                value={[properties.properties.opacity]}
                onValueChange={([value]) => onUpdateProperty('opacity', value)}
                min={0.1}
                max={1}
                step={0.1}
                className="mt-2"
              />
            </div>
          )}

          {isChartGroup && properties.properties && (
            <div>
              <Label className="text-xs">Smoothness: {Math.round(properties.properties.smoothness * 100)}%</Label>
              <Slider
                value={[properties.properties.smoothness]}
                onValueChange={([value]) => onUpdateProperty('smoothness', value)}
                min={0}
                max={1}
                step={0.1}
                className="mt-2"
              />
            </div>
          )}

          {isChartGroup && properties.properties && (
            <div>
              <Label className="text-xs">Line Color</Label>
              <div className="flex gap-2 mt-2">
                {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'].map(color => (
                  <button
                    key={color}
                    className={`w-6 h-6 rounded border-2 transition-all ${
                      properties.properties.color === color 
                        ? 'border-gray-800 scale-110' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => onUpdateProperty('color', color)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Visibility toggle for chart line */}
          {isChartGroup && properties.properties && (
            <div>
              <Label className="text-xs">Visibility</Label>
              <Button
                variant={properties.properties.visible !== false ? "default" : "outline"}
                size="sm"
                className="w-full mt-1"
                onClick={() => onUpdateProperty('visible', properties.properties.visible === false)}
              >
                {properties.properties.visible !== false ? 'Visible' : 'Hidden'}
              </Button>
            </div>
          )}
          
          {/* Axis line controls */}
          {(elementType === 'y-axis-line' || elementType === 'x-axis-line') && properties.properties && (
            <>
              <div>
                <Label className="text-xs">Line Thickness: {properties.properties.strokeWidth || 1}px</Label>
                <Slider
                  value={[properties.properties.strokeWidth || 1]}
                  onValueChange={([value]) => onUpdateProperty('strokeWidth', value)}
                  min={1}
                  max={10}
                  step={1}
                  className="mt-2"
                />
              </div>
              <div>
                <Label className="text-xs">Opacity: {Math.round((properties.properties.opacity || 1) * 100)}%</Label>
                <Slider
                  value={[properties.properties.opacity || 1]}
                  onValueChange={([value]) => onUpdateProperty('opacity', value)}
                  min={0.1}
                  max={1}
                  step={0.1}
                  className="mt-2"
                />
              </div>
              <div>
                <Label className="text-xs">Visibility</Label>
                <Button
                  variant={properties.properties.visible !== false ? "default" : "outline"}
                  size="sm"
                  className="w-full mt-1"
                  onClick={() => onUpdateProperty('visible', properties.properties.visible === false)}
                >
                  {properties.properties.visible !== false ? 'Visible' : 'Hidden'}
                </Button>
              </div>
            </>
          )}

          {/* Axis label properties */}
          {(elementType === 'y-axis-labels' || elementType === 'x-axis-labels') && properties.properties && (
            <>
              <div>
                <Label className="text-xs">Font Size: {properties.properties.fontSize}px</Label>
                <Slider
                  value={[properties.properties.fontSize]}
                  onValueChange={([value]) => onUpdateProperty('fontSize', value)}
                  min={8}
                  max={24}
                  step={1}
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label className="text-xs">Font Color</Label>
                <div className="mt-2 flex gap-2">
                  <input
                    type="color"
                    value={properties.properties.fill}
                    onChange={(e) => onUpdateProperty('fill', e.target.value)}
                    className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Font Family</Label>
                <Select value={properties.properties.fontFamily} onValueChange={(value) => onUpdateProperty('fontFamily', value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inter, sans-serif">Inter</SelectItem>
                    <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                    <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                    <SelectItem value="Times New Roman, serif">Times New Roman</SelectItem>
                    <SelectItem value="Georgia, serif">Georgia</SelectItem>
                    <SelectItem value="Courier New, monospace">Courier New</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Font Weight</Label>
                <Select value={properties.properties.fontWeight} onValueChange={(value) => onUpdateProperty('fontWeight', value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="bold">Bold</SelectItem>
                    <SelectItem value="600">Semi Bold</SelectItem>
                    <SelectItem value="300">Light</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        {isChartGroup && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700 font-medium mb-1">Interactive Features:</p>
            <p className="text-xs text-blue-600">• Double-click axis labels to edit text</p>
            <p className="text-xs text-blue-600">• Drag to move chart and labels together</p>
            <p className="text-xs text-blue-600">• Scale handles resize entire chart group</p>
          </div>
        )}

        {isChartGroup && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-600 mb-2">Chart Actions:</div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs"
                onClick={() => {
                  if (selectedElement?.duplicateFunction) {
                    selectedElement.duplicateFunction();
                  }
                }}
              >
                Duplicate Chart
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs text-red-600 hover:text-red-700"
                onClick={() => {
                  if (selectedElement?.deleteFunction) {
                    selectedElement.deleteFunction();
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        )}

        {/* Axis Labels Properties */}
        {(elementType === 'y-axis-labels' || elementType === 'x-axis-labels') && (
          <div className="space-y-3">
            <div className="text-sm font-medium">
              {elementType === 'y-axis-labels' ? 'Y-Axis Labels' : 'X-Axis Labels'}
            </div>
            <div className="space-y-2">
              <div>
                <Label className="text-xs text-gray-600">Font Size</Label>
                <Slider
                  value={[properties?.fontSize || 12]}
                  onValueChange={(value) => onUpdateProperty('fontSize', value[0])}
                  min={8}
                  max={24}
                  step={1}
                  className="mt-1"
                />
                <span className="text-xs text-gray-500">{properties?.fontSize || 12}px</span>
              </div>
              
              <div>
                <Label className="text-xs text-gray-600">Color</Label>
                <div className="flex gap-2 mt-1">
                  <input 
                    type="color" 
                    value={properties?.fill || '#666666'}
                    onChange={(e) => onUpdateProperty('fill', e.target.value)}
                    className="w-8 h-6 rounded border"
                  />
                  <span className="text-xs text-gray-500 self-center">{properties?.fill || '#666666'}</span>
                </div>
              </div>

              <div>
                <Label className="text-xs text-gray-600">Font Weight</Label>
                <Select value={properties?.fontWeight || 'normal'} onValueChange={(value) => onUpdateProperty('fontWeight', value)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="bold">Bold</SelectItem>
                    <SelectItem value="lighter">Light</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-gray-600">Font Family</Label>
                <Select value={properties?.fontFamily || 'Inter, sans-serif'} onValueChange={(value) => onUpdateProperty('fontFamily', value)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inter, sans-serif">Inter</SelectItem>
                    <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                    <SelectItem value="Times New Roman, serif">Times New Roman</SelectItem>
                    <SelectItem value="Courier New, monospace">Courier New</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}