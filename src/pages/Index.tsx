
import React from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '../components/AppSidebar';
import PDFViewer from '../components/PDFViewer';
import ChatPanel from '../components/ChatPanel';

const Index = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              PDF Chat SaaS
            </h1>
          </div>
        </header>
        
        <div className="flex w-full pt-20 h-screen">
          {/* Collapsible Sidebar */}
          <AppSidebar />
          
          {/* Main Content Area */}
          <div className="flex flex-1 gap-4 p-4 h-full overflow-hidden">
            {/* Center - PDF Viewer */}
            <div className="flex-1 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden min-w-0">
              <PDFViewer />
            </div>
            
            {/* Right - Chat Panel - Fixed width and position */}
            <div className="w-80 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex-shrink-0">
              <ChatPanel />
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
