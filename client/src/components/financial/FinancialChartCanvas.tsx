import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
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
  const [selectedChartLine, setSelectedChartLine] = useState<any>(null);
  const [lineProperties, setLineProperties] = useState({
    strokeWidth: 3,
    opacity: 1,
    smoothness: 0.5, // 0 = linear, 1 = very curved
    color: '#3b82f6'
  });

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

    // Create chart path as SVG path string
    const line = d3.line<ChartDataPoint>()
      .x(d => xScale(new Date(d.timestamp)))
      .y(d => yScale(d.close))
      .curve(d3.curveMonotoneX);

    const pathData = line(data) || '';
    
    // Add chart path to background SVG for reference
    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#e5e7eb')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      .attr('d', line)
      .attr('opacity', 0.5);

    // Create draggable chart line in Fabric canvas after a small delay to ensure canvas is ready
    setTimeout(() => {
      createDraggableChartLine(pathData, margin);
    }, 100);

    // Add dots for data points
    g.selectAll('.dot')
      .data(data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 50)) === 0))
      .enter().append('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(new Date(d.timestamp)))
      .attr('cy', d => yScale(d.close))
      .attr('r', 2)
      .attr('fill', '#9ca3af')
      .attr('opacity', 0.7);
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

  const createDraggableChartLine = (pathData: string, margin: any) => {
    if (!fabricCanvasRef.current || !pathData) return;

    // Convert SVG path to Fabric.js Path object
    const fabricPath = new (window as any).fabric.Path(pathData, {
      fill: '',
      stroke: lineProperties.color,
      strokeWidth: lineProperties.strokeWidth,
      opacity: lineProperties.opacity,
      left: margin.left,
      top: margin.top,
      selectable: true,
      hasControls: true,
      hasBorders: true,
      lockScalingX: false,
      lockScalingY: false,
      cornerColor: '#3b82f6',
      cornerStyle: 'circle',
      transparentCorners: false,
      cornerSize: 8,
    });

    // Add custom properties for financial chart line
    fabricPath.type = 'financial-chart-line';
    fabricPath.symbol = symbol;
    fabricPath.timeframe = timeframe;

    // Add event listeners for selection
    fabricPath.on('selected', () => {
      setSelectedChartLine(fabricPath);
      console.log('Chart line selected');
    });

    fabricPath.on('deselected', () => {
      setSelectedChartLine(null);
    });

    // Add to canvas
    fabricCanvasRef.current.add(fabricPath);
    fabricCanvasRef.current.renderAll();

    // Auto-select the chart line
    fabricCanvasRef.current.setActiveObject(fabricPath);
    setSelectedChartLine(fabricPath);
  };

  const updateChartLineProperties = (property: string, value: any) => {
    if (!selectedChartLine) return;

    const newProperties = { ...lineProperties, [property]: value };
    setLineProperties(newProperties);

    // Update the selected line immediately
    switch (property) {
      case 'strokeWidth':
        selectedChartLine.set('strokeWidth', value);
        break;
      case 'opacity':
        selectedChartLine.set('opacity', value);
        break;
      case 'color':
        selectedChartLine.set('stroke', value);
        break;
      case 'smoothness':
        // For smoothness, we would need to regenerate the path with different curve types
        // This is a simplified version - in a full implementation, you'd regenerate the path
        console.log('Smoothness changed to:', value);
        break;
    }

    fabricCanvasRef.current?.renderAll();
  };

  const duplicateChartLine = () => {
    if (!selectedChartLine) return;

    selectedChartLine.clone((cloned: any) => {
      cloned.set({
        left: cloned.left + 20,
        top: cloned.top + 20,
        stroke: '#f59e0b', // Different color for duplicate
      });
      fabricCanvasRef.current?.add(cloned);
      fabricCanvasRef.current?.setActiveObject(cloned);
      setSelectedChartLine(cloned);
    });
  };

  const deleteChartLine = () => {
    if (!selectedChartLine) return;
    
    fabricCanvasRef.current?.remove(selectedChartLine);
    setSelectedChartLine(null);
    fabricCanvasRef.current?.renderAll();
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

          <Button onClick={duplicateChartLine} variant="outline" size="sm" disabled={!selectedChartLine}>
            Duplicate Line
          </Button>

          <Button onClick={deleteChartLine} variant="outline" size="sm" disabled={!selectedChartLine}>
            Delete Line
          </Button>
        </div>
      </Card>

      {/* Chart Line Properties Panel */}
      {selectedChartLine && (
        <Card className="mb-4">
          <div className="p-4">
            <h3 className="text-sm font-medium mb-4">Chart Line Properties</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-xs">Line Thickness: {lineProperties.strokeWidth}px</Label>
                <Slider
                  value={[lineProperties.strokeWidth]}
                  onValueChange={([value]) => updateChartLineProperties('strokeWidth', value)}
                  min={1}
                  max={20}
                  step={1}
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label className="text-xs">Opacity: {Math.round(lineProperties.opacity * 100)}%</Label>
                <Slider
                  value={[lineProperties.opacity]}
                  onValueChange={([value]) => updateChartLineProperties('opacity', value)}
                  min={0.1}
                  max={1}
                  step={0.1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="text-xs">Smoothness: {Math.round(lineProperties.smoothness * 100)}%</Label>
                <Slider
                  value={[lineProperties.smoothness]}
                  onValueChange={([value]) => updateChartLineProperties('smoothness', value)}
                  min={0}
                  max={1}
                  step={0.1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="text-xs">Line Color</Label>
                <div className="flex gap-2 mt-2">
                  {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'].map(color => (
                    <button
                      key={color}
                      className={`w-6 h-6 rounded border-2 ${lineProperties.color === color ? 'border-gray-800' : 'border-gray-300'}`}
                      style={{ backgroundColor: color }}
                      onClick={() => updateChartLineProperties('color', color)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

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