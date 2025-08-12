import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

  const isChartGroup = properties.type === 'financial-chart-group';

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
            {isChartGroup ? 'Financial Chart' : 'Chart Element'}
          </h3>
          {isChartGroup && (
            <Badge variant="outline" className="text-xs">
              {properties.symbol} · {properties.timeframe}
            </Badge>
          )}
        </div>

        <div className="space-y-4">
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
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs"
                onClick={() => console.log('Duplicate chart')}
              >
                Duplicate Chart
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs text-red-600 hover:text-red-700"
                onClick={() => console.log('Delete chart')}
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