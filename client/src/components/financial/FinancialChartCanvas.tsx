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
  width = 900, 
  height = 500, 
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

    const margin = { top: 120, right: 40, bottom: 80, left: 80 }; // Moved up slightly with balanced spacing
    const chartWidth = Math.min(width - margin.left - margin.right, 680); // Adjusted for proper label spacing
    const chartHeight = Math.min(height - margin.top - margin.bottom, 280); // Same height

    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => new Date(d.timestamp)) as [Date, Date])
      .range([0, chartWidth]);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.high) as [number, number])
      .range([chartHeight, 0]);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // No D3 background elements - only Fabric.js vectors

    // Create smoothed data based on smoothness parameter (reduce points for smoother lines)
    const smoothingFactor = Math.max(1, Math.floor((1 - lineProperties.smoothness) * 10) + 1);
    const smoothedData = data.filter((_, index) => index % smoothingFactor === 0);
    
    // Add the last point to ensure we complete the chart
    if (smoothedData[smoothedData.length - 1] !== data[data.length - 1]) {
      smoothedData.push(data[data.length - 1]);
    }

    // Create chart path with smoothed data points
    const line = d3.line<ChartDataPoint>()
      .x(d => xScale(new Date(d.timestamp)))
      .y(d => yScale(d.close))
      .curve(d3.curveCatmullRom.alpha(0.5));

    const pathData = line(smoothedData) || '';

    // Create draggable chart group with axis text conversion
    setTimeout(() => {
      createDraggableChartGroup(pathData, margin, xScale, yScale, chartWidth, chartHeight);
    }, 100);

    // No background dots - clean vector-only interface
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

  const createDraggableChartGroup = (
    pathData: string, 
    margin: any, 
    xScale: any, 
    yScale: any, 
    chartWidth: number, 
    chartHeight: number
  ) => {
    if (!fabricCanvasRef.current || !pathData || data.length === 0) return;

    // Convert SVG path to Fabric.js Path object with proper styling
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
      strokeLineCap: 'round',
      strokeLineJoin: 'round'
    });

    // Convert D3 axis data to Fabric.js text objects
    const yTicks = yScale.ticks(6);
    const xTicks = xScale.ticks(5);

    // Y-axis price labels (left side) - converted from D3 axis
    const yAxisLabels = yTicks.map((price: number, index: number) => new (window as any).fabric.Text(
      `$${price.toFixed(2)}`, 
      {
        left: 15,
        top: yScale(price) - 6,
        fontSize: 12,
        fill: '#6b7280',
        fontFamily: 'Inter, sans-serif',
        selectable: false,
        hasControls: false,
        hasBorders: false,
        editable: true,
        type: 'y-axis-label',
        originalValue: price
      }
    ));

    // X-axis date labels (bottom) - converted from D3 axis
    const xAxisLabels = xTicks.map((date: Date, index: number) => new (window as any).fabric.Text(
      date.toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric' 
      }), 
      {
        left: xScale(date) - 20,
        top: chartHeight + 25,
        fontSize: 12,
        fill: '#6b7280',
        fontFamily: 'Inter, sans-serif',
        selectable: false,
        hasControls: false,
        hasBorders: false,
        editable: true,
        type: 'x-axis-label',
        originalValue: date
      }
    ));

    // Create axis lines as Fabric.js vectors
    const yAxisLine = new (window as any).fabric.Line([0, 0, 0, chartHeight], {
      stroke: '#d1d5db',
      strokeWidth: 1,
      selectable: false,
      evented: false,
      type: 'axis-line'
    });

    const xAxisLine = new (window as any).fabric.Line([0, chartHeight, chartWidth, chartHeight], {
      stroke: '#d1d5db',
      strokeWidth: 1,
      selectable: false,
      evented: false,
      type: 'axis-line'
    });

    // Chart title without current price
    // Remove chart title - user doesn't want ticker/duration text
    // const chartTitleLabel = new (window as any).fabric.Text(
    //   `${symbol} - ${timeframe}`, 
    //   {
    //     left: 20,
    //     top: -30,
    //     fontSize: 16,
    //     fill: lineProperties.color,
    //     fontFamily: 'Inter, sans-serif',
    //     fontWeight: 'bold',
    //     selectable: false,
    //     hasControls: false,
    //     hasBorders: false,
    //     editable: true,
    //     type: 'chart-title'
    //   }
    // );

    // Add axis elements as separate selectable objects
    yAxisLine.set({
      left: margin.left,
      top: margin.top,
      selectable: true,
      hasControls: true,
      hasBorders: true,
      type: 'y-axis-line'
    });

    xAxisLine.set({
      left: margin.left,
      top: margin.top + chartHeight,
      selectable: true,
      hasControls: true,
      hasBorders: true,
      type: 'x-axis-line'
    });

    // Create axis text groups for unified editing
    const yAxisGroup = new (window as any).fabric.Group(yAxisLabels, {
      left: margin.left - 50,
      top: margin.top,
      selectable: true,
      hasControls: true,
      hasBorders: true,
      type: 'y-axis-labels'
    });

    const xAxisGroup = new (window as any).fabric.Group(xAxisLabels, {
      left: margin.left,
      top: margin.top + chartHeight + 25,
      selectable: true,
      hasControls: true,
      hasBorders: true,
      type: 'x-axis-labels'
    });

    // Add elements separately for independent selection and editing
    
    // Calculate true center position accounting for all elements
    const canvasCenter = width / 2;
    const totalChartWidth = chartWidth + 60; // Chart + Y-axis label space  
    const chartStartX = canvasCenter - (totalChartWidth / 2) + 60; // True center with Y-axis space
    
    // Position axis lines centered horizontally with optimal spacing
    yAxisLine.set({
      left: chartStartX,   // Centered position with Y-axis label clearance
      top: 120,            // Moved up slightly for better balance
      selectable: true,
      hasControls: true,
      hasBorders: true,
      type: 'y-axis-line'
    });

    xAxisLine.set({
      left: chartStartX,   // Match Y-axis positioning
      top: 120 + chartHeight,  // Below chart area with balanced positioning
      selectable: true,
      hasControls: true,
      hasBorders: true,
      type: 'x-axis-line'
    });

    // Position axis text groups with optimal vertical placement
    yAxisGroup.set({
      left: chartStartX - 60,  // Y-axis labels positioned left of the centered chart
      top: 120,                // Moved up to match chart positioning
      selectable: true,
      hasControls: true,
      hasBorders: true,
      type: 'y-axis-labels'
    });

    xAxisGroup.set({
      left: chartStartX,       // Match axis positioning
      top: 120 + chartHeight + 25,  // Below axis line with proper clearance
      selectable: true,
      hasControls: true,
      hasBorders: true,
      type: 'x-axis-labels'
    });

    // Create draggable chart line with optimal positioning
    const chartLine = new (window as any).fabric.Group([fabricPath], {
      left: chartStartX,   // Centered positioning
      top: 120,            // Balanced positioning on canvas
      selectable: true,
      hasControls: true,
      hasBorders: true,
      cornerColor: '#3b82f6',
      cornerStyle: 'circle',
      transparentCorners: false,
      cornerSize: 8,
      lockScalingX: false,
      lockScalingY: false,
      type: 'financial-chart-line',
      symbol,
      timeframe,
      properties: lineProperties
    });

    // Add all elements to canvas for independent selection
    fabricCanvasRef.current.add(yAxisLine);
    fabricCanvasRef.current.add(xAxisLine);
    fabricCanvasRef.current.add(yAxisGroup);
    fabricCanvasRef.current.add(xAxisGroup);
    fabricCanvasRef.current.add(chartLine);

    // Set up event handlers for chart line selection
    chartLine.on('selected', () => {
      console.log('Chart line selected');
      setSelectedChartLine(chartLine);
      
      if (onElementSelect) {
        onElementSelect(chartLine, {
          type: 'financial-chart-line',
          symbol,
          timeframe,
          properties: lineProperties,
          updateFunction: updateChartLineProperties,
          duplicateFunction: duplicateChartLine,
          deleteFunction: deleteChartLine
        });
      }
    });

    // Set up event handlers for axis text groups with relative positioning
    yAxisGroup.on('selected', () => {
      if (onElementSelect) {
        onElementSelect(yAxisGroup, {
          type: 'y-axis-labels',
          updateFunction: (property: string, value: any) => {
            const objects = yAxisGroup.getObjects();
            objects.forEach((obj: any) => {
              if (property === 'fontSize') obj.set('fontSize', value);
              if (property === 'fill') obj.set('fill', value);
              if (property === 'fontFamily') obj.set('fontFamily', value);
              if (property === 'fontWeight') obj.set('fontWeight', value);
            });
            yAxisGroup.addWithUpdate();
            fabricCanvasRef.current?.renderAll();
            console.log(`Updated ${property} to ${value} for element:`, 'y-axis-labels');
          }
        });
      }
    });

    xAxisGroup.on('selected', () => {
      if (onElementSelect) {
        onElementSelect(xAxisGroup, {
          type: 'x-axis-labels',
          updateFunction: (property: string, value: any) => {
            const objects = xAxisGroup.getObjects();
            objects.forEach((obj: any) => {
              if (property === 'fontSize') obj.set('fontSize', value);
              if (property === 'fill') obj.set('fill', value);
              if (property === 'fontFamily') obj.set('fontFamily', value);
              if (property === 'fontWeight') obj.set('fontWeight', value);
            });
            xAxisGroup.addWithUpdate();
            fabricCanvasRef.current?.renderAll();
            console.log(`Updated ${property} to ${value} for element:`, 'x-axis-labels');
          }
        });
      }
    });

    // Set up event handlers for axis lines
    yAxisLine.on('selected', () => {
      if (onElementSelect) {
        onElementSelect(yAxisLine, {
          type: 'y-axis-line',
          properties: { strokeWidth: 1, stroke: '#666', opacity: 1, visible: true },
          updateFunction: (property: string, value: any) => {
            if (property === 'strokeWidth') yAxisLine.set('strokeWidth', value);
            if (property === 'stroke') yAxisLine.set('stroke', value);
            if (property === 'opacity') yAxisLine.set('opacity', value);
            if (property === 'visible') yAxisLine.set('visible', value);
            fabricCanvasRef.current?.renderAll();
            console.log(`Updated ${property} to ${value} for element:`, 'y-axis-line');
          }
        });
      }
    });

    xAxisLine.on('selected', () => {
      if (onElementSelect) {
        onElementSelect(xAxisLine, {
          type: 'x-axis-line',
          properties: { strokeWidth: 1, stroke: '#666', opacity: 1, visible: true },
          updateFunction: (property: string, value: any) => {
            if (property === 'strokeWidth') xAxisLine.set('strokeWidth', value);
            if (property === 'stroke') xAxisLine.set('stroke', value);
            if (property === 'opacity') xAxisLine.set('opacity', value);
            if (property === 'visible') xAxisLine.set('visible', value);
            fabricCanvasRef.current?.renderAll();
            console.log(`Updated ${property} to ${value} for element:`, 'x-axis-line');
          }
        });
      }
    });

    // Set up deselection handler
    const handleDeselection = () => {
      setSelectedChartLine(null);
      if (onElementSelect) {
        onElementSelect(null, null);
      }
    };

    chartLine.on('deselected', handleDeselection);
    yAxisGroup.on('deselected', handleDeselection);
    xAxisGroup.on('deselected', handleDeselection);
    yAxisLine.on('deselected', handleDeselection);
    xAxisLine.on('deselected', handleDeselection);

    fabricCanvasRef.current.renderAll();

    // Auto-select the chart line
    fabricCanvasRef.current.setActiveObject(chartLine);
    setSelectedChartLine(chartLine);
  };

  const updateChartLineProperties = (property: string, value: any) => {
    if (!selectedChartLine) return;

    const newProperties = { ...lineProperties, [property]: value };
    setLineProperties(newProperties);

    // Update the chart line properties for separate elements
    if (selectedChartLine.type === 'financial-chart-line') {
      const objects = selectedChartLine.getObjects();
      const chartPath = objects.find((obj: any) => obj.type === 'path');

      switch (property) {
        case 'strokeWidth':
          if (chartPath) {
            chartPath.set('strokeWidth', value);
            selectedChartLine.addWithUpdate();
            fabricCanvasRef.current?.renderAll();
            console.log(`Updated strokeWidth to ${value} for element:`, selectedChartLine.type);
          }
          break;

        case 'opacity':
          if (chartPath) {
            chartPath.set('opacity', value);
            selectedChartLine.addWithUpdate();
            fabricCanvasRef.current?.renderAll();
            console.log(`Updated opacity to ${value} for element:`, selectedChartLine.type);
          }
          break;

        case 'smoothness':
          // Regenerate the chart with new smoothness while preserving positions
          const allObjects = fabricCanvasRef.current?.getObjects() || [];
          const positions = allObjects.map((obj: any) => ({
            type: obj.type,
            left: obj.left,
            top: obj.top
          }));
          
          renderChart();
          console.log(`Updated smoothness to ${value} for element:`, selectedChartLine.type);
          break;

        case 'color':
          if (chartPath) {
            chartPath.set('stroke', value);
            selectedChartLine.addWithUpdate();
            fabricCanvasRef.current?.renderAll();
            console.log(`Updated color to ${value} for element:`, selectedChartLine.type);
          }
          break;

        case 'visible':
          if (chartPath) {
            chartPath.set('visible', value);
            selectedChartLine.addWithUpdate();
            fabricCanvasRef.current?.renderAll();
            console.log(`Updated visibility to ${value} for element:`, selectedChartLine.type);
          }
          break;
      }
    }
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
        const chartTitle = objects.find((obj: any) => obj.type === 'chart-title');
        
        if (chartPath) chartPath.set('stroke', '#f59e0b');
        if (chartTitle) {
          chartTitle.set('fill', '#f59e0b');
          chartTitle.set('text', `${symbol} (Copy) - ${timeframe}`);
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


      </div>
    </div>
  );
}