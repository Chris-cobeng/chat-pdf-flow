
import React from 'react';
import Sidebar from '../components/Sidebar';
import PDFViewer from '../components/PDFViewer';
import ChatPanel from '../components/ChatPanel';

const Index = () => {
  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">PDF Chat SaaS</h1>
      </header>
      
      {/* Main Content - 3 Column Layout */}
      <div className="flex-1 grid grid-cols-12 gap-4 p-4 min-h-0">
        {/* Left Sidebar - Upload & Documents */}
        <div className="col-span-3 bg-white rounded-lg shadow-sm border border-gray-200">
          <Sidebar />
        </div>
        
        {/* Center - PDF Viewer */}
        <div className="col-span-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <PDFViewer />
        </div>
        
        {/* Right - Chat Panel */}
        <div className="col-span-3 bg-white rounded-lg shadow-sm border border-gray-200">
          <ChatPanel />
        </div>
      </div>
    </div>
  );
};

export default Index;
