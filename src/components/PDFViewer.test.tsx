// src/components/PDFViewer.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import PDFViewer from './PDFViewer';
// import { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'; // Types for mocking

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ZoomIn: () => <div>ZoomIn Icon</div>,
  ZoomOut: () => <div>ZoomOut Icon</div>,
  Printer: () => <div>Printer Icon</div>,
  Search: () => <div>Search Icon</div>,
  ChevronLeft: () => <div>ChevronLeft Icon</div>,
  ChevronRight: () => <div>ChevronRight Icon</div>,
}));

// Mock useStore
const mockUseStore = vi.fn();
vi.mock('../store/useStore', () => ({
  useStore: () => mockUseStore(),
}));

// Mock pdfjs worker
global.pdfjs = {
    GlobalWorkerOptions: {
        workerSrc: ''
    },
    version: 'test-version' // Add version property
};

// Mock react-pdf
// This will be a more complex mock
const mockGetTextContent = vi.fn();
const mockGetPage = vi.fn(() => Promise.resolve({
  getTextContent: mockGetTextContent,
  getViewport: vi.fn(() => ({ width: 600, height: 800 })), // Mock getViewport
}));

const mockPdfProxy = {
  numPages: 0, // Default, will be overridden in tests
  getPage: mockGetPage,
  destroy: vi.fn(() => Promise.resolve()), // Mock destroy method
};

const mockDocumentLoadSuccess = vi.fn();

vi.mock('react-pdf', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    Document: vi.fn(({ onLoadSuccess, children, ...props }) => {
      // Call onLoadSuccess with a mock PDFDocumentProxy if it's provided
      // This allows tests to trigger document loading
      mockDocumentLoadSuccess.mockImplementation(onLoadSuccess); // Store the onLoadSuccess callback
      // Simulate children rendering if needed, or just return them
      return <div data-testid="mock-document" {...props}>{children}</div>;
    }),
    Page: vi.fn(({ pageNumber, customTextRenderer, ...props }) => {
      // Simple mock for Page, can be expanded
      // If customTextRenderer is provided, we might want to call it with mock data
      // For now, just render a placeholder.
      let textContentToRender = `Mock Page ${pageNumber}`;
      if (customTextRenderer && typeof customTextRenderer === 'function') {
        // This is a simplified way to acknowledge customTextRenderer.
        // A real test of customTextRenderer would need more infrastructure.
        // const mockTextItem = { str: `Content of page ${pageNumber}`, dir: 'ltr', width: 10, height: 10, transform: [], fontName: 'sans-serif' };
        // textContentToRender = customTextRenderer(mockTextItem, 0);
      }
      return <div data-testid={`mock-page-${pageNumber}`} {...props}>{textContentToRender}</div>;
    }),
    pdfjs: global.pdfjs, // Ensure our global mock is used by react-pdf mocks
  };
});


