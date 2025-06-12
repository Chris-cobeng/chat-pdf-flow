import React, { useRef, useEffect, useCallback } from 'react';
import SignaturePad from 'signature_pad';
import { Button } from './ui/button'; // Assuming shadcn/ui button

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  onClear?: () => void;
  width?: number;
  height?: number;
}

const SignaturePadComponent: React.FC<SignaturePadProps> = ({ onSave, onClear, width = 500, height = 200 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      // Adjust canvas for high DPI displays
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvasRef.current.width = canvasRef.current.offsetWidth * ratio;
      canvasRef.current.height = canvasRef.current.offsetHeight * ratio;
      canvasRef.current.getContext('2d')?.scale(ratio, ratio);

      signaturePadRef.current = new SignaturePad(canvasRef.current, {
        backgroundColor: 'rgb(255, 255, 255)', // Or use a CSS variable for theme consistency
        penColor: 'rgb(0, 0, 0)'
      });
      // Clean up on unmount
      return () => {
        signaturePadRef.current?.off();
      };
    }
  }, []);

  const handleClear = useCallback(() => {
    signaturePadRef.current?.clear();
    if (onClear) {
      onClear();
    }
  }, [onClear]);

  const handleSave = useCallback(() => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      const dataUrl = signaturePadRef.current.toDataURL('image/png');
      onSave(dataUrl);
    } else {
      // TODO: Handle empty signature case (e.g., show a toast or alert)
      alert('Please provide a signature first.');
    }
  }, [onSave]);

  return (
    <div className="flex flex-col items-center space-y-2">
      <canvas
        ref={canvasRef}
        style={{ width: `${width}px`, height: `${height}px` }}
        className="border border-gray-300 rounded-md bg-white"
      />
      <div className="flex space-x-2">
        <Button variant="outline" onClick={handleClear}>Clear</Button>
        <Button onClick={handleSave}>Save Signature</Button>
      </div>
    </div>
  );
};

export default SignaturePadComponent;
