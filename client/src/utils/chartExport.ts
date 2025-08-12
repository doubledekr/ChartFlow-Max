import { ExportOptions } from '../types/chart';

declare global {
  interface Window {
    jsPDF: any;
  }
}

export async function exportChart(
  canvas: HTMLCanvasElement | any, 
  options: ExportOptions
): Promise<void> {
  const { format, resolution, width, height, quality } = options;
  
  let dataUrl: string;
  
  if (canvas instanceof HTMLCanvasElement) {
    dataUrl = canvas.toDataURL(`image/${format}`, quality / 100);
  } else {
    // fabric.Canvas
    dataUrl = canvas.toDataURL({
      format: format === 'svg' ? 'svg' : 'png',
      quality: quality / 100,
      multiplier: resolution / 72, // Convert DPI to multiplier
    });
  }
  
  if (format === 'pdf') {
    await exportToPDF(dataUrl, width, height);
  } else if (format === 'svg') {
    await exportToSVG(canvas, width, height);
  } else {
    await downloadFile(dataUrl, `chart.${format}`);
  }
}

async function exportToPDF(dataUrl: string, width: number, height: number): Promise<void> {
  if (!window.jsPDF) {
    throw new Error('jsPDF library not loaded');
  }
  
  const pdf = new window.jsPDF.jsPDF({
    orientation: width > height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [width, height]
  });
  
  pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);
  pdf.save('chart.pdf');
}

async function exportToSVG(canvas: any | HTMLCanvasElement, width: number, height: number): Promise<void> {
  let svgString: string;
  
  if (canvas instanceof HTMLCanvasElement) {
    // Convert canvas to SVG (simplified)
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get canvas context');
    
    svgString = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml">
          <img src="${canvas.toDataURL()}" width="${width}" height="${height}"/>
        </div>
      </foreignObject>
    </svg>`;
  } else {
    // fabric.Canvas has built-in SVG export
    svgString = canvas.toSVG({
      width: width,
      height: height,
    });
  }
  
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  await downloadFile(url, 'chart.svg');
  URL.revokeObjectURL(url);
}

async function downloadFile(url: string, filename: string): Promise<void> {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function getResolutionDPI(resolution: string): number {
  switch (resolution) {
    case 'High Quality (300 DPI)': return 300;
    case 'Standard (150 DPI)': return 150;
    case 'Web (72 DPI)': return 72;
    default: return 150;
  }
}

export function getDefaultDimensions(format: string): { width: number; height: number } {
  switch (format) {
    case 'png':
    case 'svg':
      return { width: 1920, height: 1080 };
    case 'pdf':
      return { width: 800, height: 600 };
    default:
      return { width: 1920, height: 1080 };
  }
}
