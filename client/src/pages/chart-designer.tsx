import { useState } from 'react';
import { Undo, Redo, Save, Download, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataSourcePanel } from '@/components/chart-designer/DataSourcePanel';
import { ColorPalettePanel } from '@/components/chart-designer/ColorPalettePanel';
import { GradientEffectsPanel } from '@/components/chart-designer/GradientEffectsPanel';
import { LineStylingPanel } from '@/components/chart-designer/LineStylingPanel';
import { TypographyPanel } from '@/components/chart-designer/TypographyPanel';
import { AxisFormattingPanel } from '@/components/chart-designer/AxisFormattingPanel';
import { ElementLibraryPanel } from '@/components/chart-designer/ElementLibraryPanel';
import { LogoPanel } from '@/components/chart-designer/LogoPanel';
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
  const { toast } = useToast();

  const handleDataUpdate = () => {
    setChartVersion(prev => prev + 1);
  };

  const handleElementSelect = (element: any, properties: any) => {
    console.log('chart-designer.tsx - handleElementSelect called with:', element?.type, properties?.type);
    console.trace('handleElementSelect call stack'); // This will show us what's calling it
    
    // Don't clear selection if called with undefined values
    if (element === undefined && properties === undefined) {
      console.log('Ignoring undefined selection call');
      return;
    }
    
    setSelectedElement(element);
    setElementProperties(properties);
    console.log('chart-designer.tsx - State set to:', element?.type, properties?.type);
  };

  const saveCanvasState = () => {
    if (!fabricCanvas) return;
    
    try {
      // Save the complete canvas state as JSON
      const canvasState = JSON.stringify(fabricCanvas.toJSON([
        'id', 'selectable', 'hasControls', 'hasBorders', 'visible',
        'strokeWidth', 'opacity', 'smoothness', 'color', 'symbol', 'elementType'
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
    } catch (error) {
      console.error('Error saving canvas state:', error);
    }
  };

  const handlePropertyUpdate = (property: string, value: any) => {
    if (!selectedElement || !elementProperties) return;

    // Save state before change for undo functionality
    saveCanvasState();

    // Update local properties state
    setElementProperties((prev: any) => ({
      ...prev,
      properties: {
        ...prev.properties,
        [property]: value
      }
    }));

    // Update the actual element via the canvas update function
    if (elementProperties?.updateFunction) {
      elementProperties.updateFunction(property, value);
    }
    console.log(`Updated ${property} to ${value} for element:`, selectedElement.type);
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
        setHistoryIndex(historyIndex - 1);
        
        // Clear current canvas
        fabricCanvas.clear();
        
        // Load previous state
        fabricCanvas.loadFromJSON(previousState, () => {
          fabricCanvas.renderAll();
          
          // Re-establish event handlers for new objects
          fabricCanvas.getObjects().forEach((obj: any) => {
            if (obj.elementType) {
              setupObjectEventHandlers(obj);
            }
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
        setHistoryIndex(historyIndex + 1);
        
        // Clear current canvas
        fabricCanvas.clear();
        
        // Load next state
        fabricCanvas.loadFromJSON(nextState, () => {
          fabricCanvas.renderAll();
          
          // Re-establish event handlers for new objects
          fabricCanvas.getObjects().forEach((obj: any) => {
            if (obj.elementType) {
              setupObjectEventHandlers(obj);
            }
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
      // Set the property on the selected element
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
      
      // Trigger canvas re-render
      fabricCanvas.renderAll();
      
      // Update the properties state to reflect changes
      setElementProperties(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          properties: {
            ...prev.properties,
            [property]: value
          }
        };
      });

      // Save state for undo/redo
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
    
    // Save initial state
    setTimeout(() => {
      if (canvas && canvasHistory.length === 0) {
        const initialState = JSON.stringify(canvas.toJSON([
          'id', 'selectable', 'hasControls', 'hasBorders', 'visible',
          'strokeWidth', 'opacity', 'smoothness', 'color', 'symbol', 'elementType'
        ]));
        setCanvasHistory([initialState]);
        setHistoryIndex(0);
      }
    }, 100);
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

      // Trigger canvas change for undo/redo
      saveCanvasState();

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
      
      // Save state for undo/redo
      saveCanvasState();

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
            <DataSourcePanel onDataUpdate={handleDataUpdate} />
            
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
            onElementSelect={handleElementSelect} 
            onCanvasReady={handleCanvasReady}
            onCanvasChange={saveCanvasState}
          />
        </div>

        {/* Right Panel - Templates & Instances */}
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Templates & Charts</h2>
          </div>
          
          {/* Templates Section */}
          <div className="p-4 border-b border-gray-200 flex-1 overflow-auto">
            <TemplateManager 
              onSelectTemplate={(template) => {
                setSelectedTemplate(template);
              }}
              currentTemplate={selectedTemplate}
            />
          </div>

          {/* Instances Section */}
          <div className="p-4 flex-1 overflow-auto">
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
