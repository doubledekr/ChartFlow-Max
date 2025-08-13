import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, Move, Edit3, Trash2, Eye, EyeOff, RotateCw, Palette } from 'lucide-react';

// Helper functions for line styling
const getCurveStyleFromSmoothness = (smoothness: number) => {
  if (smoothness <= 0.2) return 'linear';
  if (smoothness <= 0.4) return 'low-curve';
  if (smoothness <= 0.6) return 'medium-curve';
  if (smoothness <= 0.8) return 'smooth-curve';
  return 'very-smooth';
};

const getCurveSmoothnessValue = (style: string) => {
  switch (style) {
    case 'linear': return 0.1;
    case 'low-curve': return 0.3;
    case 'medium-curve': return 0.5;
    case 'smooth-curve': return 0.7;
    case 'very-smooth': return 0.9;
    default: return 0.5;
  }
};

const getLinePatternFromDashArray = (dashArray: number[] | null) => {
  if (!dashArray || dashArray.length === 0) return 'solid';
  const pattern = dashArray.join(',');
  if (pattern === '5,5') return 'dashed';
  if (pattern === '2,2') return 'dotted';
  if (pattern === '8,3,2,3') return 'dash-dot';
  if (pattern === '12,4') return 'long-dash';
  return 'solid';
};

