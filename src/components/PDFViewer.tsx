
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ZoomIn, ZoomOut, Printer } from 'lucide-react';
import { useStore } from '../store/useStore';

// Set up PDF.js worker with better configuration
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const PDFViewer = () => {
  const { currentDocument } = useStore();
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.0);
  const [isDocumentLoaded, setIsDocumentLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(800);
  const containerRef = useRef<HTMLDivElement>(null);

  // Memoize PDF options to prevent unnecessary reloads
  const pdfOptions = useMemo(() => ({
    cMapUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
    disableAutoFetch: false,
    disableStream: false,
    useSystemFonts: true,
    verbosity: 0,
  }), []);

  // Update container width on resize
  useEffect(() => {
    const updateContainerWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth - 48; // Account for padding
        setContainerWidth(width);
      }
    };

    updateContainerWidth();
    window.addEventListener('resize', updateContainerWidth);
    return () => window.removeEventListener('resize', updateContainerWidth);
  }, []);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    console.log('PDF loaded successfully with', numPages, 'pages');
    setNumPages(numPages);
    setIsDocumentLoaded(true);
    setIsLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF load error:', error);
    setIsDocumentLoaded(false);
    setIsLoading(false);
    setError('Failed to load PDF. Please try again.');
  }, []);

  const onDocumentLoadStart = useCallback(() => {
    console.log('PDF loading started');
    setIsLoading(true);
    setError(null);
    setIsDocumentLoaded(false);
  }, []);

  const onPageLoadError = useCallback((error: Error, pageNumber: number) => {
    console.error(`Page ${pageNumber} load error:`, error);
  }, []);

  const onPageRenderError = useCallback((error: Error, pageNumber: number) => {
    console.error(`Page ${pageNumber} render error:`, error);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  // Reset state when document changes
  useEffect(() => {
    if (currentDocument) {
      setIsDocumentLoaded(false);
      setNumPages(0);
      setScale(1.0);
      setIsLoading(false);
      setError(null);
    }
  }, [currentDocument]);

  if (!currentDocument) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center p-8 rounded-xl bg-white shadow-lg border border-gray-200">
          <div className="text-gray-400 mb-6">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">No PDF Selected</h3>
          <p className="text-gray-600 max-w-sm">Upload and select a PDF file to view it here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* CSS for PDF styling */}
      <style>
        {`
          .react-pdf__Page {
            margin: 0 auto 20px auto !important;
            display: block !important;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
            border-radius: 8px !important;
            overflow: hidden !important;
            background: white !important;
          }
          .react-pdf__Page__canvas {
            display: block !important;
            margin: 0 auto !important;
            width: 100% !important;
            height: auto !important;
          }
        `}
      </style>

      {/* PDF Controls */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50 flex-shrink-0">
        <div className="flex items-center justify-between">
          {/* Document Info */}
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              {currentDocument.name}
            </div>
            {isDocumentLoaded && (
              <div className="text-sm text-gray-500">
                {numPages} pages
              </div>
            )}
            {isLoading && (
              <div className="flex items-center space-x-2 text-sm text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Loading PDF...</span>
              </div>
            )}
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-2 bg-white rounded-lg border border-gray-200 p-1">
            <button
              onClick={handleZoomOut}
              disabled={!isDocumentLoaded}
              className="p-2 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <ZoomOut className="h-4 w-4 text-gray-600" />
            </button>
            <span className="text-sm text-gray-600 min-w-[3rem] text-center px-2">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={!isDocumentLoaded}
              className="p-2 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <ZoomIn className="h-4 w-4 text-gray-600" />
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1" />
            <button
              onClick={handlePrint}
              disabled={!isDocumentLoaded}
              className="p-2 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Printer className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* PDF Display - Vertical Scrollable */}
      <div ref={containerRef} className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 to-blue-50 p-6">
        <div className="flex justify-center">
          <div className="pdf-container max-w-full mx-auto">
            <Document
              file={currentDocument.url}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              onLoadStart={onDocumentLoadStart}
              loading={
                <div className="flex items-center justify-center p-16 min-h-[600px]">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <div className="text-gray-600 text-lg">Loading PDF...</div>
                  </div>
                </div>
              }
              error={
                <div className="flex items-center justify-center p-16 min-h-[600px]">
                  <div className="text-red-500 text-center">
                    <div className="text-xl font-medium mb-2">Error loading PDF</div>
                    <div className="text-base">Please try uploading the file again or use a different PDF.</div>
                  </div>
                </div>
              }
              options={pdfOptions}
            >
              {isDocumentLoaded && Array.from(new Array(numPages), (el, index) => (
                <Page
                  key={`page_${index + 1}_${scale}`}
                  pageNumber={index + 1}
                  width={Math.min(containerWidth * scale, containerWidth)}
                  onLoadError={(error) => onPageLoadError(error, index + 1)}
                  onRenderError={(error) => onPageRenderError(error, index + 1)}
                  loading={
                    <div className="bg-white shadow-lg mx-auto flex items-center justify-center animate-pulse border border-gray-200 rounded mb-5" style={{ width: Math.min(containerWidth * scale, containerWidth), height: Math.min(containerWidth * scale * 1.414, containerWidth * 1.414) }}>
                      <div className="text-gray-400">Loading page {index + 1}...</div>
                    </div>
                  }
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="pdf-page"
                />
              ))}
            </Document>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
