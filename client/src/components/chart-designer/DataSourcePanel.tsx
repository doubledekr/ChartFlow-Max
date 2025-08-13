import { Database, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CollapsibleSection } from './CollapsibleSection';
import { useChartDesigner } from '@/hooks/useChartDesigner';
import { useChartData } from '@/hooks/useChartData';

interface DataSourcePanelProps {
  onDataUpdate: () => void;
  onSymbolChange?: (symbol: string) => void;
  onTimeframeChange?: (timeframe: string) => void;
}

export function DataSourcePanel({ onDataUpdate, onSymbolChange, onTimeframeChange }: DataSourcePanelProps) {
  const { config, updateConfig } = useChartDesigner();
  const { loading, refreshData } = useChartData(config.symbol, config.period);

  const handleSymbolChange = (value: string) => {
    const upperValue = value.toUpperCase();
    updateConfig({ symbol: upperValue });
    onSymbolChange?.(upperValue);
  };

  const handlePeriodChange = (value: string) => {
    updateConfig({ period: value });
    onTimeframeChange?.(value);
  };

  const handleLoadData = () => {
    refreshData();
    onDataUpdate();
  };

  return (
    <CollapsibleSection title="Data Source" icon={<Database size={16} />}>
      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="stock-symbol" className="text-sm font-medium text-gray-700">
            Stock Symbol
          </Label>
          <Input
            id="stock-symbol"
            type="text"
            value={config.symbol}
            onChange={(e) => handleSymbolChange(e.target.value)}
            placeholder="AAPL, GOOGL, MSFT..."
            className="text-sm"
            data-testid="input-stock-symbol"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="time-period" className="text-sm font-medium text-gray-700">
            Time Period
          </Label>
          <Select value={config.period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="text-sm" data-testid="select-time-period">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1Y">1 Year</SelectItem>
              <SelectItem value="6M">6 Months</SelectItem>
              <SelectItem value="3M">3 Months</SelectItem>
              <SelectItem value="1M">1 Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          onClick={handleLoadData}
          disabled={loading}
          className="w-full text-sm font-medium"
          data-testid="button-load-data"
        >
          {loading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Load Chart Data
            </>
          )}
        </Button>
      </div>
    </CollapsibleSection>
  );
}
