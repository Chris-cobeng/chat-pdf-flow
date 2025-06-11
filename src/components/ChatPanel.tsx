
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { useStore } from '../store/useStore';

const ChatPanel = () => {
  const { messages, currentDocument, addMessage, isLoading, setLoading } = useStore();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !currentDocument) return;

    const userMessage = inputValue.trim();
    setInputValue('');

    // Add user message
    addMessage({ role: 'user', text: userMessage });

    try {
      setLoading(true);
      
      // Simulate API call with mock response
      setTimeout(() => {
        const responses = [
          "Based on the document, I can help you understand that concept better. The content suggests...",
          "That's an excellent question about the document. From what I can analyze...",
          "Looking at the specific section you're asking about, it appears that...",
          "The document provides detailed information on this topic. Let me explain...",
          "This is a key point in the document. The main ideas include..."
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        addMessage({ 
          role: 'ai', 
          text: randomResponse + " " + userMessage.toLowerCase().includes('explain') 
            ? "The explanation involves several key components that work together to form the complete picture."
            : "Would you like me to elaborate on any specific aspect of this topic?"
        });
        setLoading(false);
      }, 1500);
      
    } catch (error) {
      addMessage({ 
        role: 'ai', 
        text: 'Sorry, I encountered an error. Please try again.' 
      });
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
            {currentDocument && (
              <p className="text-sm text-gray-600">Discussing: {currentDocument.name}</p>
            )}
          </div>
        </div>
      </div>

      {/* Chat Messages - Fixed height with internal scroll */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100">
              <Bot className="mx-auto h-12 w-12 text-blue-500 mb-3" />
              <h4 className="font-medium text-gray-900 mb-2">Ready to help!</h4>
              <p className="text-sm text-gray-600">
                Upload a PDF and start asking questions. You can also select text in the document for quick explanations.
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {message.role === 'ai' && (
                      <div className="h-6 w-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot className="h-3 w-3 text-white" />
                      </div>
                    )}
                    {message.role === 'user' && (
                      <div className="h-6 w-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <User className="h-3 w-3 text-white" />
                      </div>
                    )}
                    <div className="text-sm leading-relaxed">{message.text}</div>
                  </div>
                  <div className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl px-4 py-3 max-w-[85%] border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="h-6 w-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                      <Bot className="h-3 w-3 text-white" />
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Chat Input - Fixed at bottom */}
      <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
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
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || !currentDocument || isLoading}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
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
