import { TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CollapsibleSection } from './CollapsibleSection';
import { useChartDesigner } from '@/hooks/useChartDesigner';
import { cn } from '@/lib/utils';

const LINE_STYLES = [
  { key: 'solid', symbol: '━━━━━', label: 'Solid', dashArray: null },
  { key: 'dashed', symbol: '┅┅┅┅┅', label: 'Dashed', dashArray: [10, 5] },
  { key: 'dotted', symbol: '⋯⋯⋯⋯⋯', label: 'Dotted', dashArray: [2, 3] },
  { key: 'dashDot', symbol: '━⋯━⋯━', label: 'Dash-Dot', dashArray: [10, 5, 2, 5] },
  { key: 'longDash', symbol: '━━ ━━ ━━', label: 'Long Dash', dashArray: [15, 10] },
  { key: 'doubleDot', symbol: '⋯⋯ ⋯⋯ ⋯⋯', label: 'Double Dot', dashArray: [2, 3, 2, 8] },
] as const;

const POINT_STYLES = [
  { key: 'none', symbol: '━━━━━', label: 'No Points' },
  { key: 'circle', symbol: '●━●━●', label: 'Circle' },
  { key: 'square', symbol: '■━■━■', label: 'Square' },
  { key: 'triangle', symbol: '▲━▲━▲', label: 'Triangle' },
  { key: 'diamond', symbol: '♦━♦━♦', label: 'Diamond' },
  { key: 'cross', symbol: '✕━✕━✕', label: 'Cross' },
] as const;

export function LineStylingPanel() {
  const { config, updateConfig } = useChartDesigner();

  const handleLineStyleChange = (style: typeof config.lineStyle) => {
    updateConfig({ lineStyle: style });
  };

  const handlePointStyleChange = (style: 'none' | 'circle' | 'square' | 'triangle' | 'diamond' | 'cross') => {
    updateConfig({ pointStyle: style });
  };

  const handleThicknessChange = (value: number[]) => {
    updateConfig({ lineThickness: value[0] });
  };

  const handleCurveStyleChange = (value: string) => {
    updateConfig({ curveStyle: value as typeof config.curveStyle });
  };

  const handlePointSizeChange = (value: number[]) => {
    updateConfig({ pointSize: value[0] });
  };

  const handleShowJunctionDotsChange = (checked: boolean) => {
    updateConfig({ showJunctionDots: checked });
  };

  return (
    <CollapsibleSection title="Line Styling" icon={<TrendingUp size={16} />}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Line Style</Label>
          <div className="grid grid-cols-2 gap-2">
            {LINE_STYLES.map((style) => (
              <Button
                key={style.key}
                variant="outline"
                className={cn(
                  "line-style-btn",
                  config.lineStyle === style.key ? "active" : ""
                )}
                onClick={() => handleLineStyleChange(style.key)}
                data-testid={`line-style-${style.key}`}
              >
                <span className="font-mono">{style.symbol}</span>
              </Button>
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Line Thickness</Label>
          <div className="flex items-center space-x-3">
            <Slider
              value={[config.lineThickness]}
              onValueChange={handleThicknessChange}
              max={8}
              min={1}
              step={1}
              className="flex-1"
              data-testid="slider-line-thickness"
            />
            <span className="text-sm font-medium text-gray-700 min-w-[30px]">
              {config.lineThickness}px
            </span>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Point Markers</Label>
          <div className="grid grid-cols-2 gap-2">
            {POINT_STYLES.map((style) => (
              <Button
                key={style.key}
                variant="outline"
                className={cn(
                  "point-style-btn",
                  config.pointStyle === style.key ? "active" : ""
                )}
                onClick={() => handlePointStyleChange(style.key)}
                data-testid={`point-style-${style.key}`}
              >
                <span className="font-mono text-xs">{style.symbol}</span>
              </Button>
            ))}
          </div>
        </div>

        {config.pointStyle !== 'none' && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Point Size</Label>
            <div className="flex items-center space-x-3">
              <Slider
                value={[config.pointSize || 4]}
                onValueChange={handlePointSizeChange}
                max={12}
                min={2}
                step={1}
                className="flex-1"
                data-testid="slider-point-size"
              />
              <span className="text-sm font-medium text-gray-700 min-w-[30px]">
                {config.pointSize || 4}px
              </span>
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Curve Style</Label>
          <Select value={config.curveStyle} onValueChange={handleCurveStyleChange}>
            <SelectTrigger className="text-sm" data-testid="select-curve-style">
              <SelectValue placeholder="Select curve style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="linear">Sharp/Angular</SelectItem>
              <SelectItem value="smooth">Smooth Curves</SelectItem>
              <SelectItem value="step">Stepped</SelectItem>
              <SelectItem value="basis">Natural Curves</SelectItem>
              <SelectItem value="monotone">Monotone Curves</SelectItem>
              <SelectItem value="cardinal">Cardinal Spline</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-gray-700">Junction Dots</Label>
            <Button
              variant={config.showJunctionDots ? "default" : "outline"}
              size="sm"
              onClick={() => handleShowJunctionDotsChange(!config.showJunctionDots)}
              data-testid="toggle-junction-dots"
            >
              {config.showJunctionDots ? 'ON' : 'OFF'}
            </Button>
          </div>
          <p className="text-xs text-gray-500">Show dots at line bends and intersections</p>
        </div>
      </div>
    </CollapsibleSection>
  );
}
