
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ZoomIn, ZoomOut, Printer, MessageCircle, HelpCircle, FileText, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

// Set up PDF.js worker with better configuration
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const PDFViewer = () => {
  const { currentDocument, addMessage } = useStore();
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.0);
  const [selectedText, setSelectedText] = useState<string>('');
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [isDocumentLoaded, setIsDocumentLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [textLayerError, setTextLayerError] = useState(false);
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set());
  const actionMenuRef = useRef<HTMLDivElement>(null);

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

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    console.log('PDF loaded successfully with', numPages, 'pages');
    setNumPages(numPages);
    setIsDocumentLoaded(true);
    setIsLoading(false);
    setError(null);
    setTextLayerError(false);
    setLoadedPages(new Set());
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF load error:', error);
    setIsDocumentLoaded(false);
    setIsLoading(false);
    setError('Failed to load PDF. Please try again.');
    setTextLayerError(false);
  }, []);

  const onDocumentLoadStart = useCallback(() => {
    console.log('PDF loading started');
    setIsLoading(true);
    setError(null);
    setIsDocumentLoaded(false);
    setTextLayerError(false);
  }, []);

  const onPageLoadSuccess = useCallback((pageNumber: number) => {
    console.log(`Page ${pageNumber} loaded successfully`);
    setLoadedPages(prev => new Set([...prev, pageNumber]));
  }, []);

  const onPageLoadError = useCallback((error: Error, pageNumber: number) => {
    console.error(`Page ${pageNumber} load error:`, error);
    if (error.message.includes('sendWithStream') || error.message.includes('TextLayer')) {
      setTextLayerError(true);
    }
  }, []);

  const onPageRenderSuccess = useCallback((pageNumber: number) => {
    console.log(`Page ${pageNumber} rendered successfully`);
  }, []);

  const onPageRenderError = useCallback((error: Error, pageNumber: number) => {
    console.error(`Page ${pageNumber} render error:`, error);
    if (error.message.includes('sendWithStream') || error.message.includes('TextLayer')) {
      setTextLayerError(true);
    }
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

  const handleTextSelection = (e: React.MouseEvent) => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const text = selection.toString().trim();
      setSelectedText(text);
      
      // Position the action menu near the selection
      const rect = selection.getRangeAt(0).getBoundingClientRect();
      setMenuPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      });
      setShowActionMenu(true);
    }
  };

  const closeActionMenu = () => {
    setShowActionMenu(false);
    setSelectedText('');
    window.getSelection()?.removeAllRanges();
  };

  const handleAction = (action: string) => {
    if (selectedText && currentDocument) {
      let message = '';
      
      switch (action) {
        case 'explain':
          message = `Please explain this text from the document: "${selectedText}"`;
          break;
        case 'summarize':
          message = `Please summarize this text: "${selectedText}"`;
          break;
        case 'rewrite':
          message = `Please rewrite this text in a clearer way: "${selectedText}"`;
          break;
        case 'ask':
          message = `I have a question about this text: "${selectedText}". Can you provide more details?`;
          break;
        default:
          message = `Help me understand this text: "${selectedText}"`;
      }
      
      addMessage({
        role: 'user',
        text: message
      });
      
      // Add a mock AI response for demonstration
      setTimeout(() => {
        let response = '';
        switch (action) {
          case 'explain':
            response = `I'd be happy to explain that section. The text "${selectedText}" appears to be discussing a key concept in the document. This seems to relate to the main theme and provides important context for understanding the overall content.`;
            break;
          case 'summarize':
            response = `Here's a summary of that text: The main points are focused on the core concepts presented, highlighting the essential information needed to understand this section.`;
            break;
          case 'rewrite':
            response = `Here's a clearer version: [This would be a simplified and more accessible version of the selected text, maintaining the original meaning while improving clarity.]`;
            break;
          case 'ask':
            response = `Great question about "${selectedText}"! This section is particularly important because it establishes key principles that are referenced throughout the document. Would you like me to elaborate on any specific aspect?`;
            break;
          default:
            response = `I can help you understand this content better. The selected text covers important aspects that contribute to the overall message of the document.`;
        }
        
        addMessage({
          role: 'ai',
          text: response
        });
      }, 1000);
      
      closeActionMenu();
    }
  };

  const handleHighlight = () => {
    if (selectedText) {
      closeActionMenu();
    }
  };

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        closeActionMenu();
      }
    };

    if (showActionMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showActionMenu]);

  // Reset state when document changes
  useEffect(() => {
    if (currentDocument) {
      setIsDocumentLoaded(false);
      setNumPages(0);
      setScale(1.0);
      setIsLoading(false);
      setError(null);
      closeActionMenu();
      setLoadedPages(new Set());
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
          <p className="text-gray-600 max-w-sm">Upload and select a PDF file to view it here. You'll be able to highlight text and ask questions about the content.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* CSS for hover effects */}
      <style>
        {`
          .react-pdf__Page__textContent span:hover {
            background-color: rgba(59, 130, 246, 0.1) !important;
            transition: background-color 0.2s ease !important;
          }
          .react-pdf__Page__textContent span {
            transition: background-color 0.2s ease !important;
          }
          .react-pdf__Page {
            margin: 0 auto 20px auto !important;
            display: block !important;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
            border-radius: 8px !important;
            overflow: hidden !important;
          }
          .react-pdf__Page__canvas {
            display: block !important;
            margin: 0 auto !important;
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
      <div className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 to-blue-50 p-6 relative">
        <div className="flex justify-center">
          <ContextMenu>
            <ContextMenuTrigger>
              <div 
                className="pdf-container max-w-fit mx-auto relative"
                onMouseUp={handleTextSelection}
                style={{
                  cursor: selectedText ? 'pointer' : 'default'
                }}
              >
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
                      key={`page_${index + 1}_${scale}_${textLayerError ? 'no-text' : 'text'}`}
                      pageNumber={index + 1}
                      scale={scale}
                      onLoadSuccess={() => onPageLoadSuccess(index + 1)}
                      onLoadError={(error) => onPageLoadError(error, index + 1)}
                      onRenderSuccess={() => onPageRenderSuccess(index + 1)}
                      onRenderError={(error) => onPageRenderError(error, index + 1)}
                      loading={
                        <div className="bg-white shadow-lg mx-auto flex items-center justify-center animate-pulse border border-gray-200 rounded mb-5" style={{ width: Math.max(612 * scale, 400), height: Math.max(792 * scale, 600) }}>
                          <div className="text-gray-400">Loading page {index + 1}...</div>
                        </div>
                      }
                      renderTextLayer={!textLayerError}
                      renderAnnotationLayer={!textLayerError}
                      className="pdf-page"
                    />
                  ))}
                </Document>
              </div>
            </ContextMenuTrigger>
            
            {selectedText && !textLayerError && (
              <ContextMenuContent className="w-56">
                <ContextMenuItem onClick={handleHighlight} className="cursor-pointer">
                  <div className="h-4 w-4 bg-yellow-300 rounded-sm mr-2"></div>
                  Highlight Text
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleAction('explain')} className="cursor-pointer">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Explain This
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleAction('ask')} className="cursor-pointer">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Ask Question
                </ContextMenuItem>
              </ContextMenuContent>
            )}
          </ContextMenu>
        </div>

        {/* Show warning if text layer is disabled */}
        {textLayerError && (
          <div className="absolute top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg text-sm">
            Text selection disabled for this PDF
          </div>
        )}

        {/* Floating Action Menu */}
        {showActionMenu && !textLayerError && (
          <div
            ref={actionMenuRef}
            className="fixed z-50 bg-gray-800 rounded-xl shadow-2xl p-2 flex items-center space-x-1 transform -translate-x-1/2"
            style={{
              left: `${menuPosition.x}px`,
              top: `${menuPosition.y}px`,
            }}
          >
            {/* Action Buttons */}
            <button
              onClick={() => handleAction('explain')}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Explain
            </button>
            <button
              onClick={() => handleAction('summarize')}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Summarize
            </button>
            <button
              onClick={() => handleAction('rewrite')}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Rewrite
            </button>
            
            {/* Color Dots */}
            <div className="flex space-x-1 px-2">
              <div className="w-3 h-3 rounded-full bg-red-500 cursor-pointer hover:scale-110 transition-transform"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500 cursor-pointer hover:scale-110 transition-transform"></div>
              <div className="w-3 h-3 rounded-full bg-lime-500 cursor-pointer hover:scale-110 transition-transform"></div>
              <div className="w-3 h-3 rounded-full bg-green-500 cursor-pointer hover:scale-110 transition-transform"></div>
              <div className="w-3 h-3 rounded-full bg-blue-500 cursor-pointer hover:scale-110 transition-transform"></div>
              <div className="w-3 h-3 rounded-full bg-purple-500 cursor-pointer hover:scale-110 transition-transform"></div>
              <div className="w-3 h-3 rounded-full bg-pink-500 cursor-pointer hover:scale-110 transition-transform"></div>
            </div>

            {/* Action Icons */}
            <div className="flex space-x-1 pl-2 border-l border-gray-600">
              <button
                onClick={() => handleAction('ask')}
                className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                title="Ask question about this"
              >
                <MessageCircle className="h-3 w-3" />
              </button>
              <button
                onClick={handleHighlight}
                className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                title="Highlight"
              >
                <FileText className="h-3 w-3" />
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={closeActionMenu}
              className="p-1 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors ml-2"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFViewer;
