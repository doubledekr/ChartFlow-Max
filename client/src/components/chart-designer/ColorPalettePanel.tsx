import { Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CollapsibleSection } from './CollapsibleSection';
import { useChartDesigner } from '@/hooks/useChartDesigner';
import { cn } from '@/lib/utils';

const COLOR_THEMES = {
  financial: '#0066CC',
  growth: '#10B981',
  executive: '#8B5CF6',
  editorial: '#EF4444',
};

export function ColorPalettePanel() {
  const { config, updateConfig } = useChartDesigner();

  const handleThemeChange = (theme: string) => {
    updateConfig({ colorPalette: theme });
  };

  const handleCustomColorChange = (index: number, color: string) => {
    const newColors = [...config.customColors];
    newColors[index] = color;
    updateConfig({ customColors: newColors });
  };

  return (
    <CollapsibleSection title="Color Palette" icon={<Palette size={16} />}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Preset Themes</Label>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(COLOR_THEMES).map(([theme, color]) => (
              <Button
                key={theme}
                variant="outline"
                className={cn(
                  "color-swatch w-12 h-8 rounded-md border-2 shadow-sm p-0",
                  config.colorPalette === theme 
                    ? "border-primary shadow-md" 
                    : "border-gray-300 hover:border-gray-400"
                )}
                style={{ backgroundColor: color }}
                onClick={() => handleThemeChange(theme)}
                title={theme.charAt(0).toUpperCase() + theme.slice(1)}
                data-testid={`color-theme-${theme}`}
              />
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Custom Colors</Label>
          <div className="grid grid-cols-6 gap-1">
            {config.customColors.map((color, index) => (
              <input
                key={index}
                type="color"
                value={color}
                onChange={(e) => handleCustomColorChange(index, e.target.value)}
                className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                data-testid={`color-custom-${index}`}
              />
            ))}
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}
