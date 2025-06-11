
import React, { useCallback } from 'react';
import { Upload, FileText } from 'lucide-react';
import { useStore } from '../store/useStore';
import { PDFDocument } from '../types';

const Sidebar = () => {
  const { documents, currentDocument, addDocument, setCurrentDocument } = useStore();

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      const document: PDFDocument = {
        id: Date.now().toString(),
        name: file.name,
        file: file,
        url: URL.createObjectURL(file),
      };
      addDocument(document);
    }
  }, [addDocument]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      const document: PDFDocument = {
        id: Date.now().toString(),
        name: file.name,
        file: file,
        url: URL.createObjectURL(file),
      };
      addDocument(document);
    }
  }, [addDocument]);

  return (
    <div className="h-full flex flex-col">
      {/* Upload Section */}
      <div className="p-4 border-b border-gray-200">
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 mb-2">Drag & drop PDF files here</p>
          <label className="cursor-pointer">
            <span className="text-blue-600 hover:text-blue-500 text-sm font-medium">
              Choose files
            </span>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Documents List */}
      <div className="flex-1 p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Documents</h3>
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                currentDocument?.id === doc.id
                  ? 'bg-blue-50 border border-blue-200'
                  : 'hover:bg-gray-50 border border-transparent'
              }`}
              onClick={() => setCurrentDocument(doc)}
            >
              <FileText className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
              <span className="text-sm text-gray-900 truncate">{doc.name}</span>
            </div>
          ))}
          {documents.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-8">
              No documents uploaded yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
