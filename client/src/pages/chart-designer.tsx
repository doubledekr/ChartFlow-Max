import { useState, useRef } from 'react';
import { Undo, Redo, Save, Download, TrendingUp, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataSourcePanel } from '@/components/chart-designer/DataSourcePanel';
import { ColorPalettePanel } from '@/components/chart-designer/ColorPalettePanel';
import { GradientEffectsPanel } from '@/components/chart-designer/GradientEffectsPanel';
import { LineStylingPanel } from '@/components/chart-designer/LineStylingPanel';
import { TypographyPanel } from '@/components/chart-designer/TypographyPanel';
import { AxisFormattingPanel } from '@/components/chart-designer/AxisFormattingPanel';
import { ElementLibraryPanel } from '@/components/chart-designer/ElementLibraryPanel';
import { LogoPanel } from '@/components/chart-designer/LogoPanel';

import { LayerManagerPanel } from '@/components/chart-designer/LayerManagerPanel';
import { FinancialChartCanvas } from '@/components/financial';
import { TemplateManager, InstanceManager } from '@/components/templates';
import { ElementPropertiesPanel } from '@/components/chart-designer/ElementPropertiesPanel';
import { useToast } from '@/hooks/use-toast';
import type { ChartTemplate, ChartInstance } from '@shared/schema';

