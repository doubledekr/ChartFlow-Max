import { useEffect, useRef } from 'react';

// Use the global fabric from CDN

export function SimpleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    console.log('Creating simple Fabric canvas');
    
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 450,
      backgroundColor: '#f8f9fa',
    });

    // Add test elements
    const text1 = new fabric.Text('Draggable Text 1', {
      left: 100,
      top: 100,
      fontSize: 20,
      fill: 'red',
    });

    const text2 = new fabric.Text('Draggable Text 2', {
      left: 300,
      top: 200,
      fontSize: 20,
      fill: 'blue',
    });

    const rect = new fabric.Rect({
      left: 200,
      top: 150,
      width: 100,
      height: 50,
      fill: 'green',
    });

    canvas.add(text1, text2, rect);
    canvas.renderAll();

    console.log('Added test elements, canvas objects:', canvas.getObjects().length);

    return () => {
      canvas.dispose();
    };
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-4">Simple Drag Test</h2>
        <canvas
          ref={canvasRef}
          className="border border-gray-300"
        />
      </div>
    </div>
  );
}