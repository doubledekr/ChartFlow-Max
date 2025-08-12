import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { PolygonClient, type ChartDataPoint } from '@/services/polygonService';
import * as d3 from 'd3';

interface FinancialChartCanvasProps {
  width?: number;
  height?: number;
}

export function FinancialChartCanvas({ width = 800, height = 450 }: FinancialChartCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<any>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [symbol, setSymbol] = useState('AAPL');
  const [timeframe, setTimeframe] = useState('1Y');
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Fabric canvas for interactive elements
    const canvas = new (window as any).fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: 'rgba(248, 248, 248, 0.8)',
      selection: false,
    });

    fabricCanvasRef.current = canvas;

    // Add some default interactive elements
    const title = new (window as any).fabric.Text('Financial Chart', {
      left: 50,
      top: 30,
      fontFamily: 'Inter, sans-serif',
      fontSize: 24,
      fontWeight: 'bold',
      fill: '#1f2937',
      selectable: true,
      hasControls: true,
      hasBorders: true,
    });

    const subtitle = new (window as any).fabric.Text('Drag elements to customize', {
      left: 50,
      top: 60,
      fontFamily: 'Inter, sans-serif',
      fontSize: 14,
      fill: '#6b7280',
      selectable: true,
    });

    canvas.add(title, subtitle);

    // Set cursor states
    canvas.on('mouse:over', function(e: any) {
      if (e.target) {
        document.body.style.cursor = 'move';
      }
    });

    canvas.on('mouse:out', function() {
      document.body.style.cursor = 'default';
    });

    return () => {
      canvas.dispose();
    };
  }, [width, height]);

  useEffect(() => {
    if (data.length > 0) {
      renderChart();
    }
  }, [data]);

  const loadStockData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const chartData = await PolygonClient.getStockData(symbol, timeframe);
      setData(chartData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stock data');
      console.error('Error loading stock data:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderChart = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    if (data.length === 0) return;

    const margin = { top: 100, right: 80, bottom: 60, left: 80 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => new Date(d.timestamp)) as [Date, Date])
      .range([0, chartWidth]);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.high) as [number, number])
      .range([chartHeight, 0]);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Add axes
    g.append('g')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%b %Y') as any));

    g.append('g')
      .call(d3.axisLeft(yScale).tickFormat(d3.format('$.2f')));

    // Add price line
    const line = d3.line<ChartDataPoint>()
      .x(d => xScale(new Date(d.timestamp)))
      .y(d => yScale(d.close))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Add dots for data points
    g.selectAll('.dot')
      .data(data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 50)) === 0))
      .enter().append('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(new Date(d.timestamp)))
      .attr('cy', d => yScale(d.close))
      .attr('r', 3)
      .attr('fill', '#3b82f6');
  };

  const addAnnotation = () => {
    if (!fabricCanvasRef.current) return;

    const annotation = new (window as any).fabric.Text('Price Target: $XXX', {
      left: 200 + Math.random() * 200,
      top: 150 + Math.random() * 100,
      fontFamily: 'Inter, sans-serif',
      fontSize: 12,
      fill: '#dc2626',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      padding: 4,
      selectable: true,
      hasControls: true,
      hasBorders: true,
    });

    fabricCanvasRef.current.add(annotation);
    fabricCanvasRef.current.renderAll();
  };

  const addTrendLine = () => {
    if (!fabricCanvasRef.current) return;

    const line = new (window as any).fabric.Line([150, 200, 350, 150], {
      stroke: '#f59e0b',
      strokeWidth: 3,
      selectable: true,
      hasControls: true,
      hasBorders: true,
    });

    fabricCanvasRef.current.add(line);
    fabricCanvasRef.current.renderAll();
  };

  return (
    <div className="relative w-full">
      {/* Controls */}
      <Card className="mb-4 p-4">
        <div className="flex gap-4 items-center flex-wrap">
          <div className="flex gap-2 items-center">
            <label className="text-sm font-medium">Symbol:</label>
            <Input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              className="w-20"
              placeholder="AAPL"
            />
          </div>
          
          <div className="flex gap-2 items-center">
            <label className="text-sm font-medium">Timeframe:</label>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1D">1D</SelectItem>
                <SelectItem value="1W">1W</SelectItem>
                <SelectItem value="1M">1M</SelectItem>
                <SelectItem value="3M">3M</SelectItem>
                <SelectItem value="6M">6M</SelectItem>
                <SelectItem value="1Y">1Y</SelectItem>
                <SelectItem value="2Y">2Y</SelectItem>
                <SelectItem value="5Y">5Y</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={loadStockData} disabled={loading} data-testid="button-load-data">
            {loading ? 'Loading...' : 'Load Data'}
          </Button>

          <Button onClick={addAnnotation} variant="outline" size="sm" data-testid="button-add-annotation">
            Add Annotation
          </Button>

          <Button onClick={addTrendLine} variant="outline" size="sm" data-testid="button-add-trendline">
            Add Trend Line
          </Button>
        </div>
      </Card>

      {error && (
        <Card className="mb-4 p-4 border-red-200 bg-red-50">
          <p className="text-red-600 text-sm">{error}</p>
        </Card>
      )}

      {/* Chart Container */}
      <div className="relative border border-gray-200 rounded-lg overflow-hidden bg-white">
        {/* D3 Chart Layer (Background) */}
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="absolute top-0 left-0 pointer-events-none"
        />
        
        {/* Fabric Canvas Layer (Interactive Elements) */}
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 cursor-default"
          data-testid="financial-chart-canvas"
        />

        {/* Data Info Overlay */}
        {data.length > 0 && (
          <div className="absolute top-4 right-4 bg-white/90 p-2 rounded shadow text-xs">
            <div><strong>{symbol}</strong> • {timeframe}</div>
            <div>{data.length} data points</div>
            <div>Latest: ${data[data.length - 1]?.close.toFixed(2)}</div>
          </div>
        )}
      </div>
    </div>
  );
}