export default function ChartDesigner() {
  const [chartVersion, setChartVersion] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<ChartTemplate | null>(null);
  const [selectedInstance, setSelectedInstance] = useState<ChartInstance | null>(null);
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [elementProperties, setElementProperties] = useState<any>(null);
  const [canvasHistory, setCanvasHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [fabricCanvas, setFabricCanvas] = useState<any>(null);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showLayerManager, setShowLayerManager] = useState(false);
  const [layers, setLayers] = useState<Array<{
    id: string;
    type: string;
    name: string;
    visible: boolean;
    locked?: boolean;
    zIndex: number;
  }>>([]);
  const [chartSymbol, setChartSymbol] = useState('AAPL');
  const [chartTimeframe, setChartTimeframe] = useState('1Y');
  
  const handleSymbolChange = (symbol: string) => {
    console.log(`chart-designer.tsx - handleSymbolChange: "${symbol}"`);
    setChartSymbol(symbol);
  };
  const chartUpdateRef = useRef<((property: string, value: any) => void) | null>(null);
  const loadDataRef = useRef<(() => void) | null>(null);
  const { toast } = useToast();

  const handleDataUpdate = () => {
    setChartVersion(prev => prev + 1);
  };

  const handleElementSelect = (element: any, properties: any) => {
    console.log('chart-designer.tsx - handleElementSelect called with:', element?.type, properties?.type);
    
    // Don't clear selection if called with undefined values
    if (element === undefined && properties === undefined) {
      console.log('Ignoring undefined selection call');
      return;
    }
    
    setSelectedElement(element);
    setElementProperties(properties);
    console.log('chart-designer.tsx - State set to:', element?.type, properties?.type);
    
    // Show/hide layer manager based on selection
    setShowLayerManager(!!element); // Show when element is selected
    
    // Update layers when canvas changes
    updateLayers();
  };

  const updateLayers = () => {
    if (!fabricCanvas) return;
    
    const objects = fabricCanvas.getObjects();
    const layerItems = objects.map((obj: any, index: number) => ({
      id: obj.id || `layer-${index}`,
      type: obj.type || 'unknown',
      name: obj.elementType || obj.type || 'Unknown',
      visible: obj.visible !== false,
      locked: !obj.selectable,
      zIndex: index
    }));
    
    setLayers(layerItems);
  };

  const saveCanvasState = () => {
    if (!fabricCanvas) return;
    
    // Clear any existing save timeout to prevent duplicate saves
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    
    // Debounce the save operation
    const timeout = setTimeout(() => {
      try {
        // Save the complete canvas state as JSON with all element properties
        const canvasState = JSON.stringify(fabricCanvas.toJSON([
          'id', 'selectable', 'hasControls', 'hasBorders', 'visible',
          'strokeWidth', 'opacity', 'smoothness', 'color', 'symbol', 'elementType',
          'text', 'fontSize', 'fontWeight', 'fontFamily', 'fill', 'backgroundColor',
          'stroke', 'radius', 'width', 'height', 'angle', 'strokeDashArray', 'padding'
        ]));
        
        // Remove any states after current index (for branching)
        const newHistory = canvasHistory.slice(0, historyIndex + 1);
        newHistory.push(canvasState);
        
        // Limit history to 50 states to prevent memory issues
        if (newHistory.length > 50) {
          newHistory.shift();
        } else {
          setHistoryIndex(newHistory.length - 1);
        }
        
        setCanvasHistory(newHistory);
        console.log(`📝 Canvas state saved. History length: ${newHistory.length}, Current index: ${newHistory.length - 1}`);
      } catch (error) {
        console.error('Error saving canvas state:', error);
      }
    }, 300); // 300ms debounce
    
    setSaveTimeout(timeout);
  };



  const handleSaveProject = () => {
    toast({
      title: "Project Saved",
      description: "Your chart project has been saved successfully.",
    });
  };

  const handleUndo = () => {
    if (historyIndex > 0 && fabricCanvas) {
      try {
        const previousState = canvasHistory[historyIndex - 1];
        setHistoryIndex(prev => prev - 1);
        
        // Temporarily disable event listeners to prevent saving state during undo
        fabricCanvas.off('object:added');
        fabricCanvas.off('object:removed');
        fabricCanvas.off('object:modified');
        
        // Clear current canvas
        fabricCanvas.clear();
        
        // Load previous state with proper callback handling
        fabricCanvas.loadFromJSON(JSON.parse(previousState), () => {
          fabricCanvas.renderAll();
          
          // Re-establish event handlers for all objects
          fabricCanvas.getObjects().forEach((obj: any) => {
            setupObjectEventHandlers(obj);
          });
          
          // Re-enable canvas event listeners
          fabricCanvas.on('object:added', () => {
            updateLayers();
            setTimeout(() => saveCanvasState(), 100);
          });
          fabricCanvas.on('object:removed', () => {
            updateLayers();
            setTimeout(() => saveCanvasState(), 100);
          });
          fabricCanvas.on('object:modified', () => {
            updateLayers();
            setTimeout(() => saveCanvasState(), 100);
          });
        });
        
        // Clear current selection
        setSelectedElement(null);
        setElementProperties(null);
        
        toast({
          title: "Undo",
          description: "Last action undone.",
        });
      } catch (error) {
        console.error('Error during undo:', error);
        toast({
          title: "Undo Failed",
          description: "Could not undo the last action.",
          variant: "destructive",
        });
      }
    }
  };

  const handleRedo = () => {
    if (historyIndex < canvasHistory.length - 1 && fabricCanvas) {
      try {
        const nextState = canvasHistory[historyIndex + 1];
        setHistoryIndex(prev => prev + 1);
        
        // Temporarily disable event listeners to prevent saving state during redo
        fabricCanvas.off('object:added');
        fabricCanvas.off('object:removed');
        fabricCanvas.off('object:modified');
        
        // Clear current canvas
        fabricCanvas.clear();
        
        // Load next state with proper callback handling
        fabricCanvas.loadFromJSON(JSON.parse(nextState), () => {
          fabricCanvas.renderAll();
          
          // Re-establish event handlers for all objects
          fabricCanvas.getObjects().forEach((obj: any) => {
            setupObjectEventHandlers(obj);
          });
          
          // Re-enable canvas event listeners
          fabricCanvas.on('object:added', () => {
            updateLayers();
            setTimeout(() => saveCanvasState(), 100);
          });
          fabricCanvas.on('object:removed', () => {
            updateLayers();
            setTimeout(() => saveCanvasState(), 100);
          });
          fabricCanvas.on('object:modified', () => {
            updateLayers();
            setTimeout(() => saveCanvasState(), 100);
          });
        });
        
        // Clear current selection
        setSelectedElement(null);
        setElementProperties(null);
        
        toast({
          title: "Redo", 
          description: "Action redone.",
        });
      } catch (error) {
        console.error('Error during redo:', error);
        toast({
          title: "Redo Failed",
          description: "Could not redo the action.",
          variant: "destructive",
        });
      }
    }
  };

  // Enhanced property update handler that works with all element types
  const handleUpdateProperty = (property: string, value: any) => {
    if (!selectedElement || !fabricCanvas) return;

    try {
      // Special handling for chart line elements
      if (elementProperties?.type === 'chartline' || elementProperties?.type === 'financial-chart-line' || selectedElement?.type === 'financial-chart-line') {
        console.log('🔧 Chart Designer - Handling chart line property update:', property, '=', value);
        
        // For all chart line properties, use the chart update function
        console.log('🔧 Chart Designer - Calling chartUpdateRef for property:', property, '=', value);
        if (chartUpdateRef.current) {
          chartUpdateRef.current(property, value);
        } else {
          console.log('❌ Chart Designer - chartUpdateRef.current is null');
        }
        
        // Trigger canvas re-render
        fabricCanvas.renderAll();
      } else {
        // Standard property handling for other elements
        selectedElement.set(property, value);
        
        // For text content changes, update the text property specifically
        if (property === 'text') {
          selectedElement.set('text', value);
        }
        
        // For axis labels, we need to update all items in the group
        if (elementProperties?.type === 'y-axis-labels' || elementProperties?.type === 'x-axis-labels') {
          if (selectedElement._objects) {
            selectedElement._objects.forEach((obj: any) => {
              obj.set(property, value);
            });
          }
        }
        
        // For axis lines with custom update functions (like grid line controls)
        if (elementProperties?.type === 'y-axis-line' || elementProperties?.type === 'x-axis-line') {
          console.log(`🔧 Chart Designer - Calling custom updateFunction for ${elementProperties.type}: ${property} = ${value}`);
          console.log('🔧 Chart Designer - elementProperties.updateFunction exists:', !!elementProperties.updateFunction);
          if (elementProperties.updateFunction) {
            console.log('🔧 Chart Designer - About to call updateFunction');
            elementProperties.updateFunction(property, value);
            console.log('🔧 Chart Designer - updateFunction called');
          } else {
            console.log('🔧 Chart Designer - No updateFunction found in elementProperties');
            // Try to find the updateFunction directly from the selected element
            if (selectedElement && selectedElement.updateFunction) {
              console.log('🔧 Chart Designer - Found updateFunction on selectedElement, calling it');
              selectedElement.updateFunction(property, value);
            } else {
              console.log('🔧 Chart Designer - No updateFunction found on selectedElement either');
              console.log('🔧 Chart Designer - selectedElement keys:', selectedElement ? Object.keys(selectedElement) : 'selectedElement is null');
            }
          }
        }
        
        // Trigger canvas re-render
        fabricCanvas.renderAll();
      }
      
      // Update the properties state to reflect changes
      setElementProperties((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          properties: {
            ...prev.properties,
            [property]: value
          }
        };
      });

      // Save state after property change
      saveCanvasState();
    } catch (error) {
      console.error('Error updating property:', error);
      toast({
        title: "Update Failed",
        description: "Could not update element property",
        variant: "destructive",
      });
    }
  };

  // Helper function to setup event handlers for canvas objects
  const setupObjectEventHandlers = (obj: any) => {
    obj.on('selected', () => {
      handleElementSelect(obj, {
        type: obj.elementType || 'element',
        properties: {
          strokeWidth: obj.strokeWidth || 3,
          opacity: obj.opacity || 1,
          smoothness: obj.smoothness || 0.5,
          color: obj.stroke || obj.fill || '#3b82f6',
          visible: obj.visible !== false
        },
        updateFunction: (property: string, value: any) => {
          obj.set(property, value);
          fabricCanvas.renderAll();
        }
      });
    });
  };

  // Initialize canvas state when fabric canvas is ready
  const handleCanvasReady = (canvas: any) => {
    setFabricCanvas(canvas);
    
    // Save initial state with all properties
    setTimeout(() => {
      if (canvas && canvasHistory.length === 0) {
        const initialState = JSON.stringify(canvas.toJSON([
          'id', 'selectable', 'hasControls', 'hasBorders', 'visible',
          'strokeWidth', 'opacity', 'smoothness', 'color', 'symbol', 'elementType',
          'text', 'fontSize', 'fontWeight', 'fontFamily', 'fill', 'backgroundColor',
          'stroke', 'radius', 'width', 'height', 'angle', 'strokeDashArray', 'padding'
        ]));
        setCanvasHistory([initialState]);
        setHistoryIndex(0);
      }
      
      // Update layers initially
      updateLayers();
    }, 100);
    
    // Add canvas event listeners to update layers and save state
    canvas.on('object:added', () => {
      updateLayers();
      saveCanvasState();
    });
    canvas.on('object:removed', () => {
      updateLayers();
      saveCanvasState();
    });
    canvas.on('object:modified', () => {
      updateLayers();
      saveCanvasState();
    });
  };

  // Handle adding new elements from ElementLibraryPanel
  const handleAddElement = (elementConfig: { type: string }) => {
    if (!fabricCanvas) return;

    let newElement: any;
    const randomX = 200 + Math.random() * 300;
    const randomY = 150 + Math.random() * 200;

    switch (elementConfig.type) {
      case 'title':
        newElement = new (window as any).fabric.Text('Chart Title', {
          left: randomX,
          top: randomY,
          fontFamily: 'Inter, sans-serif',
          fontSize: 24,
          fontWeight: 'bold',
          fill: '#1f2937',
          elementType: 'title'
        });
        break;

      case 'annotation':
        newElement = new (window as any).fabric.Text('Important Note', {
          left: randomX,
          top: randomY,
          fontFamily: 'Inter, sans-serif',
          fontSize: 12,
          fill: '#ffffff',
          backgroundColor: 'rgba(239, 68, 68, 0.9)',
          padding: 8,
          elementType: 'annotation'
        });
        break;

      case 'price-label':
        newElement = new (window as any).fabric.Text('$125.50', {
          left: randomX,
          top: randomY,
          fontFamily: 'Inter, sans-serif',
          fontSize: 14,
          fontWeight: 'bold',
          fill: '#ffffff',
          backgroundColor: 'rgba(16, 185, 129, 0.9)',
          padding: 6,
          elementType: 'price-label'
        });
        break;

      case 'rectangle':
        newElement = new (window as any).fabric.Rect({
          left: randomX,
          top: randomY,
          width: 100,
          height: 60,
          fill: 'rgba(59, 130, 246, 0.2)',
          stroke: '#3b82f6',
          strokeWidth: 2,
          elementType: 'rectangle'
        });
        break;

      case 'circle':
        newElement = new (window as any).fabric.Circle({
          left: randomX,
          top: randomY,
          radius: 30,
          fill: 'rgba(168, 85, 247, 0.2)',
          stroke: '#a855f7',
          strokeWidth: 2,
          elementType: 'circle'
        });
        break;

      case 'triangle':
        newElement = new (window as any).fabric.Triangle({
          left: randomX,
          top: randomY,
          width: 60,
          height: 60,
          fill: 'rgba(245, 158, 11, 0.2)',
          stroke: '#f59e0b',
          strokeWidth: 2,
          elementType: 'triangle'
        });
        break;

      case 'star':
        // Create a simple star shape using polygon
        const starPoints = [];
        const spikes = 5;
        const outerRadius = 30;
        const innerRadius = 15;
        for (let i = 0; i < spikes * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = (i * Math.PI) / spikes;
          starPoints.push({
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius
          });
        }
        newElement = new (window as any).fabric.Polygon(starPoints, {
          left: randomX,
          top: randomY,
          fill: 'rgba(251, 191, 36, 0.3)',
          stroke: '#fbbf24',
          strokeWidth: 2,
          elementType: 'star'
        });
        break;

      case 'trend-line':
        newElement = new (window as any).fabric.Line([0, 0, 150, -50], {
          left: randomX,
          top: randomY,
          stroke: '#f59e0b',
          strokeWidth: 3,
          strokeDashArray: [5, 5],
          elementType: 'trend-line'
        });
        break;

      case 'arrow-up':
        newElement = new (window as any).fabric.Triangle({
          left: randomX,
          top: randomY,
          width: 20,
          height: 30,
          fill: '#10b981',
          angle: 0,
          elementType: 'arrow-up'
        });
        break;

      case 'arrow-down':
        newElement = new (window as any).fabric.Triangle({
          left: randomX,
          top: randomY,
          width: 20,
          height: 30,
          fill: '#ef4444',
          angle: 180,
          elementType: 'arrow-down'
        });
        break;

      case 'target':
        newElement = new (window as any).fabric.Circle({
          left: randomX,
          top: randomY,
          radius: 25,
          fill: 'transparent',
          stroke: '#8b5cf6',
          strokeWidth: 3,
          strokeDashArray: [8, 4],
          elementType: 'target'
        });
        break;

      case 'alert':
        newElement = new (window as any).fabric.Circle({
          left: randomX,
          top: randomY,
          radius: 15,
          fill: '#fbbf24',
          stroke: '#f59e0b',
          strokeWidth: 2,
          elementType: 'alert'
        });
        break;

      case 'highlight':
        newElement = new (window as any).fabric.Rect({
          left: randomX,
          top: randomY,
          width: 120,
          height: 40,
          fill: 'rgba(252, 211, 77, 0.3)',
          stroke: '#fbbf24',
          strokeWidth: 1,
          strokeDashArray: [3, 3],
          elementType: 'highlight'
        });
        break;

      default:
        console.log('Unknown element type:', elementConfig.type);
        return;
    }

    if (newElement) {
      // Make all new elements selectable
      newElement.set({
        selectable: true,
        hasControls: true,
        hasBorders: true
      });

      fabricCanvas.add(newElement);
      fabricCanvas.setActiveObject(newElement);
      fabricCanvas.renderAll();

      // Save state for undo/redo after element is added
      setTimeout(() => saveCanvasState(), 50);

      toast({
        title: "Element Added",
        description: `${elementConfig.type} added to canvas`,
      });
    }
  };

  // Handle element deletion
  const handleDeleteElement = () => {
    if (!fabricCanvas || !selectedElement) return;

    try {
      fabricCanvas.remove(selectedElement);
      fabricCanvas.discardActiveObject();
      fabricCanvas.renderAll();
      
      // Clear selection
      setSelectedElement(null);
      setElementProperties(null);
      
      // Save state for undo/redo after deletion
      setTimeout(() => saveCanvasState(), 50);

      toast({
        title: "Element Deleted",
        description: "Element removed from canvas",
      });
    } catch (error) {
      console.error('Error deleting element:', error);
      toast({
        title: "Delete Failed",
        description: "Could not delete element",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50" data-testid="chart-designer">
      {/* Header Toolbar */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <TrendingUp className="text-white" size={16} />
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              ChartFlow Professional Chart Designer
            </h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className={`toolbar-btn text-gray-700 hover:text-gray-900 ${
                historyIndex <= 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              data-testid="button-undo"
            >
              <Undo className="mr-1" size={16} />
              Undo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRedo}
              disabled={historyIndex >= canvasHistory.length - 1}
              className={`toolbar-btn text-gray-700 hover:text-gray-900 ${
                historyIndex >= canvasHistory.length - 1 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              data-testid="button-redo"
            >
              <Redo className="mr-1" size={16} />
              Redo
            </Button>
            <Button
              variant={showLayerManager ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setShowLayerManager(!showLayerManager);
                if (fabricCanvas && !showLayerManager) {
                  fabricCanvas.discardActiveObject();
                  fabricCanvas.renderAll();
                  setSelectedElement(null);
                  setElementProperties(null);
                }
              }}
              className="toolbar-btn text-gray-700 hover:text-gray-900"
              data-testid="button-layers"
            >
              <Move className="mr-1" size={16} />
              Layers
            </Button>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleSaveProject}
            className="toolbar-btn bg-secondary hover:bg-secondary/90 text-white border-secondary"
            data-testid="button-save-project"
          >
            <Save className="mr-1" size={16} />
            Save Project
          </Button>
          <Button
            onClick={handleSaveProject}
            className="toolbar-btn bg-primary hover:bg-primary/90 text-white"
            data-testid="button-export-chart-header"
          >
            <Download className="mr-1" size={16} />
            Export Chart
          </Button>
        </div>
      </header>

      {/* Main Editor */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Controls - Fixed Width */}
        <div className="w-80 min-w-80 max-w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Design Controls</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <DataSourcePanel 
              onDataUpdate={handleDataUpdate}
              onSymbolChange={handleSymbolChange}
              onTimeframeChange={setChartTimeframe}
              onLoadData={() => {
                if (loadDataRef.current) {
                  loadDataRef.current();
                }
              }}
            />
            
            {/* Element Properties Panel */}
            <ElementPropertiesPanel 
              selectedElement={selectedElement}
              properties={elementProperties}
              onUpdateProperty={handleUpdateProperty}
              onDeleteElement={handleDeleteElement}
            />
            
            <ColorPalettePanel />
            <GradientEffectsPanel />
            <LineStylingPanel />
            <TypographyPanel />
            <LogoPanel />
            <AxisFormattingPanel />
            <ElementLibraryPanel onAddElement={handleAddElement} />
          </div>
        </div>

        {/* Center Panel - Canvas */}
        <div className="flex-1 p-4">
          <FinancialChartCanvas 
            symbol={chartSymbol}
            timeframe={chartTimeframe}
            onElementSelect={handleElementSelect} 
            onCanvasReady={handleCanvasReady}
            onCanvasChange={saveCanvasState}
            onChartUpdateRef={(updateFn) => {
              chartUpdateRef.current = updateFn;
            }}
            onLoadDataRef={(loadFn) => {
              loadDataRef.current = loadFn;
            }}
          />
        </div>

        {/* Right Panel - Layers, Templates & Instances */}
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Layers & Templates</h2>
          </div>
          
          {/* Layer Manager Section */}
          <div className="flex-1 border-b border-gray-200">
            <LayerManagerPanel 
              canvas={fabricCanvas}
              selectedElement={selectedElement}
              onElementSelect={handleElementSelect}
            />
          </div>
          
          {/* Templates Section */}
          <div className="p-4 border-b border-gray-200 min-h-0 flex-1 overflow-auto">
            <TemplateManager 
              onSelectTemplate={(template) => {
                setSelectedTemplate(template);
              }}
              currentTemplate={selectedTemplate}
            />
          </div>

          {/* Instances Section */}
          <div className="p-4 min-h-0 flex-1 overflow-auto">
            <InstanceManager 
              selectedTemplate={selectedTemplate}
              onSelectInstance={(instance) => {
                setSelectedInstance(instance);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
