import { useState } from 'react';
import { Eye, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useChartDesigner } from '@/hooks/useChartDesigner';
import { useChartData } from '@/hooks/useChartData';
import { exportChart, getResolutionDPI, getDefaultDimensions } from '@/utils/chartExport';
import { ExportOptions } from '@/types/chart';
import { cn } from '@/lib/utils';

export function StickyPreviewPanel() {
  const { config, canvas } = useChartDesigner();
  const { data } = useChartData(config.symbol, config.period);
  
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'png',
    resolution: 300,
    width: 1920,
    height: 1080,
    quality: 100,
  });
  
  const [isExporting, setIsExporting] = useState(false);

  const handleFormatChange = (format: 'png' | 'svg' | 'pdf') => {
    const dimensions = getDefaultDimensions(format);
    setExportOptions(prev => ({
      ...prev,
      format,
      ...dimensions
    }));
  };

  const handleResolutionChange = (value: string) => {
    const resolution = getResolutionDPI(value);
    setExportOptions(prev => ({ ...prev, resolution }));
  };

  const handleExport = async () => {
    if (!canvas) {
      console.error('Canvas not available for export');
      return;
    }

    setIsExporting(true);
    try {
      await exportChart(canvas, exportOptions);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Generate mini preview data for the preview chart
  const generatePreviewPath = () => {
    if (!data || !data.data.length) return '';
    
    const points = data.data.slice(0, 20); // Use fewer points for preview
    const width = 260;
    const height = 100;
    const margin = 10;
    
    const xStep = (width - margin * 2) / (points.length - 1);
    const minPrice = Math.min(...points.map(d => d.price));
    const maxPrice = Math.max(...points.map(d => d.price));
    const priceRange = maxPrice - minPrice;
    
    const pathPoints = points.map((point, index) => {
      const x = margin + index * xStep;
      const y = height - margin - ((point.price - minPrice) / priceRange) * (height - margin * 2);
      return `${index === 0 ? 'M' : 'L'} ${x},${y}`;
    });
    
    return pathPoints.join(' ');
  };

  return (
    <div className="sticky top-0 p-4 space-y-4" data-testid="sticky-preview-panel">
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
          <Eye className="mr-2 text-primary" size={16} />
          Preview
        </h3>
        <div 
          className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden"
          style={{ aspectRatio: '4/3' }}
          data-testid="chart-preview"
        >
          <div className="w-full h-full p-3">
            <div 
              className="text-xs font-bold text-gray-900 text-center mb-2"
              style={{
                fontSize: Math.max(8, config.title.size * 0.25),
                fontFamily: config.title.font,
                fontWeight: config.title.weight,
              }}
            >
              {config.title.text}
            </div>
            <svg width="100%" height="120" viewBox="0 0 280 120">
              {/* Grid lines for preview */}
              {config.gridLines.style !== 'none' && (
                <g opacity={config.gridLines.opacity / 100}>
                  <defs>
                    <pattern id="previewGrid" width="40" height="20" patternUnits="userSpaceOnUse">
                      <path 
                        d="M 40 0 L 0 0 0 20" 
                        fill="none" 
                        stroke={config.gridLines.color} 
                        strokeWidth="0.5"
                      />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#previewGrid)" />
                </g>
              )}
              
              {/* Chart line */}
              <path
                d={generatePreviewPath()}
                fill="none"
                stroke="#0066CC"
                strokeWidth={Math.max(1, config.lineThickness * 0.5)}
                strokeDasharray={config.lineStyle === 'dashed' ? '3,2' : 
                                config.lineStyle === 'dotted' ? '1,1' : 'none'}
                strokeLinecap={config.lineCap}
              />
              
              {/* Axes */}
              <line x1="20" y1="20" x2="20" y2="100" stroke="#374151" strokeWidth="1"/>
              <line x1="20" y1="100" x2="260" y2="100" stroke="#374151" strokeWidth="1"/>
            </svg>
          </div>
        </div>
      </div>
      
      {/* Export Options */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 flex items-center">
          <Download className="mr-2 text-primary" size={16} />
          Export Options
        </h3>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Format</Label>
          <div className="flex space-x-2">
            {(['png', 'svg', 'pdf'] as const).map((format) => (
              <Button
                key={format}
                variant="outline"
                className={cn(
                  "flex-1 text-sm font-medium transition-colors",
                  exportOptions.format === format
                    ? "bg-primary text-white hover:bg-primary/90"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                )}
                onClick={() => handleFormatChange(format)}
                data-testid={`export-format-${format}`}
              >
                {format.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Resolution</Label>
          <Select 
            value={`${exportOptions.resolution === 300 ? 'High Quality (300 DPI)' : 
                     exportOptions.resolution === 150 ? 'Standard (150 DPI)' : 
                     'Web (72 DPI)'}`}
            onValueChange={handleResolutionChange}
          >
            <SelectTrigger className="text-sm" data-testid="select-resolution">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="High Quality (300 DPI)">High Quality (300 DPI)</SelectItem>
              <SelectItem value="Standard (150 DPI)">Standard (150 DPI)</SelectItem>
              <SelectItem value="Web (72 DPI)">Web (72 DPI)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Dimensions</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              value={exportOptions.width}
              onChange={(e) => setExportOptions(prev => ({ 
                ...prev, 
                width: parseInt(e.target.value) || 1920 
              }))}
              placeholder="Width"
              className="text-sm"
              data-testid="input-export-width"
            />
            <Input
              type="number"
              value={exportOptions.height}
              onChange={(e) => setExportOptions(prev => ({ 
                ...prev, 
                height: parseInt(e.target.value) || 1080 
              }))}
              placeholder="Height"
              className="text-sm"
              data-testid="input-export-height"
            />
          </div>
        </div>
        
        <Button
          onClick={handleExport}
          disabled={isExporting || !canvas}
          className="w-full font-medium transition-colors"
          data-testid="button-export-chart"
        >
          {isExporting ? (
            <>
              <Download className="mr-2 h-4 w-4 animate-pulse" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export Chart
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
