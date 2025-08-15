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
  symbol?: string;
  timeframe?: string;
  onElementSelect?: (element: any, properties: any) => void;
  onCanvasReady?: (canvas: any) => void;
  onCanvasChange?: () => void;
  onChartUpdateRef?: (updateFn: (property: string, value: any) => void) => void;
  onLoadDataRef?: (loadFn: () => void) => void;
}

export function FinancialChartCanvas({ 
  width = 900, 
  height = 500, 
  symbol = 'AAPL',
  timeframe = '1Y',
  onElementSelect,
  onCanvasReady,
  onCanvasChange,
  onChartUpdateRef,
  onLoadDataRef
}: FinancialChartCanvasProps) {
  
  // Expose update function to parent component
  const updateChartLinePropertiesRef = useRef<(property: string, value: any) => void>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<any>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<ChartDataPoint[]>([]);
  
  // Add debugging to track data changes
  useEffect(() => {
    console.log('🔍 DATA STATE CHANGED - Length:', data.length, 'First item:', data[0]);
  }, [data]);
  const [multiSymbolData, setMultiSymbolData] = useState<any>(null);
  const [isMultiSymbol, setIsMultiSymbol] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChartLine, setSelectedChartLine] = useState<any>(null);
  const [lineProperties, setLineProperties] = useState({
    strokeWidth: 3,
    opacity: 1,
    smoothness: 0.3, // Optimized for financial data - uses monotone curve
    color: '#3b82f6',
    visible: true,
    strokeDashArray: null as number[] | null,
    showMarkers: false,
    showJunctions: false,
    markerStyle: 'circle',
    markerSize: 4,
    markerFrequency: 'all',
    junctionSize: 3,
    junctionColor: '#3b82f6'
  });
  const [xAxisDateFormat, setXAxisDateFormat] = useState('short-date'); // Default format

  // Date formatting function for X-axis labels
  const formatXAxisDate = (date: Date, format: string): string => {
    switch (format) {
      case 'short-date': // "Jan 15"
        return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
      case 'month-year': // "Jan 2024"
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      case 'numeric-short': // "01/15"
        return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
      case 'numeric-full': // "01/15/24"
        return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
      case 'long-date': // "15 Jan"
        return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
      case 'weekday-short': // "Mon 15"
        return date.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit' });
      case 'iso-date': // "2024-01-15"
        return date.toISOString().split('T')[0];
      case 'quarter': // "Q1 2024"
        const quarter = Math.floor((date.getMonth() / 3)) + 1;
        return `Q${quarter} ${date.getFullYear()}`;
      default:
        return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
    }
  };

  // Load data when symbol or timeframe changes
  useEffect(() => {
    console.log(`📊 FinancialChartCanvas - Received props: symbol="${symbol}", timeframe="${timeframe}"`);
    console.log(`🔍 EFFECT TRIGGERED - Current data length: ${data.length}`);
    if (symbol) {
      console.log(`🔍 CALLING loadStockData() - This will reset data to loading state`);
      loadStockData();
    }
  }, [symbol, timeframe]);

  useEffect(() => {
    if (!fabricCanvasRef.current && canvasRef.current) {
      // Initialize Fabric canvas for interactive elements
      const canvas = new (window as any).fabric.Canvas(canvasRef.current, {
        width,
        height,
        backgroundColor: 'rgba(248, 248, 248, 0.8)',
        selection: true,
        enablePointerEvents: true,
        allowTouchScrolling: false
      });

      fabricCanvasRef.current = canvas;
      
      // Make canvas globally accessible for axis line controls
      (window as any).fabricCanvas = canvas;

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
        editable: true
      });

      const subtitle = new (window as any).fabric.Text('Drag elements to customize', {
        left: 50,
        top: 60,
        fontFamily: 'Inter, sans-serif',
        fontSize: 14,
        fill: '#6b7280',
        selectable: true,
        editable: true
      });

      // Add element types for undo/redo tracking
      title.set({ elementType: 'title' });
      subtitle.set({ elementType: 'subtitle' });
      
      canvas.add(title, subtitle);

      // Enable text editing on double-click
      canvas.on('text:editing:entered', function(e: any) {
        console.log('Text editing started');
      });

      canvas.on('text:editing:exited', function(e: any) {
        console.log('Text editing finished');
        if (onCanvasChange) {
          setTimeout(() => onCanvasChange(), 100);
        }
      });

      // Notify parent component that canvas is ready
      if (onCanvasReady) {
        onCanvasReady(canvas);
      }
      
      // Expose the chart update function to parent
      if (onChartUpdateRef) {
        onChartUpdateRef(updateChartLineProperties);
      }
      
      // Expose load data function to parent
      if (onLoadDataRef) {
        onLoadDataRef(loadStockData);
      }

      // Set up event handlers for undo/redo functionality
      canvas.on('object:modified', function(e: any) {
        console.log('Object modified:', e.target?.elementType);
        if (onCanvasChange) {
          // Debounce canvas changes to avoid too frequent saves
          setTimeout(() => onCanvasChange(), 100);
        }
      });

      canvas.on('object:added', function(e: any) {
        console.log('Object added:', e.target?.elementType);
        if (onCanvasChange) {
          setTimeout(() => onCanvasChange(), 100);
        }
      });

      canvas.on('object:removed', function(e: any) {
        console.log('Object removed:', e.target?.elementType);
        if (onCanvasChange) {
          setTimeout(() => onCanvasChange(), 100);
        }
      });

      // Set cursor states
      canvas.on('mouse:over', function(e: any) {
        if (e.target) {
          document.body.style.cursor = 'move';
        }
      });

      canvas.on('mouse:out', function() {
        document.body.style.cursor = 'default';
      });

      // Add multi-selection support with Shift key
      let isShiftPressed = false;
      
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Shift') {
          isShiftPressed = true;
        }
      };
      
      const handleKeyUp = (e: KeyboardEvent) => {
        if (e.key === 'Shift') {
          isShiftPressed = false;
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keyup', handleKeyUp);
      
      // Override object selection behavior for multi-select
      canvas.on('mouse:down', function(e: any) {
        if (isShiftPressed && e.target) {
          const activeSelection = canvas.getActiveObject();
          
          if (activeSelection && activeSelection.type === 'activeSelection') {
            // Already have a multi-selection, add/remove the clicked object
            const selection = activeSelection as any;
            const objects = selection.getObjects();
            
            if (objects.includes(e.target)) {
              // Remove from selection
              selection.removeWithUpdate(e.target);
              if (objects.length === 1) {
                // If only one object left, make it the active object
                canvas.setActiveObject(objects[0]);
              }
            } else {
              // Add to selection
              selection.addWithUpdate(e.target);
            }
            canvas.renderAll();
          } else if (activeSelection && activeSelection !== e.target) {
            // Create new multi-selection
            const selection = new (window as any).fabric.ActiveSelection([activeSelection, e.target], {
              canvas: canvas
            });
            canvas.setActiveObject(selection);
            canvas.renderAll();
          }
          
          // Prevent default selection behavior
          e.e.preventDefault();
          return false;
        }
      });

      // Handle element selection for property panel
      canvas.on('selection:created', function(e: any) {
        const activeObject = canvas.getActiveObject();
        
        if (activeObject && onElementSelect) {
          // Handle multi-selection
          if (activeObject.type === 'activeSelection') {
            const selection = activeObject as any;
            const objects = selection.getObjects();
            console.log(`Canvas multi-selection created: ${objects.length} objects`);
            
            // For multi-selection, show properties of the first object as reference
            const firstObj = objects[0];
            onElementSelect(firstObj, {
              type: 'multi-selection',
              count: objects.length,
              properties: {
                strokeWidth: firstObj.strokeWidth || 3,
                opacity: firstObj.opacity || 1,
                smoothness: firstObj.smoothness || 0.5,
                color: firstObj.stroke || firstObj.fill || '#3b82f6',
                visible: firstObj.visible !== false,
                left: firstObj.left,
                top: firstObj.top,
                angle: firstObj.angle || 0
              },
              updateFunction: (property: string, value: any) => {
                // Apply changes to all selected objects
                objects.forEach((obj: any) => {
                  obj.set(property, value);
                });
                canvas.renderAll();
                if (onCanvasChange) {
                  setTimeout(() => onCanvasChange(), 100);
                }
              }
            });
            return;
          }
          
          // Single object selection
          const obj = activeObject;
          console.log('Canvas selection created:', obj.elementType || obj.type);
          
          // Skip default selection handling for axis elements since they have custom handlers
          if (['y-axis-labels', 'x-axis-labels', 'y-axis-line', 'x-axis-line'].includes(obj.type)) {
            console.log('Skipping default selection for axis element:', obj.type);
            return;
          }
          
          onElementSelect(obj, {
            type: obj.elementType || 'element',
            properties: {
              strokeWidth: obj.strokeWidth || 3,
              opacity: obj.opacity || 1,
              smoothness: obj.smoothness || 0.5,
              color: obj.stroke || obj.fill || '#3b82f6',
              visible: obj.visible !== false,
              left: obj.left,
              top: obj.top,
              angle: obj.angle || 0
            },
            updateFunction: (property: string, value: any) => {
              obj.set(property, value);
              canvas.renderAll();
              // Trigger canvas change for undo/redo
              if (onCanvasChange) {
                setTimeout(() => onCanvasChange(), 100);
              }
            }
          });
        }
      });

      canvas.on('selection:updated', function(e: any) {
        const activeObject = canvas.getActiveObject();
        
        if (activeObject && onElementSelect) {
          // Handle multi-selection updates
          if (activeObject.type === 'activeSelection') {
            const selection = activeObject as any;
            const objects = selection.getObjects();
            console.log(`Canvas multi-selection updated: ${objects.length} objects`);
            
            const firstObj = objects[0];
            onElementSelect(firstObj, {
              type: 'multi-selection',
              count: objects.length,
              properties: {
                strokeWidth: firstObj.strokeWidth || 3,
                opacity: firstObj.opacity || 1,
                smoothness: firstObj.smoothness || 0.5,
                color: firstObj.stroke || firstObj.fill || '#3b82f6',
                visible: firstObj.visible !== false,
                left: firstObj.left,
                top: firstObj.top,
                angle: firstObj.angle || 0
              },
              updateFunction: (property: string, value: any) => {
                objects.forEach((obj: any) => {
                  obj.set(property, value);
                });
                canvas.renderAll();
                if (onCanvasChange) {
                  setTimeout(() => onCanvasChange(), 100);
                }
              }
            });
            return;
          }
          
          // Single object selection update
          const obj = activeObject;
          console.log('Canvas selection updated:', obj.elementType || obj.type);
          
          // Skip default selection handling for axis elements since they have custom handlers
          if (['y-axis-labels', 'x-axis-labels', 'y-axis-line', 'x-axis-line'].includes(obj.type)) {
            console.log('Skipping default selection update for axis element:', obj.type);
            return;
          }
          
          onElementSelect(obj, {
            type: obj.elementType || 'element',
            properties: {
              strokeWidth: obj.strokeWidth || 3,
              opacity: obj.opacity || 1,
              smoothness: obj.smoothness || 0.5,
              color: obj.stroke || obj.fill || '#3b82f6',
              visible: obj.visible !== false,
              left: obj.left,
              top: obj.top,
              angle: obj.angle || 0
            },
            updateFunction: (property: string, value: any) => {
              obj.set(property, value);
              canvas.renderAll();
              // Trigger canvas change for undo/redo
              if (onCanvasChange) {
                setTimeout(() => onCanvasChange(), 100);
              }
            }
          });
        }
      });

      canvas.on('selection:cleared', function(e: any) {
        console.log('Canvas selection cleared');
        if (onElementSelect) {
          onElementSelect(null, null);
        }
      });

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
        canvas.dispose();
      };
    }
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
      console.log(`📊 Loading data for symbol: ${symbol}, timeframe: ${timeframe}`);
      
      // Check if symbol contains multiple tickers (comma separated after processing in DataSourcePanel)
      const symbolsArray = symbol.split(',').map(s => s.trim()).filter(s => s.length > 0);
      const isMultiSymbolRequest = symbolsArray.length > 1;
      
      const response = await fetch(`/api/stocks/${encodeURIComponent(symbol)}/${timeframe}`);
      if (!response.ok) throw new Error('Failed to fetch stock data');
      
      const stockData = await response.json();
      
      console.log(`📊 API Response: isMultiSymbol=${stockData.isMultiSymbol}, isMultiSymbolRequest=${isMultiSymbolRequest}`);
      console.log(`📊 stockData.symbols:`, stockData.symbols);
      
      // Handle multi-symbol or single symbol response
      if (stockData.isMultiSymbol || isMultiSymbolRequest) {
        console.log(`📊 Loading multi-symbol data: ${symbolsArray.join(', ')}`);
        setMultiSymbolData(stockData);
        setIsMultiSymbol(true);
        const newData = stockData.combinedData || stockData.data || [];
        console.log(`🔍 SETTING MULTI-SYMBOL DATA - Length: ${newData.length}`);
        setData(newData); // Use combined data for Y-axis calculation
      } else {
        console.log(`📊 Loading single symbol data: ${symbol}`);
        setMultiSymbolData(null);
        setIsMultiSymbol(false);
        console.log(`🔍 SETTING SINGLE-SYMBOL DATA - Length: ${stockData.length}`);
        setData(stockData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stock data');
      console.error('Error loading stock data:', err);
      setMultiSymbolData(null);
      setIsMultiSymbol(false);
      console.log(`🔍 ERROR: CLEARING DATA DUE TO ERROR`);
      setData([]); // This could be causing data loss!
    } finally {
      setLoading(false);
    }
  };

  const renderChart = () => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    if (data.length === 0) return;

    const margin = { top: 120, right: 40, bottom: 80, left: 80 };
    const chartWidth = Math.min(width - margin.left - margin.right, 680);
    const chartHeight = Math.min(height - margin.top - margin.bottom, 280);

    // Check if we have multi-symbol data from component state
    console.log('📊 Rendering chart - isMultiSymbol:', isMultiSymbol, 'symbols:', multiSymbolData?.symbols);

    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => new Date(d.timestamp)) as [Date, Date])
      .range([0, chartWidth]);

    // Enhanced Y-scale for multiple symbols with graceful range accommodation
    const calculateOptimalYScale = (chartData: ChartDataPoint[]) => {
      if (!chartData || chartData.length === 0) {
        return { yMin: 0, yMax: 100, yScale: d3.scaleLinear().domain([0, 100]).range([chartHeight, 0]) };
      }
      
      // Get all price values (high, low, close, open) from the data
      const allPrices = chartData.flatMap(d => [d.high, d.low, d.close, d.open]);
      const rawMin = Math.min(...allPrices);
      const rawMax = Math.max(...allPrices);
      
      // Calculate price range and determine scaling strategy
      const priceRange = rawMax - rawMin;
      const averagePrice = (rawMin + rawMax) / 2;
      
      let yMin, yMax;
      
      // For multiple symbols with very different ranges, use adaptive scaling
      if (symbol.includes(',') || symbol.includes(' ')) {
        // Multiple symbols - use more aggressive percentile filtering for tighter bounds
        const sortedPrices = allPrices.sort((a, b) => a - b);
        const p10 = sortedPrices[Math.floor(sortedPrices.length * 0.10)]; // 10th percentile
        const p90 = sortedPrices[Math.floor(sortedPrices.length * 0.90)]; // 90th percentile
        
        // Use tighter percentile bounds to exclude more outliers and get closer to main data range
        yMin = p10; // Start at 10th percentile (more aggressive)
        yMax = p90; // End at 90th percentile (more aggressive)
        
        console.log(`📊 Multi-symbol percentile analysis: P10=${p10.toFixed(2)}, P90=${p90.toFixed(2)}, Raw=${rawMin.toFixed(2)}-${rawMax.toFixed(2)}, Final=${yMin.toFixed(2)}-${yMax.toFixed(2)}`);
      } else {
        // Single symbol - use tiny padding for readability
        const padding = priceRange * 0.01; // 1% padding
        yMin = Math.max(0, rawMin - padding);
        yMax = rawMax + padding;
      }
      
      // Skip nice number rounding for tighter axis fit - use actual price bounds
      
      const yScale = d3.scaleLinear()
        .domain([yMin, yMax])
        .range([chartHeight, 0]);
      
      console.log(`📊 Y-axis scaling: Symbol(s): ${symbol}, Range: $${yMin.toFixed(2)} - $${yMax.toFixed(2)}, Data points: ${chartData.length}`);
      
      return { yMin, yMax, yScale };
    };
    
    const { yMin, yMax, yScale } = calculateOptimalYScale(data);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Apply smoothness to curve interpolation instead of data filtering
    const getCurveType = (smoothness: number) => {
      console.log('🎯 getCurveType called with smoothness:', smoothness);
      let curve;
      
      if (smoothness <= 0.1) {
        // Linear interpolation for sharp angles without step artifacts
        curve = d3.curveLinear;
        console.log('📊 Using LINEAR curve for sharp angles (avoiding step artifacts)');
      } else if (smoothness <= 0.3) {
        // Monotone interpolation - prevents overshooting, ideal for financial data
        curve = d3.curveMonotoneX;
        console.log('📈 Using monotone-X curve for clean financial lines');
      } else if (smoothness <= 0.5) {
        // Natural spline - smooth but respects data trends
        curve = d3.curveNatural;
        console.log('🌿 Using natural spline curve for balanced smoothness');
      } else if (smoothness <= 0.7) {
        // Cardinal spline with financial-optimized tension
        curve = d3.curveCardinal.tension(0.3);
        console.log('📈 Using cardinal curve with optimized tension');
      } else if (smoothness <= 0.85) {
        // Catmull-Rom with moderate alpha for trend visualization
        curve = d3.curveCatmullRom.alpha(0.5);
        console.log('🌊 Using catmull-rom curve with balanced alpha');
      } else {
        // Basis spline for maximum smoothness in trend analysis
        curve = d3.curveBasis;
        console.log('🌊 Using basis spline for maximum trend smoothness');
      }
      return curve;
    };

    // Render multiple lines for multi-symbol data or single line for single symbol
    if (isMultiSymbol && multiSymbolData?.series) {
      console.log(`📊 Rendering ${multiSymbolData.series.length} symbol lines`);
      
      // Clear existing chart elements when re-rendering multi-symbol chart
      if (fabricCanvasRef.current) {
        const objects = fabricCanvasRef.current.getObjects();
        objects.forEach((obj: any) => {
          if (obj.type === 'financial-chart-line' || obj.elementType === 'chartline' ||
              obj.type === 'x-axis-line' || obj.type === 'y-axis-line' || 
              obj.type === 'x-axis-labels' || obj.type === 'y-axis-labels' ||
              obj.type === 'x-axis-label' || obj.type === 'y-axis-label') {
            fabricCanvasRef.current?.remove(obj);
          }
        });
      }
      
      // Define colors for different symbols  
      const symbolColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
      
      multiSymbolData.series.forEach((seriesData: any, index: number) => {
        const seriesColor = symbolColors[index % symbolColors.length];
        console.log(`📈 Rendering ${seriesData.symbol} with color ${seriesColor}`);
        
        const line = d3.line<ChartDataPoint>()
          .x(d => xScale(new Date(d.timestamp)))
          .y(d => yScale(d.close))
          .curve(getCurveType(lineProperties.smoothness));
        
        const pathData = line(seriesData.data) || '';
        console.log(`📊 Generated ${seriesData.symbol} path data with smoothness:`, lineProperties.smoothness, 'Path length:', pathData.length);
        
        // Add to Fabric canvas with proper positioning
        if (fabricCanvasRef.current) {
          const chartStartX = margin.left + 40; // Account for Y-axis labels
          
          const fabricPath = new (window as any).fabric.Path(pathData, {
            left: chartStartX,
            top: margin.top,
            stroke: seriesColor,
            strokeWidth: lineProperties.strokeWidth,
            fill: '',
            selectable: true,
            hasControls: true,
            hasBorders: true,
            opacity: lineProperties.opacity,
            visible: lineProperties.visible,
            strokeLineCap: 'round',
            strokeLineJoin: 'round'
          });
          
          // Add metadata for identification
          fabricPath.set({
            type: 'financial-chart-line',
            elementType: 'chartline',
            symbol: seriesData.symbol,
            color: seriesColor
          });
          
          fabricCanvasRef.current.add(fabricPath);
          
          // Force canvas to render the new path
          fabricCanvasRef.current.renderAll();
          
          // Set up selection handler for this line
          fabricPath.on('selected', function() {
            console.log(`Chart line selected for ${seriesData.symbol}`);
            setSelectedChartLine(fabricPath);
            if (onElementSelect) {
              onElementSelect(fabricPath, {
                type: 'financial-chart-line',
                symbol: seriesData.symbol,
                properties: {
                  strokeWidth: fabricPath.strokeWidth,
                  opacity: fabricPath.opacity,
                  color: fabricPath.stroke,
                  visible: fabricPath.visible
                }
              });
            }
          });
          
          console.log(`✅ Added ${seriesData.symbol} line to canvas`);
        }
      });
      
      // Add chart legend for multi-symbol charts
      setTimeout(() => {
        if (fabricCanvasRef.current) {
          // Remove existing legend elements
          const objects = fabricCanvasRef.current.getObjects();
          objects.forEach((obj: any) => {
            if (obj.type === 'chart-legend' || obj.type === 'legend-item' || 
                obj.type === 'legend-background') {
              fabricCanvasRef.current?.remove(obj);
            }
          });
          
          // Create legend for multi-symbol chart
          addChartLegend(multiSymbolData.series, symbolColors, margin);
        }
      }, 50);

      // Add axes for multi-symbol chart after all lines are rendered
      setTimeout(() => {
        if (fabricCanvasRef.current && data.length > 0) {
          // Remove existing axes and chart lines to prevent duplicates when rescaling
          const objects = fabricCanvasRef.current.getObjects();
          objects.forEach((obj: any) => {
            if (obj.type === 'x-axis-line' || obj.type === 'y-axis-line' || 
                obj.type === 'x-axis-labels' || obj.type === 'y-axis-labels' ||
                obj.type === 'x-axis-label' || obj.type === 'y-axis-label') {
              fabricCanvasRef.current?.remove(obj);
            }
          });
          
          // Add fresh axes for multi-symbol chart with updated scaling
          addAxisElements(data, margin, width, height);
          fabricCanvasRef.current.renderAll();
          console.log('✅ Added axes for multi-symbol chart');
        }
      }, 100);
    } else {
      // Single symbol rendering
      const line = d3.line<ChartDataPoint>()
        .x(d => xScale(new Date(d.timestamp)))
        .y(d => yScale(d.close))
        .curve(getCurveType(lineProperties.smoothness));

      const pathData = line(data) || '';
      console.log('📊 Generated single symbol path data with smoothness:', lineProperties.smoothness, 'Path length:', pathData.length);

      // Remove existing axes and chart lines to prevent duplicates when rescaling
      const objects = fabricCanvasRef.current.getObjects();
      objects.forEach((obj: any) => {
        if (obj.type === 'x-axis-line' || obj.type === 'y-axis-line' || 
            obj.type === 'x-axis-labels' || obj.type === 'y-axis-labels' ||
            obj.type === 'x-axis-label' || obj.type === 'y-axis-label') {
          fabricCanvasRef.current?.remove(obj);
        }
      });

      // Create only the chart line without axis elements
      setTimeout(() => {
        createDraggableChartLineOnly(pathData, margin, xScale, yScale, chartWidth, chartHeight);
        // Add separate axis elements for single symbol
        addAxisElements(data, margin, width, height);
      }, 100);
    }
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
      elementType: 'annotation'
    });

    fabricCanvasRef.current.add(annotation);
    fabricCanvasRef.current.renderAll();
  };

  const addTrendLine = () => {
    if (!fabricCanvasRef.current) return;

    const line = new (window as any).fabric.Line([150, 200, 350, 150], {
      stroke: '#f59e0b',
      strokeWidth: 3,
      elementType: 'trendline',
      selectable: true,
      hasControls: true,
      hasBorders: true,
    });

    fabricCanvasRef.current.add(line);
    fabricCanvasRef.current.renderAll();
  };

  // Helper function to add chart legend for multi-symbol charts
  const addChartLegend = (seriesArray: any[], colors: string[], chartMargin: any) => {
    if (!fabricCanvasRef.current || !seriesArray?.length) return;
    
    const itemSpacing = 110; // Horizontal spacing between legend items
    const itemHeight = 32;
    const legendWidth = seriesArray.length * itemSpacing + 20;
    
    // Position legend at top right, aligned with title
    const legendStartX = width - legendWidth - 20; 
    const legendStartY = 30; // Same level as title
    
    console.log(`📋 Creating draggable legend group for ${seriesArray.length} symbols`);
    
    // Get company name from symbol (simplified mapping)
    const getCompanyName = (symbol: string) => {
      const companies: Record<string, string> = {
        'AAPL': 'Apple Inc.',
        'GOOGL': 'Alphabet Inc.',
        'TSLA': 'Tesla Inc.',
        'MSFT': 'Microsoft Corp.',
        'AMZN': 'Amazon.com Inc.',
        'NVDA': 'NVIDIA Corp.',
        'META': 'Meta Platforms Inc.',
        'BRK.B': 'Berkshire Hathaway',
        'V': 'Visa Inc.',
        'JPM': 'JPMorgan Chase'
      };
      return companies[symbol] || symbol;
    };
    
    // Create all legend elements
    const legendElements: any[] = [];
    
    // Create legend background
    const legendBackground = new (window as any).fabric.Rect({
      left: 0,
      top: 0,
      width: legendWidth,
      height: itemHeight,
      fill: 'rgba(255, 255, 255, 0.95)',
      stroke: '#e5e7eb',
      strokeWidth: 1,
      rx: 6,
      ry: 6,
      selectable: false,
      evented: false
    });
    legendElements.push(legendBackground);
    
    // Create legend items for each symbol
    seriesArray.forEach((series: any, index: number) => {
      const color = colors[index % colors.length];
      const itemX = 10 + (index * itemSpacing); // Relative to group
      const symbol = series.symbol;
      
      // Create clickable background for toggle functionality
      const toggleArea = new (window as any).fabric.Rect({
        left: itemX - 2,
        top: 2,
        width: itemSpacing - 5,
        height: itemHeight - 4,
        fill: 'transparent',
        stroke: null,
        selectable: false,
        evented: true,
        hoverCursor: 'pointer'
      });
      
      // Add click handler for toggle functionality
      toggleArea.on('mousedown', () => {
        const chartLine = fabricCanvasRef.current?.getObjects().find((obj: any) => 
          obj.symbol === symbol && (obj.type === 'chartline' || obj.type === 'financial-chart-line')
        );
        
        if (chartLine) {
          const isVisible = chartLine.visible !== false;
          chartLine.set('visible', !isVisible);
          
          // Update color indicator opacity to reflect visibility state
          colorIndicator.set('opacity', !isVisible ? 1 : 0.3);
          symbolText.set('opacity', !isVisible ? 1 : 0.5);
          companyText.set('opacity', !isVisible ? 1 : 0.5);
          
          fabricCanvasRef.current?.renderAll();
          console.log(`🎯 Toggled ${symbol} chart line: ${!isVisible ? 'visible' : 'hidden'}`);
        }
      });
      
      // Create color indicator circle
      const colorIndicator = new (window as any).fabric.Circle({
        left: itemX,
        top: 8,
        radius: 6,
        fill: color,
        stroke: color,
        strokeWidth: 1,
        selectable: false,
        evented: false
      });
      
      // Create symbol text (e.g., "AAPL")
      const symbolText = new (window as any).fabric.Text(symbol, {
        left: itemX + 18,
        top: 4,
        fontSize: 11,
        fontFamily: 'Inter, sans-serif',
        fontWeight: 'bold',
        fill: '#374151',
        selectable: false,
        evented: false
      });
      
      // Create company name text (smaller, below symbol)
      const companyText = new (window as any).fabric.Text(getCompanyName(symbol), {
        left: itemX + 18,
        top: 16,
        fontSize: 8,
        fontFamily: 'Inter, sans-serif',
        fill: '#6b7280',
        selectable: false,
        evented: false
      });
      
      legendElements.push(toggleArea);
      legendElements.push(colorIndicator);
      legendElements.push(symbolText);
      legendElements.push(companyText);
      
      console.log(`📋 Added interactive legend item: ${symbol} (${getCompanyName(symbol)}) with color ${color}`);
    });
    
    // Create grouped legend element
    const legendGroup = new (window as any).fabric.Group(legendElements, {
      left: legendStartX,
      top: legendStartY,
      selectable: true,
      hasControls: true,
      hasBorders: true,
      lockScalingX: true,
      lockScalingY: true,
      lockRotation: true,
      type: 'group',
      elementType: 'chart-legend',
      id: `legend_${Date.now()}`,
      name: 'Chart Legend',
      isGroup: true
    });
    
    fabricCanvasRef.current.add(legendGroup);
    fabricCanvasRef.current.renderAll();
    console.log('✅ Chart legend group created successfully');
  };

  // Helper function to add axis elements
  const addAxisElements = (chartData: ChartDataPoint[], margin: any, canvasWidth: number, canvasHeight: number) => {
    if (!fabricCanvasRef.current) return;
    
    const chartWidth = Math.min(canvasWidth - margin.left - margin.right, 680);
    const chartHeight = Math.min(canvasHeight - margin.top - margin.bottom, 280);
    const chartStartX = margin.left + 40; // Same as chart positioning
    
    // Calculate scales to match chart rendering
    const xScale = d3.scaleTime()
      .domain(d3.extent(chartData, d => new Date(d.timestamp)) as [Date, Date])
      .range([0, chartWidth]);
      
    const allPrices = chartData.flatMap(d => [d.high, d.low, d.close, d.open]);
    const calculatedYMin = Math.min(...allPrices) * 0.95;
    const calculatedYMax = Math.max(...allPrices) * 1.05;
    const yScale = d3.scaleLinear()
      .domain([calculatedYMin, calculatedYMax])
      .range([chartHeight, 0]);
    
    // Create Y-axis labels with proper positioning - avoid overlap with axis line
    const yTicks = yScale.ticks(5);
    const yAxisLabels = yTicks.map((price: number) => new (window as any).fabric.Text(
      `$${price.toFixed(2)}`, {
        left: chartStartX - 55, // Move further left to avoid overlap
        top: margin.top + yScale(price) - 6,
        fontSize: 11,
        fontFamily: 'Inter, sans-serif',
        fill: '#666666',
        selectable: true,
        hasControls: false,
        hasBorders: true,
        type: 'y-axis-label'
      }
    ));
    
    // Create X-axis labels with proper positioning and custom formatting
    const xTicks = xScale.ticks(5);
    const xAxisLabels = xTicks.map((date: Date) => new (window as any).fabric.Text(
      formatXAxisDate(date, xAxisDateFormat), {
        left: chartStartX + xScale(date) - 20,
        top: margin.top + chartHeight + 10, // Closer to axis line
        fontSize: 11,
        fontFamily: 'Inter, sans-serif',
        fill: '#666666',
        selectable: true,
        hasControls: false,
        hasBorders: true,
        type: 'x-axis-label'
      }
    ));
    
    // Create axis lines with proper positioning - make sure they meet at corner
    const yAxisLine = new (window as any).fabric.Line([
      chartStartX, 
      margin.top, 
      chartStartX, 
      margin.top + chartHeight
    ], {
      stroke: '#666666',
      strokeWidth: 1,
      selectable: true,
      hasControls: false,
      hasBorders: true,
      type: 'y-axis-line'
    });
    
    const xAxisLine = new (window as any).fabric.Line([
      chartStartX, 
      margin.top + chartHeight, 
      chartStartX + chartWidth, 
      margin.top + chartHeight
    ], {
      stroke: '#666666',
      strokeWidth: 1,
      selectable: true,
      hasControls: false,
      hasBorders: true,
      type: 'x-axis-line'
    });

    // Create horizontal grid lines (extending from Y-axis line to align with Y-axis labels)
    const yGridLines: any[] = [];
    yTicks.forEach((price: number) => {
      const yPos = margin.top + yScale(price);
      const gridLine = new (window as any).fabric.Line([
        chartStartX, yPos, chartStartX + chartWidth, yPos
      ], {
        stroke: '#e5e7eb',
        strokeWidth: 0.5,
        selectable: false,
        evented: false,
        type: 'y-grid-line',
        opacity: 0.3,
        visible: true
      });
      yGridLines.push(gridLine);
    });

    // Create vertical grid lines (extending from X-axis line to align with X-axis labels)  
    const xGridLines: any[] = [];
    xTicks.forEach((date: Date) => {
      const xPos = chartStartX + xScale(date);
      const gridLine = new (window as any).fabric.Line([
        xPos, margin.top, xPos, margin.top + chartHeight
      ], {
        stroke: '#e5e7eb',
        strokeWidth: 0.5,
        selectable: false,
        evented: false,
        type: 'x-grid-line',
        opacity: 0.3,
        visible: true
      });
      xGridLines.push(gridLine);
    });
    
    // Create separate groups for Y-axis and X-axis labels
    const yAxisLabelsGroup = new (window as any).fabric.Group(yAxisLabels, {
      selectable: true,
      hasControls: false,
      hasBorders: true,
      type: 'y-axis-labels',
      evented: true
    });

    const xAxisLabelsGroup = new (window as any).fabric.Group(xAxisLabels, {
      selectable: true,
      hasControls: false,
      hasBorders: true,
      type: 'x-axis-labels',
      evented: true
    });

    // Set up event handlers for Y-axis labels group
    yAxisLabelsGroup.on('selected', () => {
      console.log('Y-axis labels group selected');
      if (onElementSelect) {
        onElementSelect(yAxisLabelsGroup, {
          type: 'y-axis-labels',
          properties: { 
            fontSize: 11, 
            fill: '#666666', 
            fontFamily: 'Inter, sans-serif', 
            fontWeight: 'normal' 
          },
          updateFunction: (property: string, value: any) => {
            console.log(`Updating Y-axis labels: ${property} = ${value}`);
            const objects = yAxisLabelsGroup.getObjects();
            objects.forEach((obj: any) => {
              if (property === 'fontSize') obj.set('fontSize', value);
              if (property === 'fill') obj.set('fill', value);
              if (property === 'fontFamily') obj.set('fontFamily', value);
              if (property === 'fontWeight') obj.set('fontWeight', value);
            });
            yAxisLabelsGroup.addWithUpdate();
            fabricCanvasRef.current?.renderAll();
            console.log(`Updated ${property} to ${value} for Y-axis labels`);
          }
        });
      }
    });

    // Set up event handlers for X-axis labels group
    xAxisLabelsGroup.on('selected', () => {
      console.log('X-axis labels group selected');
      if (onElementSelect) {
        onElementSelect(xAxisLabelsGroup, {
          type: 'x-axis-labels',
          properties: { 
            fontSize: 11, 
            fill: '#666666', 
            fontFamily: 'Inter, sans-serif', 
            fontWeight: 'normal',
            dateFormat: xAxisDateFormat
          },
          updateFunction: (property: string, value: any) => {
            console.log(`Updating X-axis labels: ${property} = ${value}`);
            
            if (property === 'dateFormat') {
              // Update the date format and regenerate labels
              setXAxisDateFormat(value);
              
              // Regenerate the labels with new format
              const objects = xAxisLabelsGroup.getObjects();
              objects.forEach((obj: any, index: number) => {
                if (xTicks[index]) {
                  const newText = formatXAxisDate(xTicks[index], value);
                  obj.set('text', newText);
                }
              });
            } else {
              // Handle other properties normally
              const objects = xAxisLabelsGroup.getObjects();
              objects.forEach((obj: any) => {
                if (property === 'fontSize') obj.set('fontSize', value);
                if (property === 'fill') obj.set('fill', value);
                if (property === 'fontFamily') obj.set('fontFamily', value);
                if (property === 'fontWeight') obj.set('fontWeight', value);
              });
            }
            
            xAxisLabelsGroup.addWithUpdate();
            fabricCanvasRef.current?.renderAll();
            console.log(`Updated ${property} to ${value} for X-axis labels`);
          }
        });
      }
    });

    // Store grid lines for later use and log them
    console.log('Storing Y grid lines:', yGridLines.length);
    console.log('Storing X grid lines:', xGridLines.length);
    console.log('Sample Y grid line:', yGridLines[0]);
    console.log('Sample Y grid line stroke:', yGridLines[0]?.stroke);
    (fabricCanvasRef.current as any).yGridLines = yGridLines;
    (fabricCanvasRef.current as any).xGridLines = xGridLines;

    // Store updateFunction directly on the yAxisLine object
    const yAxisUpdateFunction = (property: string, value: any) => {
      console.log(`🔧 Updating Y-axis line: ${property} = ${value}`);
      if (property === 'strokeWidth') yAxisLine.set('strokeWidth', value);
      if (property === 'opacity') yAxisLine.set('opacity', value);
      if (property === 'color') yAxisLine.set('stroke', value);
      if (property === 'visible') yAxisLine.set('visible', value);
      if (property === 'gridLinesVisible') {
        console.log('🔧 CANVAS: Grid line visibility toggle triggered:', value);
        const yGridLines = (fabricCanvasRef.current as any)?.yGridLines || [];
        console.log('🔧 CANVAS: Y Grid Lines stored:', yGridLines.length);
        console.log('🔧 CANVAS: Canvas objects before:', fabricCanvasRef.current?.getObjects().length);
        
        if (value) {
          // Remove existing grid lines first
          const existingGridLines = fabricCanvasRef.current?.getObjects().filter((obj: any) => obj.type === 'y-grid-line');
          console.log('🔧 CANVAS: Removing existing grid lines:', existingGridLines.length);
          existingGridLines.forEach((gridLine: any) => {
            fabricCanvasRef.current?.remove(gridLine);
          });
          
          // Create horizontal grid lines
          console.log('🔧 CANVAS: Creating horizontal grid lines:', yGridLines.length);
          
          // Create actual grid lines
          yGridLines.forEach((gridLine: any, index: number) => {
            const yPos = gridLine.top;
            const freshGridLine = new (window as any).fabric.Line([140, yPos, 820, yPos], {
              stroke: '#e5e7eb',
              strokeWidth: 1,
              opacity: 0.8,
              selectable: false,
              evented: false,
              type: 'y-grid-line'
            });
            
            console.log(`🔧 CANVAS: Created grid line ${index} at Y=${yPos}`);
            fabricCanvasRef.current?.add(freshGridLine);
          });
          fabricCanvasRef.current?.renderAll();
          console.log('🔧 CANVAS: Canvas objects after:', fabricCanvasRef.current?.getObjects().length);
        } else {
          // Remove horizontal grid lines from canvas
          const existingGridLines = fabricCanvasRef.current?.getObjects().filter((obj: any) => 
            obj.type === 'y-grid-line' || obj.type === 'test-grid-line');
          console.log('🔧 CANVAS: Removing horizontal grid lines:', existingGridLines.length);
          existingGridLines.forEach((gridLine: any) => {
            fabricCanvasRef.current?.remove(gridLine);
          });
          fabricCanvasRef.current?.renderAll();
        }
      } else {
        console.log('🔧 CANVAS: Other property update:', property, '=', value);
      }
      fabricCanvasRef.current?.renderAll();
      console.log(`Updated ${property} to ${value} for Y-axis line`);
    };

    // Store updateFunction directly on the yAxisLine object
    yAxisLine.updateFunction = yAxisUpdateFunction;

    // Set up event handlers for Y-axis line with grid line controls
    yAxisLine.on('selected', () => {
      console.log('Y-axis line selected');
      if (onElementSelect) {
        onElementSelect(yAxisLine, {
          type: 'y-axis-line',
          properties: { 
            strokeWidth: 1, 
            opacity: 1, 
            color: '#666666', 
            visible: true,
            gridLinesVisible: false
          },
          updateFunction: yAxisUpdateFunction
        });
      }
    });

    // Define X-axis update function
    const xAxisUpdateFunction = (property: string, value: any) => {
      console.log(`🔧 Updating X-axis line: ${property} = ${value}`);
      if (property === 'strokeWidth') xAxisLine.set('strokeWidth', value);
      if (property === 'opacity') xAxisLine.set('opacity', value);
      if (property === 'color') xAxisLine.set('stroke', value);
      if (property === 'visible') xAxisLine.set('visible', value);
      if (property === 'gridLinesVisible') {
        console.log('🔧 CANVAS: X-Grid line visibility toggle triggered:', value);
        const xGridLines = (fabricCanvasRef.current as any)?.xGridLines || [];
        console.log('🔧 CANVAS: X Grid Lines stored:', xGridLines.length);
        
        if (value) {
          // Remove existing vertical grid lines first
          const existingGridLines = fabricCanvasRef.current?.getObjects().filter((obj: any) => 
            obj.type === 'x-grid-line' || obj.type === 'test-x-grid-line');
          console.log('🔧 CANVAS: Removing existing X grid lines:', existingGridLines.length);
          existingGridLines.forEach((gridLine: any) => {
            fabricCanvasRef.current?.remove(gridLine);
          });
          
          // Create fresh vertical grid lines with absolute coordinates
          console.log('🔧 CANVAS: Creating fresh vertical grid lines:', xGridLines.length);
          
          // Create actual vertical grid lines
          xGridLines.forEach((gridLine: any, index: number) => {
            console.log(`🔧 CANVAS: Original X grid line ${index}:`, gridLine.left, gridLine.top, gridLine.width);
            
            // Create a new grid line with absolute coordinates
            // Use the stored grid line's position but create fresh coordinates
            const xPos = gridLine.left + (gridLine.width / 2); // X position from stored grid line center
            const chartStartY = 120;   // Chart starts at Y=120
            const chartEndY = 400;     // Chart ends at Y=400
            
            const freshGridLine = new (window as any).fabric.Line(
              [xPos, chartStartY, xPos, chartEndY], 
              {
                stroke: '#e5e7eb',
                strokeWidth: 1,
                opacity: 0.8,
                selectable: false,
                evented: false,
                type: 'x-grid-line'
              }
            );
            
            console.log(`🔧 CANVAS: Created fresh X grid line at X=${xPos} from Y=${chartStartY} to Y=${chartEndY}`);
            fabricCanvasRef.current?.add(freshGridLine);
          });
        } else {
          // Remove vertical grid lines from canvas
          const existingGridLines = fabricCanvasRef.current?.getObjects().filter((obj: any) => 
            obj.type === 'x-grid-line' || obj.type === 'test-x-grid-line');
          console.log('🔧 CANVAS: Removing X grid lines:', existingGridLines.length);
          existingGridLines.forEach((gridLine: any) => {
            fabricCanvasRef.current?.remove(gridLine);
          });
        }
      }
      fabricCanvasRef.current?.renderAll();
      console.log(`Updated ${property} to ${value} for X-axis line`);
    };

    // Store updateFunction directly on the xAxisLine object
    xAxisLine.updateFunction = xAxisUpdateFunction;

    // Set up event handlers for X-axis line with grid line controls
    xAxisLine.on('selected', () => {
      console.log('X-axis line selected');
      if (onElementSelect) {
        onElementSelect(xAxisLine, {
          type: 'x-axis-line',
          properties: { 
            strokeWidth: 1, 
            opacity: 1, 
            color: '#666666', 
            visible: true,
            gridLinesVisible: false
          },
          updateFunction: xAxisUpdateFunction
        });
      }
    });

    // Create source attribution text at bottom right (only if one doesn't exist)
    const existingSourceAttribution = fabricCanvasRef.current.getObjects().find((obj: any) => obj.type === 'source-attribution');
    
    if (!existingSourceAttribution) {
      const sourceText = new (window as any).fabric.Text('Source: Polygon.io', {
        left: chartStartX + chartWidth - 80, // Position at bottom right
        top: margin.top + chartHeight + 35, // Below the X-axis labels
        fontSize: 9,
        fontFamily: 'Inter, sans-serif',
        fill: '#9ca3af', // Light gray color
        selectable: true,
        hasControls: false,
        hasBorders: true,
        type: 'source-attribution',
        elementType: 'source-attribution'
      });
      
      // Add selection handler for source attribution
      sourceText.on('selected', () => {
        console.log('Source attribution selected');
        if (onElementSelect) {
        onElementSelect(sourceText, {
          type: 'source-attribution',
          properties: {
            fontSize: sourceText.fontSize,
            fill: sourceText.fill,
            fontFamily: sourceText.fontFamily,
            fontWeight: sourceText.fontWeight || 'normal',
            text: sourceText.text,
            left: sourceText.left,
            top: sourceText.top,
            angle: sourceText.angle || 0
          },
          updateFunction: (property: string, value: any) => {
            console.log(`Updating source attribution: ${property} = ${value}`);
            if (property === 'fontSize') sourceText.set('fontSize', value);
            if (property === 'fill') sourceText.set('fill', value);
            if (property === 'fontFamily') sourceText.set('fontFamily', value);
            if (property === 'fontWeight') sourceText.set('fontWeight', value);
            if (property === 'text') sourceText.set('text', value);
            if (property === 'visible') sourceText.set('visible', value);
            fabricCanvasRef.current?.renderAll();
          }
        });
        }
      });
      
      fabricCanvasRef.current.add(sourceText);
      console.log('✅ Added new source attribution');
    } else {
      console.log('⚠️ Source attribution already exists, skipping creation');
    }

    // Add all axis elements
    fabricCanvasRef.current.add(yAxisLine);
    fabricCanvasRef.current.add(xAxisLine);
    fabricCanvasRef.current.add(yAxisLabelsGroup);
    fabricCanvasRef.current.add(xAxisLabelsGroup);
  };

  const createDraggableChartLineOnly = (pathData: string, margin: any, xScale: any, yScale: any, chartWidth: number, chartHeight: number) => {
    if (!fabricCanvasRef.current) return;

    // Create only the chart line path
    const fabricPath = new (window as any).fabric.Path(pathData, {
      fill: '',
      stroke: lineProperties.color,
      strokeWidth: lineProperties.strokeWidth,
      strokeLineCap: 'round',
      strokeLineJoin: 'round',
      opacity: lineProperties.opacity,
      strokeDashArray: lineProperties.strokeDashArray || null
    });

    // Position the chart line at the center
    const canvasCenter = width / 2;
    const totalChartWidth = chartWidth + 60;
    const chartStartX = canvasCenter - (totalChartWidth / 2) + 60;
    
    fabricPath.set({
      left: chartStartX,
      top: 120,
      selectable: true,
      hasControls: true,
      hasBorders: true,
      cornerColor: '#3b82f6',
      cornerStyle: 'circle',
      transparentCorners: false,
      cornerSize: 8,
      type: 'financial-chart-line',
      symbol,
      timeframe,
      properties: lineProperties
    });

    // Add chart line to canvas
    fabricCanvasRef.current.add(fabricPath);

    // Set up selection handler
    fabricPath.on('selected', () => {
      console.log('Chart line selected');
      setSelectedChartLine(fabricPath);
      
      if (onElementSelect) {
        onElementSelect(fabricPath, {
          type: 'financial-chart-line',
          symbol,
          properties: {
            ...lineProperties,
            strokeWidth: fabricPath.strokeWidth,
            opacity: fabricPath.opacity,
            color: fabricPath.stroke,
            visible: fabricPath.visible,
            left: fabricPath.left,
            top: fabricPath.top,
            angle: fabricPath.angle,
            // Ensure marker/junction properties are included
            showMarkers: lineProperties.showMarkers,
            showJunctions: lineProperties.showJunctions,
            markerStyle: lineProperties.markerStyle,
            markerSize: lineProperties.markerSize,
            markerFrequency: lineProperties.markerFrequency,
            junctionSize: lineProperties.junctionSize,
            junctionColor: lineProperties.junctionColor
          }
        });
      }
    });

    fabricCanvasRef.current.renderAll();
    
    // Auto-select the chart line
    fabricCanvasRef.current.setActiveObject(fabricPath);
    setSelectedChartLine(fabricPath);
  };

  const createDraggableChartGroup = (
    pathData: string, 
    margin: any, 
    xScale: any, 
    yScale: any, 
    chartWidth: number, 
    chartHeight: number,
    symbolOptions?: any
  ) => {
    if (!fabricCanvasRef.current || !pathData || data.length === 0) return;

    // Convert SVG path to Fabric.js Path object with symbol-specific styling
    const chartColor = symbolOptions?.color || lineProperties.color;
    const chartStrokeWidth = symbolOptions?.strokeWidth || lineProperties.strokeWidth;
    const chartOpacity = symbolOptions?.opacity || lineProperties.opacity;
    
    const fabricPath = new (window as any).fabric.Path(pathData, {
      fill: '',
      stroke: chartColor,
      strokeWidth: chartStrokeWidth,
      opacity: chartOpacity,
      left: 0,  // Will be positioned later to match axis elements
      top: 0,   // Will be positioned later to match axis elements  
      selectable: false,
      hasControls: false,
      hasBorders: false,
      strokeLineCap: 'round',
      strokeLineJoin: 'round',
      elementType: 'chartline',
      symbol: symbolOptions?.symbol || symbol,
      strokeDashArray: lineProperties.strokeDashArray || null
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

    // Skip X-axis labels in createDraggableChartGroup - they will be added by addAxisElements
    // This prevents duplication of X-axis labels

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

    // X-axis labels will be created separately by addAxisElements to prevent duplication

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

    // X-axis labels positioning will be handled by addAxisElements

    // Create draggable chart line as standalone Path (no Group wrapper)
    const chartLine = fabricPath;
    
    // Position the chart line to match the centered axis positioning
    chartLine.set({
      left: chartStartX,    // Match the centered axis positioning
      top: 120,             // Match the axis vertical positioning  
      strokeWidth: lineProperties.strokeWidth,
      stroke: lineProperties.color,
      opacity: lineProperties.opacity,
      visible: true,
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
    fabricCanvasRef.current.add(chartLine);

    // Set up event handlers for chart line selection with position locking
    chartLine.on('selected', () => {
      console.log('Chart line selected');
      setSelectedChartLine(chartLine);
      
      // Lock the position to prevent unwanted movement
      const currentLeft = chartLine.left;
      const currentTop = chartLine.top;
      
      chartLine.on('moving', () => {
        // Allow controlled movement but prevent jumping
        if (Math.abs(chartLine.left - currentLeft) > 200 || Math.abs(chartLine.top - currentTop) > 100) {
          chartLine.set({ left: currentLeft, top: currentTop });
          fabricCanvasRef.current?.renderAll();
        }
      });
      
      // Get current properties from the standalone path element
      const currentProperties = {
        strokeWidth: chartLine.strokeWidth || lineProperties.strokeWidth,
        opacity: chartLine.opacity || lineProperties.opacity,
        smoothness: lineProperties.smoothness,
        color: chartLine.stroke || lineProperties.color,
        visible: chartLine.visible !== false
      };
      
      if (onElementSelect) {
        // Restore properties from the chart line object if they exist
        const storedProperties = chartLine.properties || currentProperties;
        console.log('🔄 Restoring chart line properties:', storedProperties);
        
        // Update local state to match the chart line's stored properties
        if (storedProperties) {
          setLineProperties(storedProperties);
        }
        
        onElementSelect(chartLine, {
          type: 'financial-chart-line',
          symbol,
          timeframe,
          properties: storedProperties,
          updateFunction: (property: string, value: any) => updateChartLineProperties(property, value),
          duplicateFunction: duplicateChartLine,
          deleteFunction: deleteChartLine
        });
      }
    });

    // Set up event handlers for axis text groups with relative positioning
    yAxisGroup.on('selected', () => {
      console.log('Y-axis labels selected');
      if (onElementSelect) {
        onElementSelect(yAxisGroup, {
          type: 'y-axis-labels',
          properties: { 
            fontSize: 11, 
            fill: '#666666', 
            fontFamily: 'Inter, sans-serif', 
            fontWeight: 'normal' 
          },
          updateFunction: (property: string, value: any) => {
            console.log(`Updating Y-axis labels: ${property} = ${value}`);
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

    // X-axis label event handlers will be set up by addAxisElements

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

    // Set up deselection handler - but only clear when other elements are selected
    const handleDeselection = () => {
      // Don't clear selection immediately - let the new selection take precedence
      console.log('handleDeselection called - ignoring to prevent clearing axis text selection');
      // setTimeout(() => {
      //   const activeObject = fabricCanvasRef.current?.getActiveObject();
      //   if (!activeObject || activeObject.type !== 'financial-chart-line') {
      //     setSelectedChartLine(null);
      //     if (onElementSelect) {
      //       onElementSelect(null, null);
      //     }
      //   }
      // }, 10); // Small delay to check if another chart element was selected
    };

    chartLine.on('deselected', () => {
      // Remove movement listeners when deselected
      chartLine.off('moving');
      handleDeselection();
    });
    
    yAxisGroup.on('deselected', handleDeselection);
    yAxisLine.on('deselected', handleDeselection);
    xAxisLine.on('deselected', handleDeselection);

    fabricCanvasRef.current.renderAll();

    // Auto-select the chart line
    fabricCanvasRef.current.setActiveObject(chartLine);
    setSelectedChartLine(chartLine);
  };

  // NEW: In-place path update function to preserve chart line entity
  const updateChartPathInPlace = (chartLineObject: any, properties: any) => {
    console.log('🔄 IN-PLACE PATH UPDATE: Updating chart path without creating new object');
    
    if (!data || data.length === 0) {
      console.log('❌ Cannot update path: no data available');
      return;
    }
    
    // Generate new path with updated properties
    const margin = { top: 120, right: 40, bottom: 80, left: 80 };
    const chartWidth = Math.min(width - margin.left - margin.right, 680);
    const chartHeight = Math.min(height - margin.top - margin.bottom, 280);

    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => new Date(d.timestamp)) as [Date, Date])
      .range([0, chartWidth]);

    const allPrices = data.flatMap(d => [d.high, d.low, d.close, d.open]);
    const yMin = Math.min(...allPrices);
    const yMax = Math.max(...allPrices);
    const yScale = d3.scaleLinear()
      .domain([yMin, yMax])
      .range([chartHeight, 0]);

    // Generate the new path using D3 with updated smoothness
    const smoothness = properties.smoothness || 0.3;
    console.log('🔄 Generating new path with smoothness:', smoothness);
    
    let line;
    if (smoothness <= 0.1) {
      line = d3.line<ChartDataPoint>()
        .x(d => xScale(new Date(d.timestamp)))
        .y(d => yScale(d.close));
    } else {
      line = d3.line<ChartDataPoint>()
        .x(d => xScale(new Date(d.timestamp)))
        .y(d => yScale(d.close))
        .curve(d3.curveMonotoneX);
    }

    const pathData = line(data);
    if (!pathData) {
      console.log('❌ Failed to generate path data');
      return;
    }

    // Update the chart line object's path in-place
    const pathArray = chartLineObject._setPath(pathData);
    
    // Update all properties while preserving the object identity
    chartLineObject.set({
      strokeWidth: properties.strokeWidth || chartLineObject.strokeWidth,
      stroke: properties.color || chartLineObject.stroke,
      opacity: properties.opacity !== undefined ? properties.opacity : chartLineObject.opacity,
      visible: properties.visible !== undefined ? properties.visible : chartLineObject.visible,
      strokeDashArray: properties.strokeDashArray,
      strokeLineCap: properties.strokeLineCap || 'round',
      smoothness: smoothness,
      properties: properties // Store all properties for persistence
    });

    // Force canvas update
    chartLineObject.setCoords();
    fabricCanvasRef.current?.renderAll();
    
    console.log('✅ IN-PLACE PATH UPDATE: Chart line updated successfully');
  };

  const updateChartLineProperties = (property: string, value: any) => {
    console.log('=== PROPERTY UPDATE DEBUG ===');
    console.log('Property:', property, 'Value:', value);
    console.log('Selected chart line:', selectedChartLine);
    console.log('Chart line type:', selectedChartLine?.type);
    console.log('Current lineProperties state:', lineProperties);
    
    // Fallback: try to get chart line from Fabric.js active object if React state is null
    let workingChartLine = selectedChartLine;
    if (!workingChartLine && fabricCanvasRef.current) {
      const activeObject = fabricCanvasRef.current.getActiveObject();
      console.log('Active object from Fabric:', activeObject);
      if (activeObject && activeObject.type === 'financial-chart-line') {
        workingChartLine = activeObject;
        setSelectedChartLine(activeObject); // Update React state
        console.log('🔧 FALLBACK: Using active object as chart line');
      }
    }
    
    if (!workingChartLine || workingChartLine.type !== 'financial-chart-line') {
      console.log('❌ ABORT: No selected chart line or wrong type');
      return;
    }
    
    // Log current chart line properties BEFORE update
    console.log('BEFORE UPDATE - Chart line properties:', {
      strokeWidth: workingChartLine.strokeWidth,
      stroke: workingChartLine.stroke,
      opacity: workingChartLine.opacity,
      visible: workingChartLine.visible,
      fill: workingChartLine.fill
    });

    // Create updated properties object with preserved values
    const newProperties = { 
      ...lineProperties, 
      [property]: value,
      // Ensure marker/junction properties are preserved during updates
      showMarkers: lineProperties.showMarkers ?? false,
      showJunctions: lineProperties.showJunctions ?? false,
      markerStyle: lineProperties.markerStyle ?? 'circle',
      markerSize: lineProperties.markerSize ?? 4,
      markerFrequency: lineProperties.markerFrequency ?? 'all',
      junctionSize: lineProperties.junctionSize ?? 3,
      junctionColor: lineProperties.junctionColor ?? lineProperties.color
    };
    console.log('New properties object:', newProperties);
    
    // Update state for UI consistency
    setLineProperties(newProperties);
    
    // Store properties on the chart line object for persistence
    workingChartLine.set('properties', newProperties);

    // For smoothness or complex properties, use in-place update to preserve entity
    if (property === 'smoothness' || property === 'showMarkers' || property === 'showJunctions') {
      console.log('🔄 COMPLEX PROPERTY: Using in-place update to preserve chart line entity');
      updateChartPathInPlace(workingChartLine, newProperties);
      
      // Trigger save state after in-place update
      if (onCanvasChange) {
        setTimeout(() => {
          console.log('💾 Triggering save state after in-place update');
          onCanvasChange();
        }, 100);
      }
      return;
    }

    // For simple properties, try immediate update
    console.log('🚀 CALLING updateExistingChartLineImmediateWithObject now...');
    const immediateSuccess = updateExistingChartLineImmediateWithObject(workingChartLine, property, value);
    console.log('🚀 immediateSuccess result:', immediateSuccess);
    
    // Log AFTER immediate update attempt
    console.log('AFTER IMMEDIATE UPDATE - Chart line properties:', {
      strokeWidth: workingChartLine.strokeWidth,
      stroke: workingChartLine.stroke,
      opacity: workingChartLine.opacity,
      visible: workingChartLine.visible,
      fill: workingChartLine.fill
    });
    
    if (immediateSuccess) {
      console.log(`✅ IMMEDIATE UPDATE ${property} = ${value}`);
      
      // Trigger save state after successful immediate update
      if (onCanvasChange) {
        setTimeout(() => {
          console.log('💾 Triggering save state after immediate property update');
          onCanvasChange();
        }, 100);
      }
    } else {
      console.log('⚠️ Immediate update failed - using in-place update as fallback');
      updateChartPathInPlace(workingChartLine, newProperties);
      
      if (onCanvasChange) {
        setTimeout(() => {
          console.log('💾 Triggering save state after fallback in-place update');
          onCanvasChange();
        }, 100);
      }
    }
    
    console.log('=== END PROPERTY UPDATE DEBUG ===');
  };

  const updateExistingChartLineImmediateWithObject = (chartLineObject: any, property: string, value: any): boolean => {
    console.log('--- IMMEDIATE UPDATE ATTEMPT ---');
    console.log('Fabric canvas exists:', !!fabricCanvasRef.current);
    console.log('Chart line object exists:', !!chartLineObject);
    
    if (!fabricCanvasRef.current || !chartLineObject) {
      console.log('❌ Missing fabric canvas or chart line object');
      return false;
    }
    
    try {
      console.log(`Applying ${property} = ${value} to chart line...`);
      
      // Log current property value before change
      const beforeValue = chartLineObject[property === 'color' ? 'stroke' : property];
      console.log(`Before: ${property === 'color' ? 'stroke' : property} =`, beforeValue);
      
      // Apply property directly to the chart line object
      switch (property) {
        case 'strokeWidth':
          chartLineObject.set('strokeWidth', value);
          console.log(`Applied strokeWidth: ${value}`);
          break;
        case 'opacity':
          chartLineObject.set('opacity', value);
          console.log(`Applied opacity: ${value}`);
          break;
        case 'visible':
          chartLineObject.set('visible', value);
          break;
        case 'strokeLineCap':
          chartLineObject.set('strokeLineCap', value);
          break;
        case 'color':
          chartLineObject.set('stroke', value);
          console.log(`Applied color/stroke: ${value}`);
          break;
        case 'strokeDashArray':
          chartLineObject.set('strokeDashArray', value);
          console.log(`Applied strokeDashArray: ${value}`);
          break;
        case 'smoothness':
          console.log(`🔄 SMOOTHNESS CHANGE - Old value: ${chartLineObject.smoothness}, New value: ${value}`);
          console.log(`🔄 SMOOTHNESS CHANGE - Chart line strokeWidth before regeneration: ${chartLineObject.strokeWidth}`);
          console.log(`🔄 SMOOTHNESS CHANGE - Chart line opacity before regeneration: ${chartLineObject.opacity}`);
          console.log(`🔄 SMOOTHNESS CHANGE - Chart line stroke before regeneration: ${chartLineObject.stroke}`);
          console.log(`${property} requires regeneration - returning false`);
          return false;
        case 'showMarkers':
        case 'showJunctions':
        case 'markerFrequency':
        case 'markerStyle':
        case 'markerSize':
        case 'junctionSize':
        case 'junctionColor':
          // Force regeneration for complex properties that require chart rebuilding
          console.log(`${property} requires regeneration - returning false`);
          return false;
        default:
          console.log('❌ Unknown property:', property);
          return false;
      }
      
      console.log(`✅ Applied ${property} = ${value} directly to chart line`);
      
      // Log property value after change
      const afterValue = chartLineObject[property === 'color' ? 'stroke' : property];
      console.log(`After: ${property === 'color' ? 'stroke' : property} =`, afterValue);
      
      // Force visual update with multiple approaches
      console.log('Calling setCoords()...');
      chartLineObject.setCoords();
      
      console.log('Setting dirty = true...');
      chartLineObject.dirty = true;
      
      console.log('Calling renderAll()...');
      fabricCanvasRef.current.renderAll();
      
      console.log('Calling requestRenderAll()...');
      fabricCanvasRef.current.requestRenderAll();
      
      // Additional force repaint
      setTimeout(() => {
        console.log('Force repaint renderAll() after timeout...');
        fabricCanvasRef.current?.renderAll();
      }, 0);
      
      // Check if the canvas actually has the object
      const objectsOnCanvas = fabricCanvasRef.current.getObjects();
      const chartLineIndex = objectsOnCanvas.indexOf(chartLineObject);
      console.log('Chart line index on canvas:', chartLineIndex);
      console.log('Total objects on canvas:', objectsOnCanvas.length);
      
      console.log('✅ Immediate update completed successfully');
      return true;
    } catch (error) {
      console.error('❌ Immediate update failed with error:', error);
      return false;
    }
  };

  const renderChartWithProperties = (overrideProperties: any = null) => {
    const currentProperties = overrideProperties || lineProperties;
    console.log('🔄 renderChartWithProperties called with:', currentProperties);
    console.log('🔄 Current smoothness value:', currentProperties.smoothness);
    console.log('🔄 Current showMarkers value:', currentProperties.showMarkers);
    console.log('🔄 Current showJunctions value:', currentProperties.showJunctions);
    console.log('🔄 Current strokeDashArray value:', currentProperties.strokeDashArray);
    
    if (!fabricCanvasRef.current) {
      console.log('❌ ABORT renderChartWithProperties: fabricCanvas does not exist');
      return;
    }
    
    if (data.length === 0) {
      console.log('❌ ABORT renderChartWithProperties: data length is 0, waiting for data...');
      console.log('🔍 CHECKING: Is symbol and timeframe available?', { symbol, timeframe });
      
      // If we have symbol but no data, try to reload it
      if (symbol && timeframe) {
        console.log('🔄 Attempting to reload data for regeneration...');
        loadStockData().then(() => {
          console.log('🔄 Data reloaded, retrying chart regeneration...');
          if (data.length > 0) {
            renderChartWithProperties(overrideProperties);
          }
        });
      }
      return;
    }
    
    console.log('✅ renderChartWithProperties proceeding: fabricCanvas exists, data length:', data.length);
    console.log('🔄 REGENERATION DEBUG - Properties passed to regeneration:');
    console.log('🔄 REGENERATION DEBUG - strokeWidth:', currentProperties.strokeWidth);
    console.log('🔄 REGENERATION DEBUG - opacity:', currentProperties.opacity);
    console.log('🔄 REGENERATION DEBUG - color:', currentProperties.color);
    console.log('🔄 REGENERATION DEBUG - smoothness:', currentProperties.smoothness);
    console.log('🔄 REGENERATION DEBUG - strokeDashArray:', currentProperties.strokeDashArray);
    
    // Remove existing chart elements including markers and junctions
    console.log('🧹 CLEANUP: Starting removal of old chart elements');
    const objects = fabricCanvasRef.current.getObjects();
    console.log('🧹 CLEANUP: Total objects on canvas:', objects.length);
    
    const objectsToRemove = objects.filter((obj: any) => {
      const shouldRemove = obj.type === 'financial-chart-line' || 
                          obj.type === 'x-axis-line' || obj.type === 'y-axis-line' || 
                          obj.type === 'x-axis-labels' || obj.type === 'y-axis-labels' || 
                          obj.type === 'chart-marker' || obj.type === 'chart-junction' ||
                          obj.type === 'y-grid-line' || obj.type === 'x-grid-line' ||
                          obj.type === 'source-attribution';
      if (shouldRemove) {
        console.log('🧹 CLEANUP: Removing object type:', obj.type);
      }
      return shouldRemove;
    });
    
    console.log('🧹 CLEANUP: Removing', objectsToRemove.length, 'chart objects');
    
    // Log each object being removed for debugging
    objectsToRemove.forEach((obj: any, index: number) => {
      console.log(`🧹 CLEANUP: Removing object ${index + 1}/${objectsToRemove.length}: type=${obj.type}, id=${obj.id || 'no-id'}`);
      fabricCanvasRef.current?.remove(obj);
    });
    
    // Force render and clear selection to ensure clean state
    fabricCanvasRef.current.discardActiveObject();
    fabricCanvasRef.current.renderAll();
    
    // Double-check that objects were actually removed
    const remainingObjects = fabricCanvasRef.current.getObjects();
    const remainingChartObjects = remainingObjects.filter((obj: any) => 
      obj.type === 'financial-chart-line' || 
      obj.type === 'chart-marker' || 
      obj.type === 'chart-junction'
    );
    
    console.log('🧹 CLEANUP: Post-cleanup verification:');
    console.log(`🧹 CLEANUP: Total objects after cleanup: ${remainingObjects.length}`);
    console.log(`🧹 CLEANUP: Remaining chart objects: ${remainingChartObjects.length}`);
    
    if (remainingChartObjects.length > 0) {
      console.log('⚠️ WARNING: Some chart objects were not removed, forcing removal...');
      remainingChartObjects.forEach((obj: any) => {
        console.log(`⚠️ Force removing: ${obj.type}`);
        fabricCanvasRef.current?.remove(obj);
      });
      fabricCanvasRef.current.renderAll();
    }
    
    console.log('🧹 CLEANUP: Cleanup complete');
    
    // Use the standard chart creation method that includes all elements
    setTimeout(() => {
      console.log('🔄 Inside setTimeout - starting chart regeneration');
      console.log('🔄 Data length at regeneration start:', data.length);
      
      // Final verification that canvas is clean before regeneration
      console.log('🧹 FINAL VERIFICATION: Checking canvas state before regeneration');
      const preRegenObjects = fabricCanvasRef.current.getObjects();
      const preRegenChartObjects = preRegenObjects.filter((obj: any) => {
        return obj.type === 'financial-chart-line' || 
               obj.type === 'chart-marker' || 
               obj.type === 'chart-junction';
      });
      
      console.log(`🧹 FINAL VERIFICATION: Found ${preRegenChartObjects.length} chart objects before regeneration`);
      
      if (preRegenChartObjects.length > 0) {
        console.log('🚨 CRITICAL: Chart objects still exist! This will cause layer duplication!');
        preRegenChartObjects.forEach((obj: any, index: number) => {
          console.log(`🚨 LEFTOVER OBJECT ${index + 1}: type=${obj.type}, id=${obj.id || 'no-id'}`);
          fabricCanvasRef.current?.remove(obj);
        });
        fabricCanvasRef.current.renderAll();
        console.log('🚨 FORCED REMOVAL: Removed all leftover chart objects');
      }
      
      const svg = d3.select(svgRef.current);
      if (data.length === 0) {
        console.log('❌ ABORT setTimeout: data length is 0');
        return;
      }
      console.log('✅ setTimeout proceeding with data length:', data.length);

      const margin = { top: 120, right: 40, bottom: 80, left: 80 };
      const chartWidth = Math.min(width - margin.left - margin.right, 680);
      const chartHeight = Math.min(height - margin.top - margin.bottom, 280);

      const xScale = d3.scaleTime()
        .domain(d3.extent(data, d => new Date(d.timestamp)) as [Date, Date])
        .range([0, chartWidth]);

      // Enhanced Y-scale for multiple symbols with graceful range accommodation
      const calculateOptimalYScale = (chartData: ChartDataPoint[]) => {
        if (!chartData || chartData.length === 0) {
          return { yMin: 0, yMax: 100, yScale: d3.scaleLinear().domain([0, 100]).range([chartHeight, 0]) };
        }
        
        // Get all price values (high, low, close, open) from the data
        const allPrices = chartData.flatMap(d => [d.high, d.low, d.close, d.open]);
        const rawMin = Math.min(...allPrices);
        const rawMax = Math.max(...allPrices);
        
        // Calculate price range and determine scaling strategy
        const priceRange = rawMax - rawMin;
        const averagePrice = (rawMin + rawMax) / 2;
        
        let yMin, yMax;
        
        // For multiple symbols with very different ranges, use adaptive scaling
        if (symbol.includes(',') || symbol.includes(' ')) {
          // Multiple symbols detected - use percentage-based padding for better visualization
          const paddingPercent = Math.max(0.1, Math.min(0.2, priceRange / averagePrice * 0.1));
          const padding = priceRange * paddingPercent;
          
          yMin = Math.max(0, rawMin - padding);
          yMax = rawMax + padding;
          
          // Ensure minimum visual range for readability
          const minVisualRange = averagePrice * 0.1;
          if ((yMax - yMin) < minVisualRange) {
            const center = (yMax + yMin) / 2;
            yMin = center - minVisualRange / 2;
            yMax = center + minVisualRange / 2;
          }
        } else {
          // Single symbol - use traditional scaling with smart padding
          const paddingPercent = 0.05;
          const padding = priceRange * paddingPercent;
          
          yMin = Math.max(0, rawMin - padding);
          yMax = rawMax + padding;
        }
        
        // Round to nice numbers for cleaner axis labels
        const roundToNiceNumber = (value: number) => {
          const magnitude = Math.pow(10, Math.floor(Math.log10(Math.abs(value))));
          const normalized = value / magnitude;
          let niceNormalized;
          
          if (normalized <= 1) niceNormalized = 1;
          else if (normalized <= 2) niceNormalized = 2;
          else if (normalized <= 5) niceNormalized = 5;
          else niceNormalized = 10;
          
          return niceNormalized * magnitude;
        };
        
        // Apply nice rounding to min/max
        yMin = Math.floor(yMin / roundToNiceNumber(priceRange * 0.1)) * roundToNiceNumber(priceRange * 0.1);
        yMax = Math.ceil(yMax / roundToNiceNumber(priceRange * 0.1)) * roundToNiceNumber(priceRange * 0.1);
        
        const yScale = d3.scaleLinear()
          .domain([yMin, yMax])
          .range([chartHeight, 0]);
        
        console.log(`📊 REGENERATION Y-axis scaling: Symbol(s): ${symbol}, Range: $${yMin.toFixed(2)} - $${yMax.toFixed(2)}, Data points: ${chartData.length}`);
        
        return { yMin, yMax, yScale };
      };
      
      const { yMin, yMax, yScale } = calculateOptimalYScale(data);

      // Apply smoothness to curve interpolation instead of data filtering
      const getCurveType = (smoothness: number) => {
        console.log('🎯 REGENERATION - getCurveType called with smoothness:', smoothness);
        let curve;
        
        if (smoothness <= 0.1) {
          // Step interpolation for very precise financial data
          curve = d3.curveStepAfter;
          console.log('📊 REGENERATION - Using step-after curve for precise data points');
        } else if (smoothness <= 0.3) {
          // Monotone interpolation - prevents overshooting, ideal for financial data
          curve = d3.curveMonotoneX;
          console.log('📈 REGENERATION - Using monotone-X curve for clean financial lines');
        } else if (smoothness <= 0.5) {
          // Natural spline - smooth but respects data trends
          curve = d3.curveNatural;
          console.log('🌿 REGENERATION - Using natural spline curve for balanced smoothness');
        } else if (smoothness <= 0.7) {
          // Cardinal spline with financial-optimized tension
          curve = d3.curveCardinal.tension(0.3);
          console.log('📈 REGENERATION - Using cardinal curve with optimized tension');
        } else if (smoothness <= 0.85) {
          // Catmull-Rom with moderate alpha for trend visualization
          curve = d3.curveCatmullRom.alpha(0.5);
          console.log('🌊 REGENERATION - Using catmull-rom curve with balanced alpha');
        } else {
          // Basis spline for maximum smoothness in trend analysis
          curve = d3.curveBasis;
          console.log('🌊 REGENERATION - Using basis spline for maximum trend smoothness');
        }
        return curve;
      };

      const line = d3.line<ChartDataPoint>()
        .x(d => xScale(new Date(d.timestamp)))
        .y(d => yScale(d.close))
        .curve(getCurveType(currentProperties.smoothness));

      const pathData = line(data) || '';
      console.log('📊 REGENERATION - Generated path data with smoothness:', currentProperties.smoothness, 'Path length:', pathData.length);

      // Create draggable chart group with all elements and updated properties
      console.log('🔄 Calling createDraggableChartGroupWithProperties with properties:', currentProperties);
      console.log('🔄 MARKERS DEBUG: showMarkers =', currentProperties.showMarkers, 'showJunctions =', currentProperties.showJunctions);
      createDraggableChartGroupWithProperties(pathData, margin, xScale, yScale, chartWidth, chartHeight, currentProperties, yMin, yMax);
    }, 10);
  };

  const createDraggableChartGroupWithProperties = (
    pathData: string,
    margin: any,
    xScale: any,
    yScale: any,
    chartWidth: number,
    chartHeight: number,
    properties: any,
    yMin: number,
    yMax: number
  ) => {
    
    // Create chart elements with passed properties
    const fabricPath = new (window as any).fabric.Path(pathData, {
      fill: '',
      strokeWidth: properties.strokeWidth,
      stroke: properties.color,
      opacity: properties.opacity,
      visible: properties.visible !== false,
      selectable: true,
      hasControls: true,
      hasBorders: true,
      type: 'financial-chart-line',
      symbol,
      timeframe,
      properties,
      strokeDashArray: properties.strokeDashArray || null,
      strokeLineCap: properties.strokeLineCap || 'round'
    });

    // Add to canvas and set up selection
    const chartStartX = (width - chartWidth) / 2 + margin.left - 80;
    const chartStartY = 120;
    
    fabricPath.set({
      left: chartStartX,
      top: chartStartY
    });
    
    // Store smoothness and other custom properties on the fabric object for proper serialization
    fabricPath.set({
      smoothness: properties.smoothness,
      strokeDashArray: properties.strokeDashArray,
      strokeLineCap: properties.strokeLineCap || 'round',
      // Store all properties for undo/redo functionality
      properties: properties
    });
    
    // Add chart line to canvas first
    fabricCanvasRef.current.add(fabricPath);
    
    // Trigger save state after chart is added to canvas
    console.log('💾 Chart line added - triggering save state');
    if (onCanvasChange) {
      setTimeout(() => onCanvasChange(), 50);
    }
    
    // Add markers at data points if enabled
    if (properties.showMarkers) {
      console.log('🔴 Adding markers to chart line...', {
        showMarkers: properties.showMarkers,
        markerStyle: properties.markerStyle,
        markerSize: properties.markerSize,
        markerFrequency: properties.markerFrequency,
        dataLength: data.length
      });
      
      data.forEach((dataPoint, index) => {
        // Skip some points based on frequency setting
        const frequency = properties.markerFrequency || 'all';
        if (frequency === 'every-5' && index % 5 !== 0) return;
        if (frequency === 'every-10' && index % 10 !== 0) return;
        if (frequency === 'every-20' && index % 20 !== 0) return;
        
        const x = chartStartX + xScale(new Date(dataPoint.timestamp));
        const y = chartStartY + yScale(dataPoint.close);
        
        const markerStyle = properties.markerStyle || 'circle';
        const markerSize = properties.markerSize || 8; // Larger default size
        
        let marker;
        if (markerStyle === 'circle') {
          marker = new (window as any).fabric.Circle({
            left: x - markerSize/2,
            top: y - markerSize/2,
            radius: markerSize/2,
            fill: properties.color,
            stroke: '#ffffff',
            strokeWidth: 2,
            selectable: false,
            evented: false,
            type: 'chart-marker'
          });
        } else if (markerStyle === 'square') {
          marker = new (window as any).fabric.Rect({
            left: x - markerSize/2,
            top: y - markerSize/2,
            width: markerSize,
            height: markerSize,
            fill: properties.color,
            stroke: '#ffffff',
            strokeWidth: 2,
            selectable: false,
            evented: false,
            type: 'chart-marker'
          });
        } else if (markerStyle === 'diamond') {
          // Create diamond shape using polygon
          const points = [
            { x: 0, y: -markerSize/2 },
            { x: markerSize/2, y: 0 },
            { x: 0, y: markerSize/2 },
            { x: -markerSize/2, y: 0 }
          ];
          marker = new (window as any).fabric.Polygon(points, {
            left: x,
            top: y,
            fill: properties.color,
            stroke: '#ffffff',
            strokeWidth: 2,
            selectable: false,
            evented: false,
            type: 'chart-marker'
          });
        }
        
        if (marker) {
          fabricCanvasRef.current?.add(marker);
          console.log(`🔴 Added ${markerStyle} marker at (${x.toFixed(1)}, ${y.toFixed(1)}) size=${markerSize}`);
        }
      });
      
      console.log('🔴 Finished adding', data.length, 'markers');
    }
    
    // Add junction points if enabled
    if (properties.showJunctions) {
      console.log('🟡 Adding junction points...', {
        showJunctions: properties.showJunctions,
        junctionSize: properties.junctionSize,
        junctionColor: properties.junctionColor
      });
      
      // Add junctions every 10 data points for key trend points
      data.forEach((dataPoint, index) => {
        if (index % 10 === 0) { // Show every 10th point as junction
          const x = chartStartX + xScale(new Date(dataPoint.timestamp));
          const y = chartStartY + yScale(dataPoint.close);
          
          const junctionSize = properties.junctionSize || 5;
          const junctionColor = properties.junctionColor || properties.color;
          
          const junction = new (window as any).fabric.Circle({
            left: x - junctionSize/2,
            top: y - junctionSize/2,
            radius: junctionSize/2,
            fill: junctionColor,
            stroke: '#000000',
            strokeWidth: 1,
            selectable: false,
            evented: false,
            type: 'chart-junction'
          });
          
          fabricCanvasRef.current?.add(junction);
          console.log(`🟡 Added junction at (${x.toFixed(1)}, ${y.toFixed(1)}) size=${junctionSize}`);
        }
      });
      
      console.log('🟡 Finished adding junction points');
    }

    // Enhanced axis ticks generation for better readability
    const generateOptimalTicks = (yMin: number, yMax: number, tickCount: number = 6) => {
      const range = yMax - yMin;
      const roughStep = range / (tickCount - 1);
      
      // Calculate nice step size
      const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
      const normalizedStep = roughStep / magnitude;
      
      let niceStep;
      if (normalizedStep <= 1) niceStep = 1;
      else if (normalizedStep <= 2) niceStep = 2;
      else if (normalizedStep <= 5) niceStep = 5;
      else niceStep = 10;
      
      const stepSize = niceStep * magnitude;
      
      // Generate ticks
      const ticks = [];
      let tickValue = Math.ceil(yMin / stepSize) * stepSize;
      
      while (tickValue <= yMax && ticks.length < 8) {
        ticks.push(tickValue);
        tickValue += stepSize;
      }
      
      return ticks.length > 0 ? ticks : [yMin, yMax];
    };
    
    const yTicks = generateOptimalTicks(yMin, yMax, 6);
    const xTicks = xScale.ticks(5);

    // Enhanced Y-axis price labels with smart formatting
    const formatPrice = (price: number, range: number) => {
      // Smart price formatting based on range and value
      if (price >= 1000) {
        return `$${(price / 1000).toFixed(1)}K`;
      } else if (range > 50) {
        return `$${price.toFixed(0)}`;
      } else if (range > 5) {
        return `$${price.toFixed(1)}`;
      } else {
        return `$${price.toFixed(2)}`;
      }
    };
    
    const priceRange = yMax - yMin;
    const yAxisLabels = yTicks.map((price: number, index: number) => new (window as any).fabric.Text(
      formatPrice(price, priceRange), {
        left: chartStartX - 80, // Move further left to avoid overlap
        top: 120 + yScale(price) - 8,
        fontSize: 11,
        fontFamily: 'Inter, sans-serif',
        fill: '#666666',
        selectable: true,
        hasControls: false,
        hasBorders: true,
        type: 'y-axis-label',
        evented: true // Ensure events are enabled
      }
    ));

    // X-axis date labels (bottom)
    const xAxisLabels = xTicks.map((date: Date, index: number) => new (window as any).fabric.Text(
      date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }), {
        left: chartStartX + xScale(date) - 20,
        top: 120 + chartHeight + 15,
        fontSize: 11,
        fontFamily: 'Inter, sans-serif',
        fill: '#666666',
        selectable: true,
        hasControls: false,
        hasBorders: true,
        type: 'x-axis-label'
      }
    ));

    // Create axis lines
    const yAxisLine = new (window as any).fabric.Line([chartStartX - 5, 120, chartStartX - 5, 120 + chartHeight], {
      stroke: '#666666',
      strokeWidth: 1,
      selectable: true,
      hasControls: false,
      hasBorders: true,
      type: 'y-axis-line'
    });

    const xAxisLine = new (window as any).fabric.Line([chartStartX, 120 + chartHeight + 5, chartStartX + chartWidth, 120 + chartHeight + 5], {
      stroke: '#666666',
      strokeWidth: 1,
      selectable: true,
      hasControls: false,
      hasBorders: true,
      type: 'x-axis-line'
    });

    // Create grouped elements
    const yAxisGroup = new (window as any).fabric.Group(yAxisLabels, {
      selectable: true,
      hasControls: false,
      hasBorders: true,
      type: 'y-axis-labels',
      evented: true // Ensure events are enabled
    });

    const xAxisGroup = new (window as any).fabric.Group(xAxisLabels, {
      selectable: true,
      hasControls: false,
      hasBorders: true,
      type: 'x-axis-labels'
    });

    // Create point markers if enabled
    const markers: any[] = [];
    console.log('🔴 MARKER DEBUG - All properties:', properties);
    console.log('🔴 Checking showMarkers:', properties.showMarkers, 'typeof:', typeof properties.showMarkers);
    console.log('🔴 Checking showMarkers === true:', properties.showMarkers === true);
    console.log('🔴 Checking showMarkers !== false:', properties.showMarkers !== false);
    if (properties.showMarkers === true) {
      console.log('🔴 Creating point markers with properties:', properties);
      
      const getMarkerFrequencyStep = (frequency: string) => {
        switch (frequency) {
          case 'every-2': return 2;
          case 'every-5': return 5;
          case 'every-10': return 10;
          case 'endpoints': return data.length - 1;
          default: return 1; // 'all'
        }
      };
      
      const step = getMarkerFrequencyStep(properties.markerFrequency || 'all');
      const markerSize = properties.markerSize || 4;
      const markerStyle = properties.markerStyle || 'circle';
      
      data.forEach((point, index) => {
        const shouldShowMarker = step === 1 || 
          index % step === 0 || 
          (properties.markerFrequency === 'endpoints' && (index === 0 || index === data.length - 1));
          
        if (shouldShowMarker) {
          const x = chartStartX + xScale(new Date(point.timestamp));
          const y = 120 + yScale(point.close);
          
          let marker;
          switch (markerStyle) {
            case 'square':
              marker = new (window as any).fabric.Rect({
                left: x - markerSize / 2,
                top: y - markerSize / 2,
                width: markerSize,
                height: markerSize,
                fill: properties.color,
                stroke: properties.color,
                strokeWidth: 1
              });
              break;
            case 'diamond':
              marker = new (window as any).fabric.Polygon([
                { x: 0, y: -markerSize / 2 },
                { x: markerSize / 2, y: 0 },
                { x: 0, y: markerSize / 2 },
                { x: -markerSize / 2, y: 0 }
              ], {
                left: x,
                top: y,
                fill: properties.color,
                stroke: properties.color,
                strokeWidth: 1
              });
              break;
            case 'triangle':
              marker = new (window as any).fabric.Triangle({
                left: x - markerSize / 2,
                top: y - markerSize / 2,
                width: markerSize,
                height: markerSize,
                fill: properties.color,
                stroke: properties.color,
                strokeWidth: 1
              });
              break;
            case 'cross':
              const crossPath = `M ${-markerSize/2} 0 L ${markerSize/2} 0 M 0 ${-markerSize/2} L 0 ${markerSize/2}`;
              marker = new (window as any).fabric.Path(crossPath, {
                left: x,
                top: y,
                stroke: properties.color,
                strokeWidth: 2,
                fill: ''
              });
              break;
            case 'plus':
              const plusPath = `M ${-markerSize/2} 0 L ${markerSize/2} 0 M 0 ${-markerSize/2} L 0 ${markerSize/2}`;
              marker = new (window as any).fabric.Path(plusPath, {
                left: x,
                top: y,
                stroke: properties.color,
                strokeWidth: 1,
                fill: ''
              });
              break;
            default: // circle
              marker = new (window as any).fabric.Circle({
                left: x - markerSize / 2,
                top: y - markerSize / 2,
                radius: markerSize / 2,
                fill: properties.color,
                stroke: properties.color,
                strokeWidth: 1
              });
          }
          
          marker.set({
            selectable: false,
            evented: false,
            type: 'chart-marker'
          });
          
          markers.push(marker);
        }
      });
    }
    
    // Create junction dots if enabled
    const junctions: any[] = [];
    console.log('🟡 JUNCTION DEBUG - All properties:', properties);
    console.log('🟡 Checking showJunctions:', properties.showJunctions, 'typeof:', typeof properties.showJunctions);
    console.log('🟡 Checking showJunctions === true:', properties.showJunctions === true);
    console.log('🟡 Checking showJunctions !== false:', properties.showJunctions !== false);
    if (properties.showJunctions === true) {
      console.log('🟡 Creating junction dots with properties:', properties);
      
      const junctionSize = properties.junctionSize || 3;
      const junctionColor = properties.junctionColor || properties.color;
      
      // Add junction dots at key points (every 10th point for performance)
      data.forEach((point, index) => {
        if (index % 10 === 0 || index === data.length - 1) {
          const x = chartStartX + xScale(new Date(point.timestamp));
          const y = 120 + yScale(point.close);
          
          const junction = new (window as any).fabric.Circle({
            left: x - junctionSize / 2,
            top: y - junctionSize / 2,
            radius: junctionSize / 2,
            fill: junctionColor,
            stroke: junctionColor,
            strokeWidth: 1,
            selectable: false,
            evented: false,
            type: 'chart-junction'
          });
          
          junctions.push(junction);
        }
      });
    }

    // Set up event handlers for Y-axis line
    yAxisLine.on('selected', () => {
      console.log('Y-axis line selected');
      if (onElementSelect) {
        onElementSelect(yAxisLine, {
          type: 'y-axis-line',
          properties: { 
            strokeWidth: yAxisLine.strokeWidth || 1, 
            stroke: yAxisLine.stroke || '#666666',
            strokeDashArray: yAxisLine.strokeDashArray || null,
            opacity: yAxisLine.opacity || 1,
            visible: yAxisLine.visible !== false
          },
          updateFunction: (property: string, value: any) => {
            console.log(`Updating Y-axis line: ${property} = ${value}`);
            yAxisLine.set(property, value);
            fabricCanvasRef.current?.renderAll();
            if (onCanvasChange) onCanvasChange();
            console.log(`Updated ${property} to ${value} for Y-axis line`);
          }
        });
      }
    });

    // Set up event handlers for X-axis line
    xAxisLine.on('selected', () => {
      console.log('X-axis line selected');
      if (onElementSelect) {
        onElementSelect(xAxisLine, {
          type: 'x-axis-line',
          properties: { 
            strokeWidth: xAxisLine.strokeWidth || 1, 
            stroke: xAxisLine.stroke || '#666666',
            strokeDashArray: xAxisLine.strokeDashArray || null,
            opacity: xAxisLine.opacity || 1,
            visible: xAxisLine.visible !== false
          },
          updateFunction: (property: string, value: any) => {
            console.log(`Updating X-axis line: ${property} = ${value}`);
            xAxisLine.set(property, value);
            fabricCanvasRef.current?.renderAll();
            if (onCanvasChange) onCanvasChange();
            console.log(`Updated ${property} to ${value} for X-axis line`);
          }
        });
      }
    });

    // Add all elements to canvas for independent selection
    fabricCanvasRef.current.add(yAxisLine);
    fabricCanvasRef.current.add(xAxisLine);
    fabricCanvasRef.current.add(yAxisGroup);
    fabricCanvasRef.current.add(xAxisGroup);
    fabricCanvasRef.current.add(fabricPath);
    
    // Add markers and junctions
    markers.forEach(marker => fabricCanvasRef.current.add(marker));
    junctions.forEach(junction => fabricCanvasRef.current.add(junction));

    // Set up event handlers for Y-axis labels
    yAxisGroup.on('selected', () => {
      console.log('Y-axis labels selected (properties-based)');
      if (onElementSelect) {
        onElementSelect(yAxisGroup, {
          type: 'y-axis-labels',
          properties: { 
            fontSize: yAxisLabels[0]?.fontSize || 11, 
            fill: yAxisLabels[0]?.fill || '#666666', 
            fontFamily: yAxisLabels[0]?.fontFamily || 'Inter, sans-serif', 
            fontWeight: yAxisLabels[0]?.fontWeight || 'normal',
            visible: yAxisGroup.visible !== false
          },
          updateFunction: (property: string, value: any) => {
            console.log(`Updating Y-axis labels: ${property} = ${value}`);
            const objects = yAxisGroup.getObjects();
            objects.forEach((obj: any) => {
              if (property === 'fontSize') obj.set('fontSize', value);
              if (property === 'fill') obj.set('fill', value);
              if (property === 'fontFamily') obj.set('fontFamily', value);
              if (property === 'fontWeight') obj.set('fontWeight', value);
              if (property === 'visible') obj.set('visible', value);
            });
            if (property === 'visible') yAxisGroup.set('visible', value);
            yAxisGroup.addWithUpdate();
            fabricCanvasRef.current?.renderAll();
            if (onCanvasChange) onCanvasChange();
            console.log(`Updated ${property} to ${value} for element:`, 'y-axis-labels');
          }
        });
      }
    });

    // Set up event handlers for X-axis labels
    xAxisGroup.on('selected', () => {
      console.log('X-axis labels selected (properties-based)');
      if (onElementSelect) {
        onElementSelect(xAxisGroup, {
          type: 'x-axis-labels',
          properties: { 
            fontSize: xAxisLabels[0]?.fontSize || 11, 
            fill: xAxisLabels[0]?.fill || '#666666', 
            fontFamily: xAxisLabels[0]?.fontFamily || 'Inter, sans-serif', 
            fontWeight: xAxisLabels[0]?.fontWeight || 'normal',
            visible: xAxisGroup.visible !== false
          },
          updateFunction: (property: string, value: any) => {
            console.log(`Updating X-axis labels: ${property} = ${value}`);
            const objects = xAxisGroup.getObjects();
            objects.forEach((obj: any) => {
              if (property === 'fontSize') obj.set('fontSize', value);
              if (property === 'fill') obj.set('fill', value);
              if (property === 'fontFamily') obj.set('fontFamily', value);
              if (property === 'fontWeight') obj.set('fontWeight', value);
              if (property === 'visible') obj.set('visible', value);
            });
            if (property === 'visible') xAxisGroup.set('visible', value);
            xAxisGroup.addWithUpdate();
            fabricCanvasRef.current?.renderAll();
            if (onCanvasChange) onCanvasChange();
            console.log(`Updated ${property} to ${value} for element:`, 'x-axis-labels');
          }
        });
      }
    });

    // Set up event handlers for chart line selection
    fabricPath.on('selected', () => {
      console.log('Chart line selected');
      setSelectedChartLine(fabricPath);
      
      if (onElementSelect) {
        // Restore properties from the chart line object if they exist
        const storedProperties = fabricPath.properties || properties;
        console.log('🔄 Restoring newly created chart line properties:', storedProperties);
        
        // Update local state to match the chart line's stored properties
        if (storedProperties) {
          setLineProperties(storedProperties);
        }
        
        onElementSelect(fabricPath, {
          type: 'financial-chart-line',
          symbol,
          timeframe,
          properties: storedProperties,
          updateFunction: (property: string, value: any) => updateChartLineProperties(property, value),
          duplicateFunction: duplicateChartLine,
          deleteFunction: deleteChartLine
        });
      }
    });

    // Auto-select the chart line and render canvas
    fabricCanvasRef.current.setActiveObject(fabricPath);
    setSelectedChartLine(fabricPath);
    fabricCanvasRef.current.renderAll();
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
      {/* Annotation Controls */}
      <Card className="mb-4 p-4">
        <div className="flex gap-4 items-center flex-wrap">
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
      <div className="flex justify-center">
        <div className="relative border border-gray-200 rounded-lg overflow-hidden bg-white" style={{ width: `${width}px`, height: `${height}px` }}>
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
    </div>
  );
}