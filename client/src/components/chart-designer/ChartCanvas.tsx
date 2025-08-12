import { useEffect, useRef, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useChartDesigner } from '@/hooks/useChartDesigner';
import { useChartData } from '@/hooks/useChartData';
import { cn } from '@/lib/utils';
import * as d3 from 'd3';
declare global {
  const fabric: any;
}

export function ChartCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<any>(null);
  const [canvasMode, setCanvasMode] = useState<'default' | 'interactive' | 'dragging'>('default');
  
  const { 
    config, 
    updateConfig, 
    addElement,
    selectElement,
    updateElement,
    setCanvasInstance 
  } = useChartDesigner();
  
  const { data } = useChartData(config.symbol, config.period);

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (canvasRef.current && !fabricCanvas) {
      console.log('Initializing Fabric.js canvas');
      try {
        const canvas = new fabric.Canvas(canvasRef.current, {
          width: 800,
          height: 450,
          backgroundColor: 'transparent',
          selection: true,
          preserveObjectStacking: true,
        });
        
        console.log('Fabric canvas created:', canvas);

      canvas.on('selection:created', (e: any) => {
        console.log('Selection created:', e.target);
        const activeObject = e.target;
        if (activeObject && activeObject.chartElementId) {
          const element = config.elements.find(el => el.id === activeObject.chartElementId);
          if (element) {
            selectElement(element);
          }
        }
        setCanvasMode('interactive');
      });

      canvas.on('selection:cleared', () => {
        selectElement(null);
        setCanvasMode('default');
      });

      canvas.on('object:moving', (e: any) => {
        const activeObject = e.target;
        if (activeObject && activeObject.chartElementId) {
          updateElement(activeObject.chartElementId, {
            x: activeObject.left,
            y: activeObject.top,
          });
        }
        setCanvasMode('dragging');
      });

      canvas.on('object:modified', () => {
        setCanvasMode('interactive');
      });

      canvas.on('mouse:over', (e: any) => {
        console.log('Mouse over:', e.target);
        if (e.target && e.target.chartElementId) {
          setCanvasMode('interactive');
          canvas.defaultCursor = 'move';
        }
      });

      canvas.on('mouse:out', (e: any) => {
        console.log('Mouse out:', e.target);
        if (e.target && e.target.chartElementId) {
          if (!canvas.getActiveObject()) {
            setCanvasMode('default');
            canvas.defaultCursor = 'crosshair';
          }
        }
      });
      
      canvas.on('mouse:move', (e: any) => {
        if (e.target) {
          console.log('Mouse move over element');
        }
      });

      // Set initial cursor
      canvas.defaultCursor = 'crosshair';
      canvas.hoverCursor = 'move';
      canvas.moveCursor = 'grabbing';
      canvas.freeDrawingCursor = 'crosshair';

        setFabricCanvas(canvas);
        setCanvasInstance(canvas);

        // Add a test element to verify drag and drop
        const testText = new fabric.Text('Click & Drag Me!', {
          left: 100,
          top: 100,
          fontSize: 20,
          fill: '#ff6b6b',
          selectable: true,
          editable: false,
        });
        testText.chartElementId = 'test-element';
        canvas.add(testText);
        
        console.log('Added test element to canvas');

        return () => {
          if (canvas) {
            canvas.dispose();
          }
        };
      } catch (error) {
        console.error('Failed to initialize Fabric.js canvas:', error);
      }
    }
  }, []);

  // Draw D3.js chart
  useEffect(() => {
    if (!svgRef.current || !data) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = 700 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(data.data, d => new Date(d.date)) as [Date, Date])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(data.data, d => d.price) as [number, number])
      .nice()
      .range([height, 0]);

    // Grid lines
    if (config.gridLines.style !== 'none') {
      const gridOpacity = config.gridLines.opacity / 100;
      
      g.selectAll('.grid-line-x')
        .data(xScale.ticks())
        .enter()
        .append('line')
        .attr('class', 'grid-line-x')
        .attr('x1', d => xScale(d))
        .attr('x2', d => xScale(d))
        .attr('y1', 0)
        .attr('y2', height)
        .attr('stroke', config.gridLines.color)
        .attr('stroke-width', 1)
        .attr('stroke-opacity', gridOpacity)
        .attr('stroke-dasharray', getStrokeDashArray(config.gridLines.style));

      g.selectAll('.grid-line-y')
        .data(yScale.ticks())
        .enter()
        .append('line')
        .attr('class', 'grid-line-y')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', d => yScale(d))
        .attr('y2', d => yScale(d))
        .attr('stroke', config.gridLines.color)
        .attr('stroke-width', 1)
        .attr('stroke-opacity', gridOpacity)
        .attr('stroke-dasharray', getStrokeDashArray(config.gridLines.style));
    }

    // Line
    const line = d3.line<any>()
      .x(d => xScale(new Date(d.date)))
      .y(d => yScale(d.price))
      .curve(getCurveType(config.curveStyle));

    g.append('path')
      .datum(data.data)
      .attr('fill', 'none')
      .attr('stroke', '#0066CC')
      .attr('stroke-width', config.lineThickness)
      .attr('stroke-dasharray', getStrokeDashArray(config.lineStyle))
      .attr('stroke-linecap', config.lineCap)
      .attr('d', line);

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%b') as any));

    g.append('g')
      .call(d3.axisLeft(yScale).tickFormat(getNumberFormat(config.yAxisFormat) as any));

    // Axis labels
    if (config.xAxisLabel) {
      svg.append('text')
        .attr('x', width / 2 + margin.left)
        .attr('y', height + margin.top + margin.bottom - 5)
        .attr('text-anchor', 'middle')
        .style('font-family', config.axisLabels.font)
        .style('font-size', `${config.axisLabels.size}px`)
        .style('font-weight', config.axisLabels.weight)
        .style('fill', config.axisLabels.color)
        .text(config.xAxisLabel);
    }

    if (config.yAxisLabel) {
      svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 15)
        .attr('x', -(height / 2 + margin.top))
        .attr('text-anchor', 'middle')
        .style('font-family', config.axisLabels.font)
        .style('font-size', `${config.axisLabels.size}px`)
        .style('font-weight', config.axisLabels.weight)
        .style('fill', config.axisLabels.color)
        .text(config.yAxisLabel);
    }

  }, [data, config]);

  // Update canvas elements when elements change
  useEffect(() => {
    if (!fabricCanvas) return;

    console.log('Updating canvas elements:', config.elements);

    // Clear existing elements that are chart elements
    const objects = fabricCanvas.getObjects();
    objects.forEach((obj: any) => {
      if (obj.chartElementId) {
        fabricCanvas.remove(obj);
      }
    });

    // Add new elements
    config.elements.forEach(element => {
      console.log('Adding element:', element);
      let fabricObject: any;

      switch (element.type) {
        case 'title':
          fabricObject = new fabric.Text(element.content, {
            left: element.x,
            top: element.y,
            fontSize: element.style.fontSize || 24,
            fontWeight: element.style.fontWeight || 'normal',
            fontFamily: element.style.fontFamily || 'Arial',
            fill: element.style.color || '#000000',
            selectable: true,
            editable: false,
          });
          break;
        
        case 'annotation':
          fabricObject = new fabric.Rect({
            left: element.x,
            top: element.y,
            width: 120,
            height: 30,
            fill: element.style.backgroundColor,
            rx: 4,
            ry: 4,
          });
          
          const annotationText = new fabric.Text(element.content, {
            left: element.x + 10,
            top: element.y + 8,
            fontSize: element.style.fontSize,
            fontWeight: element.style.fontWeight,
            fontFamily: element.style.fontFamily,
            fill: element.style.color,
          });
          
          fabricObject = new fabric.Group([fabricObject, annotationText], {
            left: element.x,
            top: element.y,
            selectable: true,
          });
          break;
          
        case 'badge':
          fabricObject = new fabric.Circle({
            left: element.x,
            top: element.y,
            radius: 25,
            fill: element.style.backgroundColor,
          });
          
          const badgeText = new fabric.Text(element.content, {
            left: element.x,
            top: element.y,
            fontSize: element.style.fontSize,
            fontWeight: element.style.fontWeight,
            fontFamily: element.style.fontFamily,
            fill: element.style.color,
            textAlign: 'center',
            originX: 'center',
            originY: 'center',
          });
          
          fabricObject = new fabric.Group([fabricObject, badgeText], {
            left: element.x,
            top: element.y,
            selectable: true,
          });
          break;
          
        default:
          fabricObject = new fabric.Text(element.content || 'Text', {
            left: element.x,
            top: element.y,
            fontSize: element.style.fontSize || 16,
            fontWeight: element.style.fontWeight || 'normal',
            fontFamily: element.style.fontFamily || 'Arial',
            fill: element.style.color || '#000000',
            selectable: true,
            editable: false,
          });
      }

      if (fabricObject) {
        fabricObject.chartElementId = element.id;
        fabricObject.selectable = true;
        fabricObject.moveCursor = 'move';
        fabricObject.hoverCursor = 'move';
        fabricCanvas.add(fabricObject);
      }
    });

    fabricCanvas.renderAll();
  }, [config.elements, fabricCanvas]);

  const handleShowGridChange = (checked: boolean) => {
    updateConfig({ showGrid: checked });
  };

  const handleSnapToGridChange = (checked: boolean) => {
    updateConfig({ snapToGrid: checked });
  };

  const handleZoomChange = (value: string) => {
    updateConfig({ zoom: parseInt(value) });
  };

  return (
    <div className="flex-1 bg-gray-100 flex flex-col">
      <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900">Chart Canvas</h2>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={config.showGrid}
                onCheckedChange={handleShowGridChange}
                data-testid="checkbox-show-grid"
              />
              <Label className="text-sm text-gray-600">Show Grid</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={config.snapToGrid}
                onCheckedChange={handleSnapToGridChange}
                data-testid="checkbox-snap-to-grid"
              />
              <Label className="text-sm text-gray-600">Snap to Grid</Label>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={config.zoom.toString()} onValueChange={handleZoomChange}>
            <SelectTrigger className="w-20 text-sm" data-testid="select-zoom">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="100">100%</SelectItem>
              <SelectItem value="75">75%</SelectItem>
              <SelectItem value="50">50%</SelectItem>
              <SelectItem value="25">Fit</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex-1 p-6 overflow-auto">
        <div 
          ref={containerRef}
          className="mx-auto bg-white rounded-lg shadow-lg relative"
          style={{ width: 800, height: 450 }}
        >
          <div className={cn(
            "absolute inset-0 rounded-lg overflow-hidden",
            config.showGrid ? "canvas-grid" : ""
          )}>
            {/* D3.js Chart SVG */}
            <svg
              ref={svgRef}
              width="700"
              height="340"
              className="absolute top-8 left-8"
              style={{ zIndex: 1 }}
            />
            
            {/* Chart Title */}
            <div 
              className="absolute top-4 left-1/2 transform -translate-x-1/2"
              style={{ zIndex: 10 }}
            >
              <h1 
                className="text-gray-900 text-center"
                style={{
                  fontSize: `${config.title.size}px`,
                  fontWeight: config.title.weight,
                  fontFamily: config.title.font,
                  color: config.title.color,
                  lineHeight: config.title.lineHeight,
                  letterSpacing: `${config.title.letterSpacing}em`,
                }}
                data-testid="chart-title"
              >
                {config.title.text}
              </h1>
            </div>
            
            {/* Fabric.js Canvas for interactive elements */}
            <canvas
              ref={canvasRef}
              className={cn(
                "absolute inset-0",
                canvasMode === 'default' && 'canvas-default',
                canvasMode === 'interactive' && 'canvas-interactive',
                canvasMode === 'dragging' && 'canvas-interactive'
              )}
              style={{ zIndex: 5 }}
              data-testid="fabric-canvas"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function getStrokeDashArray(style: string): string {
  switch (style) {
    case 'dashed': return '8,4';
    case 'dotted': return '2,2';
    case 'dashDot': return '8,4,2,4';
    case 'longDash': return '16,8';
    default: return 'none';
  }
}

function getCurveType(style: string): any {
  switch (style) {
    case 'smooth': return d3.curveCardinal;
    case 'step': return d3.curveStepAfter;
    case 'basis': return d3.curveBasis;
    case 'monotone': return d3.curveMonotoneX;
    default: return d3.curveLinear;
  }
}

function getNumberFormat(format: string): (n: number) => string {
  switch (format) {
    case 'currency': return d3.format('$,.0f');
    case 'percentage': return d3.format('.1%');
    case 'decimal': return d3.format(',.2f');
    case 'integer': return d3.format(',d');
    case 'scientific': return d3.format('.2e');
    default: return d3.format(',.0f');
  }
}
