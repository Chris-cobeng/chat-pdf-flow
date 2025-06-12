import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import SignaturePadComponent from './SignaturePad';
import SignaturePad from 'signature_pad';

expect.extend(matchers);

// Mock the SignaturePad library
vi.mock('signature_pad');

describe('SignaturePadComponent', () => {
  let mockOnSave: ReturnType<typeof vi.fn>;
  let mockOnClear: ReturnType<typeof vi.fn>;
  let mockSignaturePadInstance: {
    clear: ReturnType<typeof vi.fn>;
    isEmpty: ReturnType<typeof vi.fn>;
    toDataURL: ReturnType<typeof vi.fn>;
    off: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockOnSave = vi.fn();
    mockOnClear = vi.fn();
    mockSignaturePadInstance = {
      clear: vi.fn(),
      isEmpty: vi.fn().mockReturnValue(true), // Default to empty
      toDataURL: vi.fn().mockReturnValue('data:image/png;base64,test'),
      off: vi.fn(),
    };
    // @ts-ignore
    SignaturePad.mockImplementation(() => mockSignaturePadInstance);

    // Mock offsetWidth and offsetHeight for canvas DPI scaling logic
    Object.defineProperty(HTMLCanvasElement.prototype, 'offsetWidth', {
      configurable: true,
      value: 500, // Example width
    });
    Object.defineProperty(HTMLCanvasElement.prototype, 'offsetHeight', {
      configurable: true,
      value: 200, // Example height
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    cleanup(); // Ensure DOM cleanup after each test
  });

  test('renders canvas and control buttons', () => {
    const { container } = render(<SignaturePadComponent onSave={mockOnSave} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Clear/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save Signature/i })).toBeInTheDocument();
  });

  test('calls onSave with data URL when signature is not empty', () => {
    mockSignaturePadInstance.isEmpty.mockReturnValue(false);
    render(<SignaturePadComponent onSave={mockOnSave} />);
    fireEvent.click(screen.getByRole('button', { name: /Save Signature/i }));
    expect(mockSignaturePadInstance.toDataURL).toHaveBeenCalledWith('image/png');
    expect(mockOnSave).toHaveBeenCalledWith('data:image/png;base64,test');
  });

  test('does not call onSave and alerts when signature is empty', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    mockSignaturePadInstance.isEmpty.mockReturnValue(true);
    render(<SignaturePadComponent onSave={mockOnSave} />);
    fireEvent.click(screen.getByRole('button', { name: /Save Signature/i }));
    expect(mockOnSave).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith('Please provide a signature first.');
    alertSpy.mockRestore();
  });

  test('calls signaturePad.clear() and onClear prop when Clear button is clicked', () => {
    render(<SignaturePadComponent onSave={mockOnSave} onClear={mockOnClear} />);
    fireEvent.click(screen.getByRole('button', { name: /Clear/i }));
    expect(mockSignaturePadInstance.clear).toHaveBeenCalled();
    expect(mockOnClear).toHaveBeenCalled();
  });

  test('does not call onClear prop if not provided', () => {
    render(<SignaturePadComponent onSave={mockOnSave} />); // No onClear prop
    fireEvent.click(screen.getByRole('button', { name: /Clear/i }));
    expect(mockSignaturePadInstance.clear).toHaveBeenCalled();
    // mockOnClear was defined in beforeEach but not passed as a prop, so it shouldn't be called.
    expect(mockOnClear).not.toHaveBeenCalled();
  });

  test('sets canvas width and height attributes considering devicePixelRatio', () => {
    // Mock devicePixelRatio
    const mockDevicePixelRatio = 2;
    const originalDevicePixelRatio = window.devicePixelRatio;
    Object.defineProperty(window, 'devicePixelRatio', {
      configurable: true,
      value: mockDevicePixelRatio,
    });

    const { container } = render(<SignaturePadComponent onSave={mockOnSave} width={500} height={200} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    // Check that the canvas's context was scaled
    // The actual width/height attributes are set based on offsetWidth/offsetHeight * ratio
    // So, canvas.width should be 500 * 2 = 1000
    expect(canvas).toHaveAttribute('width', '1000'); // 500 (offsetWidth) * 2 (devicePixelRatio)
    expect(canvas).toHaveAttribute('height', '400'); // 200 (offsetHeight) * 2 (devicePixelRatio)

    // Restore original devicePixelRatio
    Object.defineProperty(window, 'devicePixelRatio', {
      value: originalDevicePixelRatio,
    });
  });

  test('cleans up signature pad instance on unmount', () => {
    const { unmount } = render(<SignaturePadComponent onSave={mockOnSave} />);
    unmount();
    expect(mockSignaturePadInstance.off).toHaveBeenCalled();
  });
});
