
import React from 'react';
import { Upload, FileText, Settings } from 'lucide-react';
import { useStore } from '../store/useStore';
import { PDFDocument } from '../types';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const AppSidebar = () => {
  const { documents, currentDocument, addDocument, setCurrentDocument } = useStore();
  const { state } = useSidebar();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      const document: PDFDocument = {
        id: Date.now().toString(),
        name: file.name,
        file: file,
        url: URL.createObjectURL(file),
      };
      addDocument(document);
      setCurrentDocument(document);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
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
      setCurrentDocument(document);
    }
  };

  const isCollapsed = state === "collapsed";

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="border-b border-gray-200 p-4">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900">Documents</span>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="p-0">
        <SidebarGroup>
          <div className="p-4">
            <div
              className={`border-2 border-dashed border-blue-300 rounded-xl p-4 text-center hover:border-blue-400 transition-all cursor-pointer bg-blue-50/50 hover:bg-blue-50 ${
                isCollapsed ? 'aspect-square' : ''
              }`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <Upload className={`mx-auto text-blue-500 mb-2 ${isCollapsed ? 'h-6 w-6' : 'h-8 w-8'}`} />
              {!isCollapsed && (
                <>
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
                </>
              )}
              {isCollapsed && (
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {!isCollapsed && (
            <SidebarGroupContent>
              <div className="px-4 pb-4">
                <SidebarGroupLabel className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Recent Files
                </SidebarGroupLabel>
                <SidebarMenu>
                  {documents.map((doc) => (
                    <SidebarMenuItem key={doc.id}>
                      <SidebarMenuButton
                        onClick={() => setCurrentDocument(doc)}
                        className={`w-full justify-start gap-3 p-3 rounded-lg transition-all ${
                          currentDocument?.id === doc.id
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <FileText className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm truncate">{doc.name}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  {documents.length === 0 && (
                    <div className="text-center py-8">
                      <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No documents uploaded yet</p>
                    </div>
                  )}
                </SidebarMenu>
              </div>
            </SidebarGroupContent>
          )}
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
