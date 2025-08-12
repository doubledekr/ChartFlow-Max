import { TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CollapsibleSection } from './CollapsibleSection';
import { useChartDesigner } from '@/hooks/useChartDesigner';
import { cn } from '@/lib/utils';

const LINE_STYLES = [
  { key: 'solid', symbol: '━━━━━', label: 'Solid' },
  { key: 'dashed', symbol: '┅┅┅┅┅', label: 'Dashed' },
  { key: 'dotted', symbol: '⋯⋯⋯⋯⋯', label: 'Dotted' },
  { key: 'dashDot', symbol: '━⋯━⋯━', label: 'Dash-Dot' },
] as const;

export function LineStylingPanel() {
  const { config, updateConfig } = useChartDesigner();

  const handleLineStyleChange = (style: typeof config.lineStyle) => {
    updateConfig({ lineStyle: style });
  };

  const handleThicknessChange = (value: number[]) => {
    updateConfig({ lineThickness: value[0] });
  };

  const handleCurveStyleChange = (value: string) => {
    updateConfig({ curveStyle: value as typeof config.curveStyle });
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
          <Label className="text-sm font-medium text-gray-700">Curve Style</Label>
          <Select value={config.curveStyle} onValueChange={handleCurveStyleChange}>
            <SelectTrigger className="text-sm" data-testid="select-curve-style">
              <SelectValue placeholder="Select curve style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="linear">Sharp/Linear</SelectItem>
              <SelectItem value="smooth">Smooth</SelectItem>
              <SelectItem value="step">Stepped</SelectItem>
              <SelectItem value="basis">Curved</SelectItem>
              <SelectItem value="monotone">Monotone</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </CollapsibleSection>
  );
}
