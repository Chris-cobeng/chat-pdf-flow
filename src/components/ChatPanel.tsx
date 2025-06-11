
import React, { useState } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { useStore } from '../store/useStore';
import axios from 'axios';

const ChatPanel = () => {
  const { messages, currentDocument, addMessage, isLoading, setLoading } = useStore();
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !currentDocument) return;

    const userMessage = inputValue.trim();
    setInputValue('');

    // Add user message
    addMessage({ role: 'user', text: userMessage });

    try {
      setLoading(true);
      
      // Call API
      const response = await axios.post('/api/chat', {
        docId: currentDocument.id,
        question: userMessage,
      });

      // Add AI response
      addMessage({ role: 'ai', text: response.data.message });
    } catch (error) {
      addMessage({ 
        role: 'ai', 
        text: 'Sorry, I encountered an error. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-medium text-gray-900">Chat</h3>
        {currentDocument && (
          <p className="text-sm text-gray-600">Ask questions about {currentDocument.name}</p>
        )}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Bot className="mx-auto h-8 w-8 mb-2" />
            <p>No messages yet. Upload a PDF and start asking questions!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {message.role === 'ai' && <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                  {message.role === 'user' && <User className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                  <div className="text-sm">{message.text}</div>
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-[80%]">
              <div className="flex items-center space-x-2">
                <Bot className="h-4 w-4" />
                <div className="text-sm text-gray-600">AI is thinking...</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSubmit}>
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                currentDocument 
                  ? "Ask a question about the PDF..." 
                  : "Select a PDF to start chatting"
              }
              disabled={!currentDocument || isLoading}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || !currentDocument || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;
