
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Document, Page, pdfjs, PDFDocumentProxy } from 'react-pdf';
import type { TextItem } from 'pdfjs-dist/types/src/display/api'; // Import TextItem
import { ZoomIn, ZoomOut, Printer, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';

// Set up PDF.js worker with better configuration
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

// Define type for search results
interface SearchResult {
  pageIndex: number; // 0-based index of the page
  // Storing more detailed info like textOffset or bounding boxes would go here
  // For now, keeping it simple, but we'll need to highlight based on this.
  // Let's assume we get text items and can identify which one matched.
  textItemIndex?: number; // Index of the text item within page's textContent.items
  pageNumber: number; // 1-based page number for display and navigation
}

const PDFViewer = () => {
  const { currentDocument } = useStore();
  const [numPages, setNumPages] = useState<number>(0);
  const [pdfProxy, setPdfProxy] = useState<PDFDocumentProxy | null>(null);
  const [scale, setScale] = useState<number>(1.0);
  const [isDocumentLoaded, setIsDocumentLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(800);
  const containerRef = useRef<HTMLDivElement>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState<number>(-1);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchMessage, setSearchMessage] = useState<string>("");
  const [searchInstanceKey, setSearchInstanceKey] = useState<number>(0); // Used to force page re-renders for highlighting

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

  const onDocumentLoadSuccess = useCallback((pdf: PDFDocumentProxy) => {
    console.log('PDF loaded successfully with', pdf.numPages, 'pages');
    setNumPages(pdf.numPages);
    setPdfProxy(pdf); // Store the PDF proxy object
    setIsDocumentLoaded(true);
    setIsLoading(false);
    setError(null);
    // Reset search state on new document load
    setSearchQuery("");
    setSearchResults([]);
    setCurrentResultIndex(-1);
    setTotalResults(0);
    setIsSearching(false);
    setSearchMessage("");
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
      setPdfProxy(null);
      setScale(1.0);
      setIsLoading(false);
      setError(null);
      // Clear search state as well
      setSearchQuery("");
      setSearchResults([]);
      setCurrentResultIndex(-1);
      setTotalResults(0);
      setIsSearching(false);
      setSearchMessage("");
    }
  }, [currentDocument]);

  const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = event.target.value;
    setSearchQuery(newQuery);
    if (newQuery === "") {
      setSearchResults([]);
      setTotalResults(0);
      setCurrentResultIndex(-1);
      setSearchMessage("");
      setSearchInstanceKey(prev => prev + 1); // Force re-render to clear highlights
    }
  };

  const executeSearch = async () => {
    if (!pdfProxy || !searchQuery.trim()) {
      setSearchResults([]);
      setTotalResults(0);
      setCurrentResultIndex(-1);
      setSearchMessage(searchQuery.trim() ? "Document not loaded." : "");
      setSearchInstanceKey(prev => prev + 1); // Force re-render to clear highlights
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setSearchMessage("");
    setSearchResults([]);
    setTotalResults(0);
    setCurrentResultIndex(-1);

    const query = searchQuery.trim().toLowerCase();
    const newResults: SearchResult[] = [];

    try {
      for (let i = 1; i <= pdfProxy.numPages; i++) {
        const page = await pdfProxy.getPage(i);
        const textContent = await page.getTextContent();
        textContent.items.forEach((item: TextItem, itemIndex: number) => {
          if (item.str.toLowerCase().includes(query)) {
            newResults.push({
              pageIndex: i - 1, // 0-based
              pageNumber: i,    // 1-based
              textItemIndex: itemIndex,
            });
          }
        });
      }

      setSearchResults(newResults);
      setTotalResults(newResults.length);
      if (newResults.length > 0) {
        setCurrentResultIndex(0);
        setSearchMessage(`${newResults.length} result(s) found.`);
      } else {
        setSearchMessage("No results found.");
      }
      setSearchInstanceKey(prev => prev + 1); // Update key to trigger re-render for highlighting
    } catch (e) {
      console.error("Error during search:", e);
      setSearchMessage("Error occurred during search.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleNextResult = () => {
    if (totalResults > 0) {
      setCurrentResultIndex((prevIndex) => (prevIndex + 1) % totalResults);
    }
  };

  const handlePreviousResult = () => {
    if (totalResults > 0) {
      setCurrentResultIndex((prevIndex) => (prevIndex - 1 + totalResults) % totalResults);
    }
  };

  // Scroll to active result
  useEffect(() => {
    if (!isDocumentLoaded || currentResultIndex < 0 || searchResults.length === 0) {
      return;
    }

    const currentResult = searchResults[currentResultIndex];
    if (currentResult) {
      const pageElement = document.getElementById(`pdf-page-${currentResult.pageNumber}`);
      if (pageElement) {
        // Check if element is already in view to avoid unnecessary scrolling
        const rect = pageElement.getBoundingClientRect();
        const isVisible =
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
          rect.right <= (window.innerWidth || document.documentElement.clientWidth);

        if (!isVisible) {
            pageElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }
  }, [currentResultIndex, searchResults, isDocumentLoaded, scale]); // scale dependency in case zoom changes page layout

  const customTextRendererWrapper = useCallback((pageNumberToRender: number) => (textItem: TextItem, itemIndex: number): React.ReactNode => {
    if (!searchQuery.trim() || searchResults.length === 0) {
      return textItem.str;
    }

    const pageSpecificMatch = searchResults.find(
      (result) => result.pageNumber === pageNumberToRender && result.textItemIndex === itemIndex
    );

    if (!pageSpecificMatch) {
      return textItem.str;
    }

    const isCurrentActiveMatch = currentResultIndex !== -1 &&
                                 searchResults[currentResultIndex]?.pageNumber === pageNumberToRender &&
                                 searchResults[currentResultIndex]?.textItemIndex === itemIndex;

    const query = searchQuery.trim();
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const parts = textItem.str.split(regex);

    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark
              key={index}
              className={isCurrentActiveMatch ? 'current-search-highlight' : 'search-highlight'}
            >
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  }, [searchQuery, searchResults, currentResultIndex, searchInstanceKey]); // searchInstanceKey ensures this re-runs when needed


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
          .search-highlight {
            background-color: rgba(255, 255, 0, 0.5); /* Yellow with some transparency */
          }
          .current-search-highlight {
            background-color: rgba(255, 165, 0, 0.7); /* Orange with some transparency */
            font-weight: bold;
          }
          .react-pdf__Page__textContent { /* Ensure text layer is above canvas */
            z-index: 1;
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

            {/* Search Controls */}
            <div className="w-px h-6 bg-gray-200 mx-1" />
            <input
              type="text"
              placeholder="Search..."
              className="p-2 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-700 w-32"
              value={searchQuery}
              onChange={handleSearchInputChange}
              disabled={!isDocumentLoaded || isSearching}
            />
            <button
              onClick={executeSearch}
              disabled={!isDocumentLoaded || isSearching || !searchQuery.trim()}
              className="p-2 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Search className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={handlePreviousResult}
              disabled={!isDocumentLoaded || totalResults === 0}
              className="p-2 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={handleNextResult}
              disabled={!isDocumentLoaded || totalResults === 0}
              className="p-2 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </button>
            <span className="text-sm text-gray-600 px-2 min-w-[50px] text-center">
              {totalResults > 0 ? `${currentResultIndex + 1} of ${totalResults}` : totalResults === 0 && searchQuery ? "0 of 0" : ""}
            </span>
          </div>
        </div>
        {searchMessage && (
          <div className="mt-2 text-sm text-gray-600 text-center">{searchMessage}</div>
        )}
      </div>

      {/* PDF Display - Vertical Scrollable */}
      <div ref={containerRef} className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 to-blue-50 p-6">
        <div className="flex justify-center">
          <div className="pdf-container max-w-full mx-auto">
            <Document
              file={currentDocument.url}
              onLoadSuccess={(pdf) => onDocumentLoadSuccess(pdf)} // Pass the pdf proxy
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
              {isDocumentLoaded && Array.from(new Array(numPages), (el, pageIdx) => {
                const pageNumber = pageIdx + 1;
                return (
                  // Wrapper div for scrolling and unique key for mounting
                  <div key={`page-wrapper-${pageNumber}`} id={`pdf-page-${pageNumber}`} className="mb-5 relative">
                    <Page
                      key={`page_${pageNumber}_${scale}_${searchInstanceKey}`} // Key includes searchInstanceKey
                      pageNumber={pageNumber}
                      width={Math.min(containerWidth * scale, containerWidth)}
                      onLoadError={(error) => onPageLoadError(error, pageNumber)}
                      onRenderError={(error) => onPageRenderError(error, pageNumber)}
                      customTextRenderer={customTextRendererWrapper(pageNumber)}
                      loading={
                        <div className="bg-white shadow-lg mx-auto flex items-center justify-center animate-pulse border border-gray-200 rounded mb-5" style={{ width: Math.min(containerWidth * scale, containerWidth), height: Math.min(containerWidth * scale * 1.414, containerWidth * 1.414) }}>
                          <div className="text-gray-400">Loading page {pageNumber}...</div>
                        </div>
                      }
                      renderTextLayer={true}
                      renderAnnotationLayer={false}
                      className="pdf-page"
                    />
                  </div>
                );
              })}
            </Document>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
