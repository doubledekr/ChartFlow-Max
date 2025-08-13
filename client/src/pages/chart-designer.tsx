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
  const [canvasHistory, setCanvasHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
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
    // Save canvas state for undo/redo
    const canvasState = {
      timestamp: Date.now(),
      elements: selectedElement ? [{
        type: selectedElement.type,
        properties: elementProperties?.properties
      }] : []
    };
    
    const newHistory = canvasHistory.slice(0, historyIndex + 1);
    newHistory.push(canvasState);
    setCanvasHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
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
    if (historyIndex > 0) {
      const previousState = canvasHistory[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      
      // Apply previous state to canvas
      if (previousState && selectedElement && elementProperties?.updateFunction) {
        const elementState = previousState.elements.find((el: any) => el.type === selectedElement.type);
        if (elementState) {
          Object.entries(elementState.properties).forEach(([prop, value]) => {
            elementProperties.updateFunction(prop, value);
          });
          setElementProperties((prev: any) => ({
            ...prev,
            properties: elementState.properties
          }));
        }
      }
      
      toast({
        title: "Undo",
        description: "Last action undone.",
      });
    }
  };

  const handleRedo = () => {
    if (historyIndex < canvasHistory.length - 1) {
      const nextState = canvasHistory[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      
      // Apply next state to canvas
      if (nextState && selectedElement && elementProperties?.updateFunction) {
        const elementState = nextState.elements.find((el: any) => el.type === selectedElement.type);
        if (elementState) {
          Object.entries(elementState.properties).forEach(([prop, value]) => {
            elementProperties.updateFunction(prop, value);
          });
          setElementProperties((prev: any) => ({
            ...prev,
            properties: elementState.properties
          }));
        }
      }
      
      toast({
        title: "Redo", 
        description: "Action redone.",
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
              className="toolbar-btn text-gray-700 hover:text-gray-900"
              data-testid="button-undo"
            >
              <Undo className="mr-1" size={16} />
              Undo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRedo}
              className="toolbar-btn text-gray-700 hover:text-gray-900"
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
              onUpdateProperty={handlePropertyUpdate}
            />
            
            <ColorPalettePanel />
            <GradientEffectsPanel />
            <LineStylingPanel />
            <TypographyPanel />
            <LogoPanel />
            <AxisFormattingPanel />
            <ElementLibraryPanel />
          </div>
        </div>

        {/* Center Panel - Canvas */}
        <div className="flex-1 p-4">
          <FinancialChartCanvas onElementSelect={handleElementSelect} />
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
