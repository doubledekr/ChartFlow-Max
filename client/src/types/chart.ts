export interface ChartData {
  symbol: string;
  data: Array<{
    date: string;
    price: number;
    volume?: number;
  }>;
  period: string;
}

export interface ChartElement {
  id: string;
  type: 'title' | 'annotation' | 'arrow' | 'badge';
  x: number;
  y: number;
  content: string;
  style: {
    fontSize?: number;
    fontWeight?: string;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    borderColor?: string;
  };
  fabric?: any;
}

export interface ChartConfig {
  // Data
  symbol: string;
  period: string;
  
  // Colors & Theme
  colorPalette: string;
  customColors: string[];
  gradient: string;
  gradientIntensity: number;
  
  // Line Styling
  lineStyle: 'solid' | 'dashed' | 'dotted' | 'dashDot' | 'longDash' | 'doubleDot';
  lineThickness: number;
  curveStyle: 'linear' | 'smooth' | 'step' | 'basis' | 'monotone' | 'cardinal';
  lineCap: 'round' | 'square' | 'butt';
  pointStyle: 'none' | 'circle' | 'square' | 'triangle' | 'diamond' | 'cross';
  pointSize: number;
  showJunctionDots: boolean;
  
  // Typography
  title: {
    text: string;
    font: string;
    size: number;
    weight: string;
    color: string;
    lineHeight: number;
    letterSpacing: number;
  };
  subtitle: {
    text: string;
    font: string;
    size: number;
    weight: string;
    color: string;
  };
  axisLabels: {
    font: string;
    size: number;
    weight: string;
    color: string;
  };
  
  // Axis Formatting
  yAxisFormat: 'currency' | 'percentage' | 'decimal' | 'integer' | 'scientific';
  gridLines: {
    style: 'solid' | 'dashed' | 'dotted' | 'none';
    opacity: number;
    color: string;
  };
  axisRange: {
    auto: boolean;
    min?: number;
    max?: number;
  };
  xAxisLabel: string;
  yAxisLabel: string;
  
  // Canvas
  showGrid: boolean;
  snapToGrid: boolean;
  zoom: number;
  
  // Elements
  elements: ChartElement[];
}

export interface ExportOptions {
  format: 'png' | 'svg' | 'pdf';
  resolution: number;
  width: number;
  height: number;
  quality: number;
}

export interface LineStyleOptions {
  solid: { strokeDasharray: string; label: string };
  dashed: { strokeDasharray: string; label: string };
  dotted: { strokeDasharray: string; label: string };
  dashDot: { strokeDasharray: string; label: string };
  longDash: { strokeDasharray: string; label: string };
}

export interface NumberFormatOptions {
  currency: { format: string; label: string };
  percentage: { format: string; label: string };
  decimal: { format: string; label: string };
  integer: { format: string; label: string };
  scientific: { format: string; label: string };
}