const getStrokeDashArray = (pattern: string): number[] | null => {
  switch (pattern) {
    case 'solid': return null;
    case 'dashed': return [5, 5];
    case 'dotted': return [2, 2];
    case 'dash-dot': return [8, 3, 2, 3];
    case 'long-dash': return [12, 4];
    default: return null;
  }
};

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
  const isMultiSelection = elementType === 'multi-selection';
  const isTextElement = ['title', 'annotation', 'price-label', 'source-attribution'].includes(elementType);
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
               isMultiSelection ? `Multi-Selection (${properties.count} items)` :
               elementType === 'y-axis-labels' ? 'Y-Axis Labels (Price)' : 
               elementType === 'x-axis-labels' ? 'X-Axis Labels (Dates)' :
               elementType === 'y-axis-line' ? 'Y-Axis Line' :
               elementType === 'x-axis-line' ? 'X-Axis Line' :
               elementType === 'title' ? 'Title Text' :
               elementType === 'annotation' ? 'Annotation' :
               elementType === 'price-label' ? 'Price Label' :
               elementType === 'source-attribution' ? 'Data Source Attribution' :
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
          {/* Chart line properties - only show when chart line is selected */}
          {(elementType === 'chartline' || elementType === 'financial-chart-line') && properties.properties && (
            <>
              {/* Line Style Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-800 border-b pb-2">Line Style</h4>
                
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

                <div>
                  <Label className="text-xs">Curve Style</Label>
                  <Select 
                    value={getCurveStyleFromSmoothness(properties.properties.smoothness)} 
                    onValueChange={(value) => onUpdateProperty('smoothness', getCurveSmoothnessValue(value))}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="linear">Linear (Sharp Angles)</SelectItem>
                      <SelectItem value="low-curve">Low Curve</SelectItem>
                      <SelectItem value="medium-curve">Medium Curve</SelectItem>
                      <SelectItem value="smooth-curve">Smooth Curve</SelectItem>
                      <SelectItem value="very-smooth">Very Smooth</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Line Pattern</Label>
                  <Select 
                    value={getLinePatternFromDashArray(properties.properties.strokeDashArray)} 
                    onValueChange={(value) => onUpdateProperty('strokeDashArray', getStrokeDashArray(value))}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solid">Solid Line</SelectItem>
                      <SelectItem value="dashed">Dashed Line</SelectItem>
                      <SelectItem value="dotted">Dotted Line</SelectItem>
                      <SelectItem value="dash-dot">Dash-Dot Line</SelectItem>
                      <SelectItem value="long-dash">Long Dash Line</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Line Caps</Label>
                  <Select 
                    value={properties.properties.strokeLineCap || 'round'} 
                    onValueChange={(value) => onUpdateProperty('strokeLineCap', value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="round">Rounded Caps</SelectItem>
                      <SelectItem value="square">Square Caps</SelectItem>
                      <SelectItem value="butt">Flat Caps</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Point Markers Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-800 border-b pb-2">Point Markers</h4>
                
                <div>
                  <Label className="text-xs">Show Data Points</Label>
                  <Button
                    variant={properties.properties.showMarkers !== false ? "default" : "outline"}
                    size="sm"
                    className="w-full mt-1"
                    onClick={() => onUpdateProperty('showMarkers', properties.properties.showMarkers === false)}
                  >
                    {properties.properties.showMarkers !== false ? 'Show Points' : 'Hide Points'}
                  </Button>
                </div>

                {properties.properties.showMarkers !== false && (
                  <>
                    <div>
                      <Label className="text-xs">Marker Style</Label>
                      <Select 
                        value={properties.properties.markerStyle || 'circle'} 
                        onValueChange={(value) => onUpdateProperty('markerStyle', value)}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="circle">Circle</SelectItem>
                          <SelectItem value="square">Square</SelectItem>
                          <SelectItem value="diamond">Diamond</SelectItem>
                          <SelectItem value="triangle">Triangle</SelectItem>
                          <SelectItem value="cross">Cross</SelectItem>
                          <SelectItem value="plus">Plus</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs">Marker Size: {properties.properties.markerSize || 4}px</Label>
                      <Slider
                        value={[properties.properties.markerSize || 4]}
                        onValueChange={([value]) => onUpdateProperty('markerSize', value)}
                        min={2}
                        max={12}
                        step={1}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Marker Frequency</Label>
                      <Select 
                        value={properties.properties.markerFrequency || 'all'} 
                        onValueChange={(value) => onUpdateProperty('markerFrequency', value)}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Points</SelectItem>
                          <SelectItem value="every-2">Every 2nd Point</SelectItem>
                          <SelectItem value="every-5">Every 5th Point</SelectItem>
                          <SelectItem value="every-10">Every 10th Point</SelectItem>
                          <SelectItem value="endpoints">Start & End Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>

              {/* Junction Dots Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-800 border-b pb-2">Junction Effects</h4>
                
                <div>
                  <Label className="text-xs">Junction Dots</Label>
                  <Button
                    variant={properties.properties.showJunctions !== false ? "default" : "outline"}
                    size="sm"
                    className="w-full mt-1"
                    onClick={() => onUpdateProperty('showJunctions', properties.properties.showJunctions === false)}
                  >
                    {properties.properties.showJunctions !== false ? 'Show Junctions' : 'Hide Junctions'}
                  </Button>
                </div>

                {properties.properties.showJunctions !== false && (
                  <>
                    <div>
                      <Label className="text-xs">Junction Size: {properties.properties.junctionSize || 3}px</Label>
                      <Slider
                        value={[properties.properties.junctionSize || 3]}
                        onValueChange={([value]) => onUpdateProperty('junctionSize', value)}
                        min={1}
                        max={8}
                        step={1}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Junction Color</Label>
                      <div className="flex gap-2 mt-2">
                        <input
                          type="color"
                          value={properties.properties.junctionColor || properties.properties.color}
                          onChange={(e) => onUpdateProperty('junctionColor', e.target.value)}
                          className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
                          title="Junction color picker"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => onUpdateProperty('junctionColor', properties.properties.color)}
                        >
                          Match Line
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Color Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-800 border-b pb-2">Color</h4>
                
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
                      <Input
                        type="text"
                        value={properties.properties.color}
                        onChange={(e) => {
                          // Allow typing without immediate validation
                          onUpdateProperty('color', e.target.value);
                        }}
                        onBlur={(e) => {
                          const value = e.target.value.trim();
                          // Add # if missing
                          const normalizedValue = value.startsWith('#') ? value : `#${value}`;
                          
                          if (normalizedValue.match(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)) {
                            onUpdateProperty('color', normalizedValue.toUpperCase());
                          } else {
                            // Reset to previous valid color if invalid
                            onUpdateProperty('color', properties.properties.color);
                          }
                        }}
                        placeholder="#3B82F6"
                        className="flex-1 text-xs font-mono"
                        title="Enter hex color code (e.g., #3B82F6)"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Visibility Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-800 border-b pb-2">Visibility</h4>
                
                <div>
                  <Label className="text-xs">Show/Hide Line</Label>
                  <Button
                    variant={properties.properties.visible !== false ? "default" : "outline"}
                    size="sm"
                    className="w-full mt-1"
                    onClick={() => onUpdateProperty('visible', properties.properties.visible === false)}
                  >
                    {properties.properties.visible !== false ? 'Visible' : 'Hidden'}
                  </Button>
                </div>
              </div>
            </>
          )}
          
          {/* Axis line controls */}
          {(elementType === 'y-axis-line' || elementType === 'x-axis-line') && properties.properties && (
            <>
              <div className="mb-4">
                <Label className="text-sm font-medium">
                  {elementType === 'y-axis-line' ? 'Y-Axis Line (Vertical)' : 'X-Axis Line (Horizontal)'}
                </Label>
              </div>
              
              {/* Line Style Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-800 border-b pb-2">Line Style</h4>
                
                <div>
                  <Label className="text-xs">Line Thickness: {properties.properties.strokeWidth || 1}px</Label>
                  <Slider
                    value={[properties.properties.strokeWidth || 1]}
                    onValueChange={([value]) => onUpdateProperty('strokeWidth', value)}
                    min={0.5}
                    max={10}
                    step={0.5}
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
                  <Label className="text-xs">Line Pattern</Label>
                  <Select 
                    value={getLinePatternFromDashArray(properties.properties.strokeDashArray)} 
                    onValueChange={(value) => onUpdateProperty('strokeDashArray', getStrokeDashArray(value))}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solid">Solid</SelectItem>
                      <SelectItem value="dashed">Dashed</SelectItem>
                      <SelectItem value="dotted">Dotted</SelectItem>
                      <SelectItem value="dash-dot">Dash-Dot</SelectItem>
                      <SelectItem value="long-dash">Long Dash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Color Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-800 border-b pb-2">Color</h4>
                
                <div className="mt-3">
                  <Label className="text-xs">Line Color</Label>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="color"
                      value={properties.properties.stroke}
                      onChange={(e) => onUpdateProperty('stroke', e.target.value)}
                      className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
                      title="Color picker"
                    />
                    <Input
                      type="text"
                      value={properties.properties.stroke}
                      onChange={(e) => onUpdateProperty('stroke', e.target.value)}
                      onBlur={(e) => {
                        const value = e.target.value.trim();
                        const normalizedValue = value.startsWith('#') ? value : `#${value}`;
                        if (normalizedValue.match(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)) {
                          onUpdateProperty('stroke', normalizedValue.toUpperCase());
                        } else {
                          onUpdateProperty('stroke', properties.properties.stroke);
                        }
                      }}
                      placeholder="#666666"
                      className="flex-1 text-xs font-mono"
                      title="Enter hex color code"
                    />
                  </div>
                </div>
              </div>
              
              {/* Visibility Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-800 border-b pb-2">Visibility</h4>
                
                <div>
                  <Label className="text-xs">Show/Hide Line</Label>
                  <Button
                    variant={properties.properties.visible !== false ? "default" : "outline"}
                    size="sm"
                    className="w-full mt-1"
                    onClick={() => onUpdateProperty('visible', properties.properties.visible === false)}
                  >
                    {properties.properties.visible !== false ? 'Visible' : 'Hidden'}
                  </Button>
                </div>
                
                {/* Grid lines control */}
                <div>
                  <Label className="text-xs">
                    {elementType === 'y-axis-line' ? 'Show Horizontal Grid Lines' : 'Show Vertical Grid Lines'}
                  </Label>
                  <Button
                    variant={properties.properties.gridLinesVisible ? "default" : "outline"}
                    size="sm"
                    className="w-full mt-1"
                    onClick={() => onUpdateProperty('gridLinesVisible', !properties.properties.gridLinesVisible)}
                  >
                    {properties.properties.gridLinesVisible ? 'Grid Lines On' : 'Grid Lines Off'}
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Y-axis label properties */}
          {(elementType === 'y-axis-labels' || elementType === 'x-axis-labels' || isMultiSelection) && properties.properties && (
            <>
              <div className="mb-4">
                <Label className="text-sm font-medium">
                  {isMultiSelection ? `Multi-Selection (${properties.count} items)` :
                   elementType === 'y-axis-labels' ? 'Y-Axis Labels (Price Numbers)' : 'X-Axis Labels (Dates)'}
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
                  <input
                    type="text"
                    value={properties.properties.fill}
                    onChange={(e) => onUpdateProperty('fill', e.target.value)}
                    onBlur={(e) => {
                      const value = e.target.value.trim();
                      const normalizedValue = value.startsWith('#') ? value : `#${value}`;
                      if (normalizedValue.match(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)) {
                        onUpdateProperty('fill', normalizedValue.toUpperCase());
                      } else {
                        onUpdateProperty('fill', properties.properties.fill);
                      }
                    }}
                    placeholder="#666666"
                    className="flex-1 text-xs font-mono"
                    title="Enter hex color code"
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
                    <SelectItem value="Roboto, sans-serif">Roboto</SelectItem>
                    <SelectItem value="Open Sans, sans-serif">Open Sans</SelectItem>
                    <SelectItem value="Lato, sans-serif">Lato</SelectItem>
                    <SelectItem value="Montserrat, sans-serif">Montserrat</SelectItem>
                    <SelectItem value="Poppins, sans-serif">Poppins</SelectItem>
                    <SelectItem value="Source Sans Pro, sans-serif">Source Sans Pro</SelectItem>
                    <SelectItem value="Nunito, sans-serif">Nunito</SelectItem>
                    <SelectItem value="Work Sans, sans-serif">Work Sans</SelectItem>
                    <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                    <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                    <SelectItem value="Playfair Display, serif">Playfair Display</SelectItem>
                    <SelectItem value="Merriweather, serif">Merriweather</SelectItem>
                    <SelectItem value="Lora, serif">Lora</SelectItem>
                    <SelectItem value="Source Serif Pro, serif">Source Serif Pro</SelectItem>
                    <SelectItem value="Times New Roman, serif">Times New Roman</SelectItem>
                    <SelectItem value="Georgia, serif">Georgia</SelectItem>
                    <SelectItem value="Fira Code, monospace">Fira Code</SelectItem>
                    <SelectItem value="Source Code Pro, monospace">Source Code Pro</SelectItem>
                    <SelectItem value="JetBrains Mono, monospace">JetBrains Mono</SelectItem>
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
              
              {/* Axis Line Design Controls */}
              <div className="space-y-4 mt-6 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-800">Related Axis Line</h4>
                
                <div>
                  <Label className="text-xs">Line Thickness: {properties.properties.yAxisLineStroke || properties.properties.xAxisLineStroke || 1}px</Label>
                  <Slider
                    value={[properties.properties.yAxisLineStroke || properties.properties.xAxisLineStroke || 1]}
                    onValueChange={([value]) => {
                      // Update the corresponding axis line thickness
                      const property = elementType === 'y-axis-labels' ? 'yAxisLineStroke' : 'xAxisLineStroke';
                      onUpdateProperty(property, value);
                      
                      // Also find and update the actual axis line element on canvas
                      const canvas = (window as any).fabricCanvas;
                      if (canvas) {
                        const axisLineType = elementType === 'y-axis-labels' ? 'y-axis-line' : 'x-axis-line';
                        const axisLineElements = canvas.getObjects().filter((obj: any) => obj.type === axisLineType);
                        axisLineElements.forEach((axisLine: any) => {
                          axisLine.set('strokeWidth', value);
                          canvas.renderAll();
                        });
                      }
                    }}
                    min={0.5}
                    max={5}
                    step={0.5}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label className="text-xs">Line Color</Label>
                  <div className="mt-2 flex gap-2">
                    <input
                      type="color"
                      value={properties.properties.yAxisLineColor || properties.properties.xAxisLineColor || "#d1d5db"}
                      onChange={(e) => {
                        const property = elementType === 'y-axis-labels' ? 'yAxisLineColor' : 'xAxisLineColor';
                        onUpdateProperty(property, e.target.value);
                        
                        // Also find and update the actual axis line element on canvas
                        const canvas = (window as any).fabricCanvas;
                        if (canvas) {
                          const axisLineType = elementType === 'y-axis-labels' ? 'y-axis-line' : 'x-axis-line';
                          const axisLineElements = canvas.getObjects().filter((obj: any) => obj.type === axisLineType);
                          axisLineElements.forEach((axisLine: any) => {
                            axisLine.set('stroke', e.target.value);
                            canvas.renderAll();
                          });
                        }
                      }}
                      className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={properties.properties.yAxisLineColor || properties.properties.xAxisLineColor || "#d1d5db"}
                      onChange={(e) => {
                        const property = elementType === 'y-axis-labels' ? 'yAxisLineColor' : 'xAxisLineColor';
                        onUpdateProperty(property, e.target.value);
                      }}
                      onBlur={(e) => {
                        const value = e.target.value.trim();
                        const normalizedValue = value.startsWith('#') ? value : `#${value}`;
                        if (normalizedValue.match(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)) {
                          const property = elementType === 'y-axis-labels' ? 'yAxisLineColor' : 'xAxisLineColor';
                          onUpdateProperty(property, normalizedValue.toUpperCase());
                          
                          // Also find and update the actual axis line element on canvas
                          const canvas = (window as any).fabricCanvas;
                          if (canvas) {
                            const axisLineType = elementType === 'y-axis-labels' ? 'y-axis-line' : 'x-axis-line';
                            const axisLineElements = canvas.getObjects().filter((obj: any) => obj.type === axisLineType);
                            axisLineElements.forEach((axisLine: any) => {
                              axisLine.set('stroke', normalizedValue.toUpperCase());
                              canvas.renderAll();
                            });
                          }
                        }
                      }}
                      placeholder="#D1D5DB"
                      className="flex-1 text-xs font-mono"
                      title="Enter hex color code for axis line"
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs">Line Style</Label>
                  <Select value={properties.properties.yAxisLineStyle || properties.properties.xAxisLineStyle || "solid"} onValueChange={(value) => {
                    const property = elementType === 'y-axis-labels' ? 'yAxisLineStyle' : 'xAxisLineStyle';
                    onUpdateProperty(property, value);
                    
                    // Also find and update the actual axis line element on canvas
                    const canvas = (window as any).fabricCanvas;
                    if (canvas) {
                      let dashArray = [];
                      switch (value) {
                        case 'dashed': dashArray = [5, 5]; break;
                        case 'dotted': dashArray = [2, 2]; break;
                        case 'dash-dot': dashArray = [10, 5, 2, 5]; break;
                        case 'long-dash': dashArray = [15, 5]; break;
                        default: dashArray = []; break;
                      }
                      
                      const axisLineType = elementType === 'y-axis-labels' ? 'y-axis-line' : 'x-axis-line';
                      const axisLineElements = canvas.getObjects().filter((obj: any) => obj.type === axisLineType);
                      axisLineElements.forEach((axisLine: any) => {
                        axisLine.set('strokeDashArray', dashArray);
                        canvas.renderAll();
                      });
                    }
                  }}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solid">Solid</SelectItem>
                      <SelectItem value="dashed">Dashed</SelectItem>
                      <SelectItem value="dotted">Dotted</SelectItem>
                      <SelectItem value="dash-dot">Dash-Dot</SelectItem>
                      <SelectItem value="long-dash">Long Dash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-xs">Line Opacity: {Math.round((properties.properties.yAxisLineOpacity || properties.properties.xAxisLineOpacity || 1) * 100)}%</Label>
                  <Slider
                    value={[properties.properties.yAxisLineOpacity || properties.properties.xAxisLineOpacity || 1]}
                    onValueChange={([value]) => {
                      const property = elementType === 'y-axis-labels' ? 'yAxisLineOpacity' : 'xAxisLineOpacity';
                      onUpdateProperty(property, value);
                      
                      // Also find and update the actual axis line element on canvas
                      const canvas = (window as any).fabricCanvas;
                      if (canvas) {
                        const axisLineType = elementType === 'y-axis-labels' ? 'y-axis-line' : 'x-axis-line';
                        const axisLineElements = canvas.getObjects().filter((obj: any) => obj.type === axisLineType);
                        axisLineElements.forEach((axisLine: any) => {
                          axisLine.set('opacity', value);
                          canvas.renderAll();
                        });
                      }
                    }}
                    min={0}
                    max={1}
                    step={0.1}
                    className="mt-2"
                  />
                </div>
              </div>
              
              {/* Visibility Section */}
              <div className="space-y-4 mt-6 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-800">Visibility</h4>
                
                <div>
                  <Label className="text-xs">Show/Hide Labels</Label>
                  <Button
                    variant={properties.properties.visible !== false ? "default" : "outline"}
                    size="sm"
                    className="w-full mt-1"
                    onClick={() => onUpdateProperty('visible', properties.properties.visible === false)}
                  >
                    {properties.properties.visible !== false ? 'Visible' : 'Hidden'}
                  </Button>
                </div>
                
                <div>
                  <Label className="text-xs">Show/Hide Axis Line</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-1"
                    onClick={() => {
                      const property = elementType === 'y-axis-labels' ? 'yAxisLineVisible' : 'xAxisLineVisible';
                      onUpdateProperty(property, true);
                    }}
                  >
                    Toggle Line
                  </Button>
                </div>
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