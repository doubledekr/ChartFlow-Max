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
  onElementSelect?: (element: any, properties: any) => void;
}

export function FinancialChartCanvas({ 
  width = 800, 
  height = 450, 
  onElementSelect 
}: FinancialChartCanvasProps) {
  
  // Expose update function to parent component
  const updateChartLinePropertiesRef = useRef<(property: string, value: any) => void>();
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
    if (!fabricCanvasRef.current || !pathData || data.length === 0) return;

    // Convert SVG path to Fabric.js Path object
    const fabricPath = new (window as any).fabric.Path(pathData, {
      fill: '',
      stroke: lineProperties.color,
      strokeWidth: lineProperties.strokeWidth,
      opacity: lineProperties.opacity,
      left: 0,
      top: 0,
      selectable: false, // Will be part of group
      hasControls: false,
      hasBorders: false,
    });

    // Create axis labels that follow the chart data
    const firstPrice = data[0]?.close || 0;
    const lastPrice = data[data.length - 1]?.close || 0;
    const highPrice = Math.max(...data.map(d => d.high));
    const lowPrice = Math.min(...data.map(d => d.low));

    // Y-axis price labels (left side)
    const yAxisLabels = [
      { price: highPrice, y: margin.top + 20 },
      { price: (highPrice + lowPrice) / 2, y: margin.top + height / 2 },
      { price: lowPrice, y: height - margin.bottom - 20 }
    ].map(({ price, y }) => new (window as any).fabric.Text(`$${price.toFixed(2)}`, {
      left: 10,
      top: y,
      fontSize: 12,
      fill: '#6b7280',
      fontFamily: 'Inter, sans-serif',
      selectable: false,
      hasControls: false,
      hasBorders: false,
      editable: true,
      type: 'axis-label'
    }));

    // X-axis date labels (bottom)
    const startDate = new Date(data[0]?.timestamp || Date.now());
    const endDate = new Date(data[data.length - 1]?.timestamp || Date.now());
    const midDate = new Date((startDate.getTime() + endDate.getTime()) / 2);

    const xAxisLabels = [
      { date: startDate, x: margin.left + 20 },
      { date: midDate, x: margin.left + width / 2 },
      { date: endDate, x: width - margin.right - 80 }
    ].map(({ date, x }) => new (window as any).fabric.Text(date.toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    }), {
      left: x,
      top: height - margin.bottom + 20,
      fontSize: 12,
      fill: '#6b7280',
      fontFamily: 'Inter, sans-serif',
      selectable: false,
      hasControls: false,
      hasBorders: false,
      editable: true,
      type: 'axis-label'
    }));

    // Current price indicator
    const currentPriceLabel = new (window as any).fabric.Text(`${symbol}: $${lastPrice.toFixed(2)}`, {
      left: margin.left + 20,
      top: margin.top - 30,
      fontSize: 16,
      fill: lineProperties.color,
      fontFamily: 'Inter, sans-serif',
      fontWeight: 'bold',
      selectable: false,
      hasControls: false,
      hasBorders: false,
      editable: true,
      type: 'price-indicator'
    });

    // Create a group with the chart line and all axis labels
    const chartGroup = new (window as any).fabric.Group(
      [fabricPath, currentPriceLabel, ...yAxisLabels, ...xAxisLabels], 
      {
        left: margin.left,
        top: margin.top,
        selectable: true,
        hasControls: true,
        hasBorders: true,
        cornerColor: '#3b82f6',
        cornerStyle: 'circle',
        transparentCorners: false,
        cornerSize: 8,
        lockScalingX: false,
        lockScalingY: false,
      }
    );

    // Add custom properties for financial chart group
    chartGroup.type = 'financial-chart-group';
    chartGroup.symbol = symbol;
    chartGroup.timeframe = timeframe;

    // Add event listeners for selection
    chartGroup.on('selected', () => {
      setSelectedChartLine(chartGroup);
      console.log('Chart group selected');
      
      // Notify parent component about selection
      if (onElementSelect) {
        onElementSelect(chartGroup, {
          type: 'financial-chart-group',
          symbol,
          timeframe,
          properties: lineProperties,
          updateFunction: updateChartLineProperties
        });
      }
    });

    chartGroup.on('deselected', () => {
      setSelectedChartLine(null);
      
      // Notify parent component about deselection
      if (onElementSelect) {
        onElementSelect(null, null);
      }
    });

    // Enable text editing on double-click for axis labels
    chartGroup.on('mousedblclick', (e: any) => {
      const target = e.subTargets?.[0];
      if (target && (target.type === 'axis-label' || target.type === 'price-indicator')) {
        target.enterEditing();
        target.selectAll();
      }
    });

    // Add to canvas
    fabricCanvasRef.current.add(chartGroup);
    fabricCanvasRef.current.renderAll();

    // Auto-select the chart group
    fabricCanvasRef.current.setActiveObject(chartGroup);
    setSelectedChartLine(chartGroup);
  };

  const updateChartLineProperties = (property: string, value: any) => {
    if (!selectedChartLine) return;

    const newProperties = { ...lineProperties, [property]: value };
    setLineProperties(newProperties);

    // Update the chart line within the group
    if (selectedChartLine.type === 'financial-chart-group') {
      const objects = selectedChartLine.getObjects();
      const chartPath = objects.find((obj: any) => obj.type === 'path');
      const priceIndicator = objects.find((obj: any) => obj.type === 'price-indicator');

      switch (property) {
        case 'strokeWidth':
          if (chartPath) chartPath.set('strokeWidth', value);
          break;
        case 'opacity':
          if (chartPath) chartPath.set('opacity', value);
          break;
        case 'color':
          if (chartPath) chartPath.set('stroke', value);
          if (priceIndicator) priceIndicator.set('fill', value);
          break;
        case 'smoothness':
          console.log('Smoothness changed to:', value);
          // In a full implementation, regenerate the path with different curve interpolation
          break;
      }
    } else {
      // Fallback for direct line objects
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
      }
    }

    fabricCanvasRef.current?.renderAll();
  };

  const duplicateChartLine = () => {
    if (!selectedChartLine) return;

    selectedChartLine.clone((cloned: any) => {
      cloned.set({
        left: cloned.left + 20,
        top: cloned.top + 20,
      });
      
      // Update colors for the duplicate
      if (cloned.type === 'financial-chart-group') {
        const objects = cloned.getObjects();
        const chartPath = objects.find((obj: any) => obj.type === 'path');
        const priceIndicator = objects.find((obj: any) => obj.type === 'price-indicator');
        
        if (chartPath) chartPath.set('stroke', '#f59e0b');
        if (priceIndicator) {
          priceIndicator.set('fill', '#f59e0b');
          priceIndicator.set('text', `${symbol} (Copy): $${(data[data.length - 1]?.close || 0).toFixed(2)}`);
        }
      } else {
        cloned.set('stroke', '#f59e0b');
      }
      
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