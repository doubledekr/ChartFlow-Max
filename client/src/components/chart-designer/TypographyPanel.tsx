import { useState } from 'react';
import { Type, Upload, Filter, Search } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { CollapsibleSection } from './CollapsibleSection';
import { FontUploader } from './FontUploader';
import { useChartDesigner } from '@/hooks/useChartDesigner';
import { GOOGLE_FONTS, SYSTEM_FONTS, FONT_CATEGORIES, generateGoogleFontsURL, getFontFamilyCSS } from '@shared/fonts';
import { useQuery } from '@tanstack/react-query';

// Load Google Fonts dynamically
const loadGoogleFonts = () => {
  const fontUrl = generateGoogleFontsURL(GOOGLE_FONTS);
  if (fontUrl && !document.querySelector(`link[href="${fontUrl}"]`)) {
    const link = document.createElement('link');
    link.href = fontUrl;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
};

// Load Google Fonts on component mount
loadGoogleFonts();

const FONT_WEIGHTS = [
  { value: '400', label: 'Regular (400)' },
  { value: '500', label: 'Medium (500)' },
  { value: '600', label: 'Semi-bold (600)' },
  { value: '700', label: 'Bold (700)' },
  { value: '800', label: 'Extra-bold (800)' },
];

export function TypographyPanel() {
  const { config, updateTitle, updateSubtitle, updateAxisLabels } = useChartDesigner();
  const [fontSearch, setFontSearch] = useState('');
  const [fontCategory, setFontCategory] = useState('all');
  const [showUploader, setShowUploader] = useState(false);

  // Fetch custom fonts
  const { data: customFonts = [] } = useQuery({
    queryKey: ['/api/fonts'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Combine all available fonts  
  const allAvailableFonts = [...GOOGLE_FONTS, ...SYSTEM_FONTS, ...(Array.isArray(customFonts) ? customFonts : [])];

  // Filter fonts based on search and category
  const filteredFonts = allAvailableFonts.filter(font => {
    const matchesSearch = fontSearch === '' || 
      font.family.toLowerCase().includes(fontSearch.toLowerCase()) ||
      font.display?.toLowerCase().includes(fontSearch.toLowerCase());
    
    const matchesCategory = fontCategory === 'all' || font.category === fontCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleFontUploaded = (font: { family: string; name: string; url: string }) => {
    // Dynamically load the uploaded font
    const fontFace = new FontFace(font.family, `url(${font.url})`);
    fontFace.load().then(() => {
      document.fonts.add(fontFace);
    }).catch(err => console.warn('Failed to load custom font:', err));
  };

  return (
    <CollapsibleSection title="Typography" icon={<Type size={16} />}>
      <div className="space-y-4">
        {/* Font Library Controls */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">Font Library</h4>
            <Dialog open={showUploader} onOpenChange={setShowUploader}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Upload size={14} className="mr-1" />
                  Upload Font
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <FontUploader 
                  onFontUploaded={handleFontUploaded}
                  onClose={() => setShowUploader(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Search and Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search fonts..."
                value={fontSearch}
                onChange={(e) => setFontSearch(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
            
            <Select value={fontCategory} onValueChange={setFontCategory}>
              <SelectTrigger className="text-sm">
                <Filter size={14} className="mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FONT_CATEGORIES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

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
              <SelectContent className="max-h-60 overflow-y-auto">
                {filteredFonts.map((font) => (
                  <SelectItem 
                    key={font.family} 
                    value={font.family}
                    style={{ fontFamily: getFontFamilyCSS(font) }}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{font.display || font.family}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {font.category}
                      </span>
                    </div>
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
              <SelectContent className="max-h-60 overflow-y-auto">
                {filteredFonts.map((font) => (
                  <SelectItem 
                    key={font.family} 
                    value={font.family}
                    style={{ fontFamily: getFontFamilyCSS(font) }}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{font.display || font.family}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {font.category}
                      </span>
                    </div>
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
              <SelectContent className="max-h-60 overflow-y-auto">
                {filteredFonts.map((font) => (
                  <SelectItem 
                    key={font.family} 
                    value={font.family}
                    style={{ fontFamily: getFontFamilyCSS(font) }}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{font.display || font.family}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {font.category}
                      </span>
                    </div>
                  </SelectItem>
                ))}
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
