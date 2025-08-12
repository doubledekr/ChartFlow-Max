import { Ruler } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CollapsibleSection } from './CollapsibleSection';
import { useChartDesigner } from '@/hooks/useChartDesigner';

export function AxisFormattingPanel() {
  const { config, updateConfig, updateGridLines, updateAxisRange } = useChartDesigner();

  const handleYAxisFormatChange = (value: string) => {
    updateConfig({ yAxisFormat: value as typeof config.yAxisFormat });
  };

  const handleGridStyleChange = (value: string) => {
    updateGridLines({ style: value as typeof config.gridLines.style });
  };

  const handleGridOpacityChange = (value: number[]) => {
    updateGridLines({ opacity: value[0] });
  };

  const handleAutoRangeChange = (checked: boolean) => {
    updateAxisRange({ auto: checked });
  };

  const handleMinValueChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      updateAxisRange({ min: numValue });
    }
  };

  const handleMaxValueChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      updateAxisRange({ max: numValue });
    }
  };

  return (
    <CollapsibleSection title="Axis Formatting" icon={<Ruler size={16} />}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Y-Axis Number Format</Label>
          <Select value={config.yAxisFormat} onValueChange={handleYAxisFormatChange}>
            <SelectTrigger className="text-sm" data-testid="select-y-axis-format">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="currency">Currency ($1,234)</SelectItem>
              <SelectItem value="percentage">Percentage (12.3%)</SelectItem>
              <SelectItem value="decimal">Decimal (1,234.56)</SelectItem>
              <SelectItem value="integer">Integer (1,234)</SelectItem>
              <SelectItem value="scientific">Scientific (1.23e+3)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Grid Lines</Label>
          <div className="flex space-x-2">
            <Select value={config.gridLines.style} onValueChange={handleGridStyleChange}>
              <SelectTrigger className="flex-1 text-sm" data-testid="select-grid-style">
                <SelectValue placeholder="Style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solid">Solid</SelectItem>
                <SelectItem value="dashed">Dashed</SelectItem>
                <SelectItem value="dotted">Dotted</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-1">
              <Slider
                value={[config.gridLines.opacity]}
                onValueChange={handleGridOpacityChange}
                max={100}
                min={0}
                step={1}
                className="w-16"
                data-testid="slider-grid-opacity"
              />
              <span className="text-xs text-gray-500 min-w-[30px]">
                {config.gridLines.opacity}%
              </span>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Y-Axis Range</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={config.axisRange.auto}
                onCheckedChange={handleAutoRangeChange}
                data-testid="checkbox-auto-range"
              />
              <span className="text-sm text-gray-600">Auto Range</span>
            </div>
            {!config.axisRange.auto && (
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={config.axisRange.min || ''}
                  onChange={(e) => handleMinValueChange(e.target.value)}
                  className="text-sm"
                  data-testid="input-range-min"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={config.axisRange.max || ''}
                  onChange={(e) => handleMaxValueChange(e.target.value)}
                  className="text-sm"
                  data-testid="input-range-max"
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Axis Labels</Label>
          <Input
            type="text"
            placeholder="X-Axis Title"
            value={config.xAxisLabel}
            onChange={(e) => updateConfig({ xAxisLabel: e.target.value })}
            className="text-sm"
            data-testid="input-x-axis-label"
          />
          <Input
            type="text"
            placeholder="Y-Axis Title"
            value={config.yAxisLabel}
            onChange={(e) => updateConfig({ yAxisLabel: e.target.value })}
            className="text-sm"
            data-testid="input-y-axis-label"
          />
        </div>
      </div>
    </CollapsibleSection>
  );
}
