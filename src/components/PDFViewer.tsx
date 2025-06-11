
import React, { useState, useCallback, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Printer, MessageCircle, HelpCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const PDFViewer = () => {
  const { currentDocument, addMessage } = useStore();
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [selectedText, setSelectedText] = useState<string>('');
  const [highlightedAreas, setHighlightedAreas] = useState<Array<{id: string, text: string, color: string}>>([]);
  const pageRef = useRef<HTMLDivElement>(null);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
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

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= numPages) {
      setPageNumber(page);
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString().trim());
    }
  };

  const handleExplain = () => {
    if (selectedText && currentDocument) {
      addMessage({
        role: 'user',
        text: `Please explain this text from the document: "${selectedText}"`
      });
      
      // Add a mock AI response for demonstration
      setTimeout(() => {
        addMessage({
          role: 'ai',
          text: `I'd be happy to explain that section. The text "${selectedText}" appears to be discussing a key concept in the document. This seems to relate to the main theme and provides important context for understanding the overall content.`
        });
      }, 1000);
      
      setSelectedText('');
    }
  };

  const handleAskQuestion = () => {
    if (selectedText && currentDocument) {
      addMessage({
        role: 'user',
        text: `I have a question about this text: "${selectedText}". Can you provide more details?`
      });
      
      // Add a mock AI response for demonstration
      setTimeout(() => {
        addMessage({
          role: 'ai',
          text: `Great question about "${selectedText}"! This section is particularly important because it establishes key principles that are referenced throughout the document. Would you like me to elaborate on any specific aspect?`
        });
      }, 1000);
      
      setSelectedText('');
    }
  };

  const handleHighlight = () => {
    if (selectedText) {
      const newHighlight = {
        id: Date.now().toString(),
        text: selectedText,
        color: 'bg-yellow-200'
      };
      setHighlightedAreas(prev => [...prev, newHighlight]);
      setSelectedText('');
    }
  };

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
      {/* PDF Controls */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50 flex-shrink-0">
        <div className="flex items-center justify-between">
          {/* Page Navigation */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handlePageChange(pageNumber - 1)}
              disabled={pageNumber <= 1}
              className="p-2 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="flex items-center space-x-2 bg-white rounded-lg border border-gray-200 px-3 py-1">
              <input
                type="number"
                value={pageNumber}
                onChange={(e) => handlePageChange(parseInt(e.target.value) || 1)}
                className="w-12 text-sm text-center border-none outline-none"
                min="1"
                max={numPages}
              />
              <span className="text-sm text-gray-500">/ {numPages}</span>
            </div>
            <button
              onClick={() => handlePageChange(pageNumber + 1)}
              disabled={pageNumber >= numPages}
              className="p-2 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-2 bg-white rounded-lg border border-gray-200 p-1">
            <button
              onClick={handleZoomOut}
              className="p-2 rounded-md hover:bg-gray-50 transition-colors"
            >
              <ZoomOut className="h-4 w-4 text-gray-600" />
            </button>
            <span className="text-sm text-gray-600 min-w-[3rem] text-center px-2">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 rounded-md hover:bg-gray-50 transition-colors"
            >
              <ZoomIn className="h-4 w-4 text-gray-600" />
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1" />
            <button
              onClick={handlePrint}
              className="p-2 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Printer className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* PDF Display */}
      <div className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 to-blue-50 p-6">
        <div className="flex justify-center min-h-full">
          <ContextMenu>
            <ContextMenuTrigger>
              <div 
                ref={pageRef}
                className="pdf-container shadow-2xl rounded-lg overflow-hidden bg-white border border-gray-200 hover:shadow-3xl transition-shadow duration-300 mx-auto"
                onMouseUp={handleTextSelection}
                style={{
                  cursor: selectedText ? 'pointer' : 'default',
                  maxWidth: 'fit-content'
                }}
              >
                <Document
                  file={currentDocument.url}
                  onLoadSuccess={onDocumentLoadSuccess}
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
                        <div className="text-base">Please try again or upload a different file.</div>
                      </div>
                    </div>
                  }
                  options={{
                    cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
                    cMapPacked: true,
                    standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/'
                  }}
                >
                  <Page
                    pageNumber={pageNumber}
                    scale={scale}
                    loading={
                      <div className="bg-white shadow-lg mx-auto flex items-center justify-center animate-pulse border border-gray-200 rounded" style={{ width: Math.max(612 * scale, 400), height: Math.max(792 * scale, 600) }}>
                        <div className="text-gray-400">Loading page...</div>
                      </div>
                    }
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    className="pdf-page"
                  />
                </Document>
              </div>
            </ContextMenuTrigger>
            
            {selectedText && (
              <ContextMenuContent className="w-56">
                <ContextMenuItem onClick={handleHighlight} className="cursor-pointer">
                  <div className="h-4 w-4 bg-yellow-300 rounded-sm mr-2"></div>
                  Highlight Text
                </ContextMenuItem>
                <ContextMenuItem onClick={handleExplain} className="cursor-pointer">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Explain This
                </ContextMenuItem>
                <ContextMenuItem onClick={handleAskQuestion} className="cursor-pointer">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Ask Question
                </ContextMenuItem>
              </ContextMenuContent>
            )}
          </ContextMenu>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