describe('PDFViewer', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockUseStore.mockReset();
    mockGetTextContent.mockReset();
    mockGetPage.mockClear(); // Use mockClear for functions that return promises or have complex internal state
    mockDocumentLoadSuccess.mockReset();
    mockPdfProxy.numPages = 0; // Reset numPages
    mockPdfProxy.destroy.mockClear();


    // Default store state
    mockUseStore.mockReturnValue({
      currentDocument: null,
      // other store properties as needed by PDFViewer
    });
  });

  afterEach(() => {
    vi.clearAllMocks(); // Clears all mocks, including spies.
  });


  it('renders correctly without a document', () => {
    render(<PDFViewer />);
    expect(screen.getByText('No PDF Selected')).toBeInTheDocument();
    expect(screen.getByText('Upload and select a PDF file to view it here.')).toBeInTheDocument();
  });

  it('renders toolbar elements when a document is provided', async () => {
    mockUseStore.mockReturnValue({
      currentDocument: { url: 'test.pdf', name: 'Test PDF' },
    });
    render(<PDFViewer />);

    // Check for some toolbar elements
    // Note: Icons are mocked, so we check for their text content if they render any, or their wrapper.
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    expect(screen.getByText('ZoomIn Icon')).toBeInTheDocument(); // Assuming mock renders text
    expect(screen.getByText('ZoomOut Icon')).toBeInTheDocument();
    expect(screen.getByText('Printer Icon')).toBeInTheDocument();
    expect(screen.getByText('Search Icon')).toBeInTheDocument();
    expect(screen.getByText('ChevronLeft Icon')).toBeInTheDocument();
    expect(screen.getByText('ChevronRight Icon')).toBeInTheDocument();
  });

  it('updates search query input correctly', () => {
    mockUseStore.mockReturnValue({
      currentDocument: { url: 'test.pdf', name: 'Test PDF' },
    });
    render(<PDFViewer />);
    const searchInput = screen.getByPlaceholderText('Search...') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'hello world' } });
    expect(searchInput.value).toBe('hello world');
  });

  describe('Search Functionality', () => {
    const setupDocumentLoad = (pagesContent: {str: string}[][]) => {
      mockUseStore.mockReturnValue({
        currentDocument: { url: 'test.pdf', name: 'Test PDF' },
      });

      // Configure the mockPdfProxy and related functions
      mockPdfProxy.numPages = pagesContent.length;
      mockGetPage.mockImplementation((pageNumber: number) => {
        if (pageNumber > 0 && pageNumber <= pagesContent.length) {
          return Promise.resolve({
            getTextContent: () => Promise.resolve({ items: pagesContent[pageNumber - 1] }),
            getViewport: vi.fn(() => ({ width: 600, height: 800 })),
          });
        }
        return Promise.reject(new Error('Invalid page number'));
      });

      render(<PDFViewer />);

      // Trigger document load
      // The Document mock calls mockDocumentLoadSuccess with the onLoadSuccess callback
      // We then call this stored callback with our mockPdfProxy
      if (mockDocumentLoadSuccess.mock.calls.length > 0) {
        const onLoadSuccessCallback = mockDocumentLoadSuccess.mock.calls[0][0];
        onLoadSuccessCallback(mockPdfProxy);
      } else {
        throw new Error("Document's onLoadSuccess was not captured by the mock.");
      }
    };

    it('executes search and finds results', async () => {
      setupDocumentLoad([[{ str: 'This is a test page.' }], [{ str: 'Another page with searchable text here.' }]]);

      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'searchable text' } });

      const searchButton = screen.getByText('Search Icon').closest('button');
      expect(searchButton).not.toBeNull();
      fireEvent.click(searchButton!);

      await waitFor(() => {
        expect(screen.getByText('1 of 1')).toBeInTheDocument(); // Result display
      });
      expect(screen.getByText('1 result(s) found.')).toBeInTheDocument(); // Search message
    });

    it('executes search and finds no results', async () => {
      setupDocumentLoad([[{ str: 'This is a test page.' }], [{ str: 'Another page.' }]]);

      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      const searchButton = screen.getByText('Search Icon').closest('button');
      expect(searchButton).not.toBeNull();
      fireEvent.click(searchButton!);

      await waitFor(() => {
        expect(screen.getByText('No results found.')).toBeInTheDocument();
      });
      // Check that result display is empty or "0 of 0"
      const resultDisplay = screen.getByText((content, element) => {
        // Regex to match "0 of 0" or an empty span if that's how it's rendered
        return element?.tagName.toLowerCase() === 'span' && (content === '0 of 0' || content.trim() === '');
      });
      expect(resultDisplay).toBeInTheDocument();
    });

    it('navigates through multiple search results', async () => {
      setupDocumentLoad([
        [{ str: 'First result here.' }],
        [{ str: 'Second result also here.' }],
        [{ str: 'Third result is here too.' }]
      ]);

      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'result' } });

      const searchButton = screen.getByText('Search Icon').closest('button');
      fireEvent.click(searchButton!);

      await waitFor(() => expect(screen.getByText('1 of 3')).toBeInTheDocument());

      const nextButton = screen.getByText('ChevronRight Icon').closest('button');
      const prevButton = screen.getByText('ChevronLeft Icon').closest('button');

      fireEvent.click(nextButton!);
      await waitFor(() => expect(screen.getByText('2 of 3')).toBeInTheDocument());

      fireEvent.click(nextButton!);
      await waitFor(() => expect(screen.getByText('3 of 3')).toBeInTheDocument());

      fireEvent.click(nextButton!); // Loop back
      await waitFor(() => expect(screen.getByText('1 of 3')).toBeInTheDocument());

      fireEvent.click(prevButton!); // Loop back to end
      await waitFor(() => expect(screen.getByText('3 of 3')).toBeInTheDocument());

      fireEvent.click(prevButton!);
      await waitFor(() => expect(screen.getByText('2 of 3')).toBeInTheDocument());
    });

    it('clears search results when input is cleared', async () => {
      setupDocumentLoad([[{ str: 'Some text to find.' }]]);

      const searchInput = screen.getByPlaceholderText('Search...') as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: 'find' } });

      const searchButton = screen.getByText('Search Icon').closest('button');
      fireEvent.click(searchButton!);

      await waitFor(() => expect(screen.getByText('1 of 1')).toBeInTheDocument());

      fireEvent.change(searchInput, { target: { value: '' } });

      await waitFor(() => {
        // Search message should be cleared or indicate no search
        const searchMessageElement = screen.queryByText(/result\(s\) found/);
        expect(searchMessageElement).toBeNull();
      });
      // Result display should be cleared
      const resultDisplay = screen.getByText((content, element) => {
         return element?.tagName.toLowerCase() === 'span' && content.trim() === '';
      });
      expect(resultDisplay).toBeInTheDocument();
    });
  });

  // Conceptual test for customTextRenderer (very simplified)
  it('Page component receives customTextRenderer prop when searching', async () => {
    // This test is more about ensuring the prop is passed.
    // Testing the actual rendering output of customTextRenderer is complex here.
    const PageMock = vi.spyOn(await import('react-pdf'), 'Page');

    mockUseStore.mockReturnValue({
      currentDocument: { url: 'test.pdf', name: 'Test PDF' },
    });
    render(<PDFViewer />);

    // Simulate document load
    if (mockDocumentLoadSuccess.mock.calls.length > 0) {
      const onLoadSuccessCallback = mockDocumentLoadSuccess.mock.calls[0][0];
      mockPdfProxy.numPages = 1; // Simulate one page
      mockGetPage.mockResolvedValueOnce({ // Ensure getPage returns a promise
        getTextContent: () => Promise.resolve({ items: [{ str: 'searchable content' }] }),
        getViewport: vi.fn(() => ({ width: 600, height: 800 })),
      });
      onLoadSuccessCallback(mockPdfProxy);
    } else {
      throw new Error("Document's onLoadSuccess was not captured.");
    }

    await waitFor(() => expect(screen.getByTestId('mock-page-1')).toBeInTheDocument());

    // Perform a search
    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'content' } });
    const searchButton = screen.getByText('Search Icon').closest('button');
    fireEvent.click(searchButton!);

    await waitFor(() => {
      // Check if Page mock was called with customTextRenderer
      // This relies on Page mock being sophisticated enough or spying on its props
      expect(PageMock).toHaveBeenCalled();
      const lastCallArgs = PageMock.mock.calls[PageMock.mock.calls.length -1][0];
      expect(lastCallArgs).toHaveProperty('customTextRenderer');
      expect(typeof lastCallArgs.customTextRenderer).toBe('function');
    });
    PageMock.mockRestore(); // Restore original Page component if other tests need it unspied
  });

});
