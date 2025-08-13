import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, Move, Edit3, Trash2, Eye, EyeOff, RotateCw, Palette } from 'lucide-react';

interface ElementPropertiesPanelProps {
  selectedElement: any;
  properties: any;
  onUpdateProperty: (property: string, value: any) => void;
  onDeleteElement?: () => void;
}

export function ElementPropertiesPanel({ 
  selectedElement, 
  properties, 
  onUpdateProperty,
  onDeleteElement
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

  const isChartGroup = properties.type === 'financial-chart-group' || properties.type === 'financial-chart-line' || properties.type === 'chartline';
  const elementType = properties.type;
  const isTextElement = ['title', 'annotation', 'price-label'].includes(elementType);
  const isShapeElement = ['rectangle', 'circle', 'triangle', 'star', 'target', 'alert', 'highlight'].includes(elementType);
  const isLineElement = ['trend-line', 'arrow-up', 'arrow-down'].includes(elementType);
  const isDeletable = !['chartline', 'y-axis-line', 'x-axis-line', 'y-axis-labels', 'x-axis-labels'].includes(elementType);
  
  console.log('ElementPropertiesPanel - elementType:', elementType);
  console.log('ElementPropertiesPanel - isChartGroup:', isChartGroup);
  console.log('ElementPropertiesPanel - properties.properties:', properties.properties);

  return (
    <Card>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {isChartGroup ? (
              <TrendingUp className="h-4 w-4 text-blue-600" />
            ) : (
              <Move className="h-4 w-4 text-gray-600" />
            )}
            <h3 className="text-sm font-medium">
              {isChartGroup || elementType === 'chartline' ? 'Financial Chart Line' : 
               elementType === 'y-axis-labels' ? 'Y-Axis Labels' : 
               elementType === 'x-axis-labels' ? 'X-Axis Labels' :
               elementType === 'y-axis-line' ? 'Y-Axis Line' :
               elementType === 'x-axis-line' ? 'X-Axis Line' :
               elementType === 'title' ? 'Title Text' :
               elementType === 'annotation' ? 'Annotation' :
               elementType === 'price-label' ? 'Price Label' :
               elementType === 'rectangle' ? 'Rectangle' :
               elementType === 'circle' ? 'Circle' :
               elementType === 'triangle' ? 'Triangle' :
               elementType === 'star' ? 'Star' :
               elementType === 'trend-line' ? 'Trend Line' :
               elementType === 'arrow-up' ? 'Up Arrow' :
               elementType === 'arrow-down' ? 'Down Arrow' :
               elementType === 'target' ? 'Price Target' :
               elementType === 'alert' ? 'Alert Marker' :
               elementType === 'highlight' ? 'Highlight Box' : 'Element'}
            </h3>
            {isChartGroup && (
              <Badge variant="outline" className="text-xs">
                {properties.symbol} · {properties.timeframe}
              </Badge>
            )}
          </div>
          
          {/* Delete button for user-added elements */}
          {isDeletable && onDeleteElement && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDeleteElement}
              className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
              data-testid="button-delete-element"
            >
              <Trash2 size={14} />
            </Button>
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
              <div className="flex gap-2 mt-2 flex-wrap">
                {['#000000', '#ffffff', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'].map(color => (
                  <button
                    key={color}
                    className={`w-6 h-6 rounded border-2 transition-all ${
                      properties.properties.color === color 
                        ? 'border-gray-800 scale-110' 
                        : 'border-gray-300 hover:border-gray-400'
                    } ${color === '#ffffff' ? 'border-gray-400' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => onUpdateProperty('color', color)}
                    title={color === '#000000' ? 'Black' : color === '#ffffff' ? 'White' : color}
                  />
                ))}
              </div>
              <div className="mt-3">
                <Label className="text-xs">Custom Color (Hex)</Label>
                <div className="flex gap-2 mt-2">
                  <input
                    type="color"
                    value={properties.properties.color}
                    onChange={(e) => onUpdateProperty('color', e.target.value)}
                    className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
                    title="Color picker"
                  />
                  <input
                    type="text"
                    value={properties.properties.color}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow input while typing, validate on blur
                      if (value.match(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)) {
                        onUpdateProperty('color', value);
                      }
                    }}
                    onBlur={(e) => {
                      const value = e.target.value;
                      // Validate and correct format on blur
                      if (value.match(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)) {
                        onUpdateProperty('color', value.toUpperCase());
                      } else {
                        // Reset to current color if invalid
                        e.target.value = properties.properties.color;
                      }
                    }}
                    placeholder="#3B82F6"
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded font-mono"
                    pattern="^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$"
                    title="Enter hex color code (e.g., #3B82F6)"
                  />
                </div>
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

          {/* Y-axis label properties */}
          {(elementType === 'y-axis-labels' || elementType === 'x-axis-labels') && properties.properties && (
            <>
              <div className="mb-4">
                <Label className="text-sm font-medium">
                  {elementType === 'y-axis-labels' ? 'Y-Axis Labels (Price Numbers)' : 'X-Axis Labels (Dates)'}
                </Label>
              </div>
              <div>
                <Label className="text-xs">Font Size: {properties.properties.fontSize || 12}px</Label>
                <Slider
                  value={[properties.properties.fontSize || 12]}
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

          {/* Text element properties */}
          {isTextElement && properties.properties && (
            <>
              <div className="mb-4">
                <Label className="text-sm font-medium">Text Properties</Label>
              </div>
              
              {/* Text Content */}
              <div>
                <Label className="text-xs">Text Content</Label>
                <input
                  type="text"
                  value={properties.properties.text || selectedElement?.text || ''}
                  onChange={(e) => onUpdateProperty('text', e.target.value)}
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Enter text..."
                />
              </div>

              {/* Font Size */}
              <div>
                <Label className="text-xs">Font Size: {properties.properties.fontSize || 16}px</Label>
                <Slider
                  value={[properties.properties.fontSize || 16]}
                  onValueChange={([value]) => onUpdateProperty('fontSize', value)}
                  min={8}
                  max={72}
                  step={1}
                  className="mt-2"
                />
              </div>

              {/* Text Color */}
              <div>
                <Label className="text-xs">Text Color</Label>
                <div className="mt-2 flex gap-2">
                  <input
                    type="color"
                    value={properties.properties.fill || '#000000'}
                    onChange={(e) => onUpdateProperty('fill', e.target.value)}
                    className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                  />
                </div>
              </div>
            </>
          )}

          {/* Shape element properties */}
          {isShapeElement && properties.properties && (
            <>
              <div className="mb-4">
                <Label className="text-sm font-medium">Shape Properties</Label>
              </div>
              
              {/* Fill Color */}
              <div>
                <Label className="text-xs">Fill Color</Label>
                <div className="mt-2 flex gap-2">
                  <input
                    type="color"
                    value={properties.properties.fill || '#3b82f6'}
                    onChange={(e) => onUpdateProperty('fill', e.target.value)}
                    className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                  />
                </div>
              </div>

              {/* Stroke Color */}
              <div>
                <Label className="text-xs">Border Color</Label>
                <div className="mt-2 flex gap-2">
                  <input
                    type="color"
                    value={properties.properties.stroke || '#000000'}
                    onChange={(e) => onUpdateProperty('stroke', e.target.value)}
                    className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                  />
                </div>
              </div>

              {/* Stroke Width */}
              <div>
                <Label className="text-xs">Border Width: {properties.properties.strokeWidth || 2}px</Label>
                <Slider
                  value={[properties.properties.strokeWidth || 2]}
                  onValueChange={([value]) => onUpdateProperty('strokeWidth', value)}
                  min={0}
                  max={10}
                  step={1}
                  className="mt-2"
                />
              </div>

              {/* Opacity */}
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
            </>
          )}

          {/* Line element properties */}
          {isLineElement && properties.properties && (
            <>
              <div className="mb-4">
                <Label className="text-sm font-medium">Line Properties</Label>
              </div>
              
              {/* Line Color */}
              <div>
                <Label className="text-xs">Line Color</Label>
                <div className="mt-2 flex gap-2">
                  <input
                    type="color"
                    value={properties.properties.stroke || '#3b82f6'}
                    onChange={(e) => onUpdateProperty('stroke', e.target.value)}
                    className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                  />
                </div>
              </div>

              {/* Line Width */}
              <div>
                <Label className="text-xs">Line Width: {properties.properties.strokeWidth || 2}px</Label>
                <Slider
                  value={[properties.properties.strokeWidth || 2]}
                  onValueChange={([value]) => onUpdateProperty('strokeWidth', value)}
                  min={1}
                  max={10}
                  step={1}
                  className="mt-2"
                />
              </div>
            </>
          )}

          {/* Universal Position Controls */}
          {properties.properties && (
            <>
              <div className="mb-4 pt-4 border-t border-gray-200">
                <Label className="text-sm font-medium">Position & Transform</Label>
              </div>
              
              {/* Position */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">X: {Math.round(properties.properties.left || 0)}</Label>
                  <Slider
                    value={[properties.properties.left || 0]}
                    onValueChange={([value]) => onUpdateProperty('left', value)}
                    min={0}
                    max={1000}
                    step={1}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Y: {Math.round(properties.properties.top || 0)}</Label>
                  <Slider
                    value={[properties.properties.top || 0]}
                    onValueChange={([value]) => onUpdateProperty('top', value)}
                    min={0}
                    max={600}
                    step={1}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Rotation */}
              <div>
                <Label className="text-xs">Rotation: {Math.round(properties.properties.angle || 0)}°</Label>
                <Slider
                  value={[properties.properties.angle || 0]}
                  onValueChange={([value]) => onUpdateProperty('angle', value)}
                  min={-180}
                  max={180}
                  step={1}
                  className="mt-2"
                />
              </div>
            </>
          )}
        </div>



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


      </div>
    </Card>
  );
}