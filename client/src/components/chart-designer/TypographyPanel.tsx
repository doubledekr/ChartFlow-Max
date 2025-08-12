import { Type } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CollapsibleSection } from './CollapsibleSection';
import { useChartDesigner } from '@/hooks/useChartDesigner';

const FONTS = [
  { value: 'Inter', label: 'Inter (Modern)' },
  { value: 'Playfair Display', label: 'Playfair Display (Editorial)' },
  { value: 'Roboto', label: 'Roboto (Clean)' },
  { value: 'Open Sans', label: 'Open Sans (Friendly)' },
];

const FONT_WEIGHTS = [
  { value: '400', label: 'Regular (400)' },
  { value: '500', label: 'Medium (500)' },
  { value: '600', label: 'Semi-bold (600)' },
  { value: '700', label: 'Bold (700)' },
  { value: '800', label: 'Extra-bold (800)' },
];

export function TypographyPanel() {
  const { config, updateTitle, updateSubtitle, updateAxisLabels } = useChartDesigner();

  return (
    <CollapsibleSection title="Typography" icon={<Type size={16} />}>
      <div className="space-y-4">
        {/* Chart Title */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Chart Title</h4>
          <div className="space-y-2">
            <Select 
              value={config.title.font} 
              onValueChange={(value) => updateTitle({ font: value })}
            >
              <SelectTrigger className="text-sm" data-testid="select-title-font">
                <SelectValue placeholder="Select font" />
              </SelectTrigger>
              <SelectContent>
                {FONTS.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex items-center space-x-2">
              <Slider
                value={[config.title.size]}
                onValueChange={(value) => updateTitle({ size: value[0] })}
                max={48}
                min={16}
                step={1}
                className="flex-1"
                data-testid="slider-title-size"
              />
              <span className="text-sm font-medium text-gray-700 min-w-[35px]">
                {config.title.size}px
              </span>
            </div>
            
            <Select 
              value={config.title.weight} 
              onValueChange={(value) => updateTitle({ weight: value })}
            >
              <SelectTrigger className="text-sm" data-testid="select-title-weight">
                <SelectValue placeholder="Select weight" />
              </SelectTrigger>
              <SelectContent>
                {FONT_WEIGHTS.map((weight) => (
                  <SelectItem key={weight.value} value={weight.value}>
                    {weight.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Subtitle */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Subtitle</h4>
          <div className="space-y-2">
            <Select 
              value={config.subtitle.font} 
              onValueChange={(value) => updateSubtitle({ font: value })}
            >
              <SelectTrigger className="text-sm" data-testid="select-subtitle-font">
                <SelectValue placeholder="Select font" />
              </SelectTrigger>
              <SelectContent>
                {FONTS.slice(0, 4).map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    {font.label.replace(' (Modern)', '').replace(' (Editorial)', '').replace(' (Clean)', '')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex items-center space-x-2">
              <Slider
                value={[config.subtitle.size]}
                onValueChange={(value) => updateSubtitle({ size: value[0] })}
                max={24}
                min={12}
                step={1}
                className="flex-1"
                data-testid="slider-subtitle-size"
              />
              <span className="text-sm font-medium text-gray-700 min-w-[35px]">
                {config.subtitle.size}px
              </span>
            </div>
            
            <Select 
              value={config.subtitle.weight} 
              onValueChange={(value) => updateSubtitle({ weight: value })}
            >
              <SelectTrigger className="text-sm" data-testid="select-subtitle-weight">
                <SelectValue placeholder="Select weight" />
              </SelectTrigger>
              <SelectContent>
                {FONT_WEIGHTS.slice(0, 3).map((weight) => (
                  <SelectItem key={weight.value} value={weight.value}>
                    {weight.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Axis Labels */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Axis Labels</h4>
          <div className="space-y-2">
            <Select 
              value={config.axisLabels.font} 
              onValueChange={(value) => updateAxisLabels({ font: value })}
            >
              <SelectTrigger className="text-sm" data-testid="select-axis-font">
                <SelectValue placeholder="Select font" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Inter">Inter</SelectItem>
                <SelectItem value="Roboto">Roboto</SelectItem>
                <SelectItem value="Open Sans">Open Sans</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center space-x-2">
              <Slider
                value={[config.axisLabels.size]}
                onValueChange={(value) => updateAxisLabels({ size: value[0] })}
                max={16}
                min={8}
                step={1}
                className="flex-1"
                data-testid="slider-axis-size"
              />
              <span className="text-sm font-medium text-gray-700 min-w-[35px]">
                {config.axisLabels.size}px
              </span>
            </div>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}
