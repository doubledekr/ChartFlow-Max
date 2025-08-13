import { useState, useCallback } from 'react';
import { ChartConfig, ChartElement } from '../types/chart';

const defaultConfig: ChartConfig = {
  // Data
  symbol: 'AAPL',
  period: '1Y',
  
  // Colors & Theme
  colorPalette: 'financial',
  customColors: ['#0066CC', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#6B7280'],
  gradient: 'financial',
  gradientIntensity: 75,
  
  // Line Styling
  lineStyle: 'solid',
  lineThickness: 2,
  curveStyle: 'linear',
  lineCap: 'round',
  pointStyle: 'none',
  pointSize: 4,
  showJunctionDots: false,
  
  // Typography
  title: {
    text: 'AAPL Stock Performance - 2024',
    font: 'Inter',
    size: 32,
    weight: '700',
    color: '#1F2937',
    lineHeight: 1.2,
    letterSpacing: 0,
  },
  subtitle: {
    text: '',
    font: 'Inter',
    size: 16,
    weight: '400',
    color: '#6B7280',
  },
  axisLabels: {
    font: 'Inter',
    size: 12,
    weight: '400',
    color: '#6B7280',
  },
  
  // Axis Formatting
  yAxisFormat: 'currency',
  gridLines: {
    style: 'solid',
    opacity: 30,
    color: '#E5E7EB',
  },
  axisRange: {
    auto: true,
  },
  xAxisLabel: 'Time Period',
  yAxisLabel: 'Stock Price ($)',
  
  // Canvas
  showGrid: true,
  snapToGrid: false,
  zoom: 100,
  
  // Elements
  elements: [],
};

export function useChartDesigner() {
  const [config, setConfig] = useState<ChartConfig>(defaultConfig);
  const [selectedElement, setSelectedElement] = useState<ChartElement | null>(null);
  const [canvas, setCanvas] = useState<any>(null);

  const updateConfig = useCallback((updates: Partial<ChartConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const updateTitle = useCallback((updates: Partial<ChartConfig['title']>) => {
    setConfig(prev => ({
      ...prev,
      title: { ...prev.title, ...updates }
    }));
  }, []);

  const updateSubtitle = useCallback((updates: Partial<ChartConfig['subtitle']>) => {
    setConfig(prev => ({
      ...prev,
      subtitle: { ...prev.subtitle, ...updates }
    }));
  }, []);

  const updateAxisLabels = useCallback((updates: Partial<ChartConfig['axisLabels']>) => {
    setConfig(prev => ({
      ...prev,
      axisLabels: { ...prev.axisLabels, ...updates }
    }));
  }, []);

  const updateGridLines = useCallback((updates: Partial<ChartConfig['gridLines']>) => {
    setConfig(prev => ({
      ...prev,
      gridLines: { ...prev.gridLines, ...updates }
    }));
  }, []);

  const updateAxisRange = useCallback((updates: Partial<ChartConfig['axisRange']>) => {
    setConfig(prev => ({
      ...prev,
      axisRange: { ...prev.axisRange, ...updates }
    }));
  }, []);

  const addElement = useCallback((element: Omit<ChartElement, 'id'>) => {
    const newElement: ChartElement = {
      ...element,
      id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    
    setConfig(prev => ({
      ...prev,
      elements: [...prev.elements, newElement]
    }));
    
    return newElement;
  }, []);

  const updateElement = useCallback((id: string, updates: Partial<ChartElement>) => {
    setConfig(prev => ({
      ...prev,
      elements: prev.elements.map(el => 
        el.id === id ? { ...el, ...updates } : el
      )
    }));
  }, []);

  const removeElement = useCallback((id: string) => {
    setConfig(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== id)
    }));
    
    if (selectedElement?.id === id) {
      setSelectedElement(null);
    }
  }, [selectedElement]);

  const selectElement = useCallback((element: ChartElement | null) => {
    setSelectedElement(element);
  }, []);

  const setCanvasInstance = useCallback((canvasInstance: any) => {
    setCanvas(canvasInstance);
  }, []);

  return {
    config,
    selectedElement,
    canvas,
    updateConfig,
    updateTitle,
    updateSubtitle,
    updateAxisLabels,
    updateGridLines,
    updateAxisRange,
    addElement,
    updateElement,
    removeElement,
    selectElement,
    setCanvasInstance,
  };
}
