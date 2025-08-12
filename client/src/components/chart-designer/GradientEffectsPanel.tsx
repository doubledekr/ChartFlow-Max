import { Paintbrush } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { CollapsibleSection } from './CollapsibleSection';
import { useChartDesigner } from '@/hooks/useChartDesigner';
import { cn } from '@/lib/utils';

const GRADIENTS = [
  { name: 'financial', label: 'Financial' },
  { name: 'growth', label: 'Growth' },
  { name: 'sunset', label: 'Sunset' },
  { name: 'ocean', label: 'Ocean' },
  { name: 'purple', label: 'Purple' },
  { name: 'emerald', label: 'Emerald' },
];

export function GradientEffectsPanel() {
  const { config, updateConfig } = useChartDesigner();

  const handleGradientChange = (gradient: string) => {
    updateConfig({ gradient });
  };

  const handleIntensityChange = (value: number[]) => {
    updateConfig({ gradientIntensity: value[0] });
  };

  return (
    <CollapsibleSection title="Gradient Effects" icon={<Paintbrush size={16} />}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {GRADIENTS.map((gradient) => (
            <Button
              key={gradient.name}
              variant="outline"
              className={cn(
                `gradient-${gradient.name} h-12 rounded-md border shadow-sm flex items-center justify-center text-white text-xs font-medium`,
                config.gradient === gradient.name 
                  ? "border-primary border-2 shadow-md" 
                  : "border-gray-300 hover:border-gray-400"
              )}
              onClick={() => handleGradientChange(gradient.name)}
              data-testid={`gradient-${gradient.name}`}
            >
              {gradient.label}
            </Button>
          ))}
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Gradient Intensity</Label>
          <div className="space-y-2">
            <Slider
              value={[config.gradientIntensity]}
              onValueChange={handleIntensityChange}
              max={100}
              min={0}
              step={1}
              className="w-full"
              data-testid="slider-gradient-intensity"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Subtle</span>
              <span className="font-medium">{config.gradientIntensity}%</span>
              <span>Intense</span>
            </div>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}
