import { useState, useEffect } from 'react';
import { ChartData } from '../types/chart';
import { generateSampleData } from '../utils/stockData';

export function useChartData(symbol: string, period: string) {
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!symbol) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // In a real application, this would fetch from a financial API
        // For now, we'll generate sample data based on the symbol
        const chartData = await generateSampleData(symbol, period);
        setData(chartData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load chart data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [symbol, period]);

  const refreshData = () => {
    if (symbol) {
      const loadData = async () => {
        setLoading(true);
        setError(null);
        
        try {
          const chartData = await generateSampleData(symbol, period);
          setData(chartData);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load chart data');
        } finally {
          setLoading(false);
        }
      };
      
      loadData();
    }
  };

  return { data, loading, error, refreshData };
}
