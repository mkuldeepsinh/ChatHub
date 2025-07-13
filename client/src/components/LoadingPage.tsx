import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface LoadingPageProps {
  text?: string;
  subtitle?: string;
}

const LoadingPage: React.FC<LoadingPageProps> = ({ 
  text = 'Loading ChatHub...', 
  subtitle = 'Connecting to your conversations' 
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating circles */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gray-600/10 rounded-full animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-gray-500/10 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-3/4 w-16 h-16 bg-gray-400/10 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Subtle gradient orbs */}
        <div className="absolute top-1/3 right-1/3 w-48 h-48 bg-gradient-to-r from-gray-700/10 to-gray-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 left-1/3 w-64 h-64 bg-gradient-to-r from-gray-600/10 to-gray-700/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>
      
      {/* Main content */}
      <div className="relative z-10 text-center">
        {/* Logo and branding */}
        <div className="mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-lg mx-auto mb-4 animate-pulse">
            C
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            ChatHub
          </h1>
          <p className="text-gray-400 text-lg">Your Secure Messaging Platform</p>
        </div>
        
        {/* Loading spinner */}
        <LoadingSpinner size="lg" text={text} showLogo={false} />
        
        {/* Subtitle */}
        {subtitle && (
          <p className="text-gray-400 mt-6 text-sm animate-pulse">
            {subtitle}
          </p>
        )}
        
        {/* Progress bar */}
        <div className="w-64 h-1 bg-gray-700 rounded-full mt-8 mx-auto overflow-hidden">
          <div className="h-full bg-gray-500 rounded-full animate-pulse" style={{ width: '60%' }}></div>
        </div>
      </div>
      
      {/* Bottom text */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-gray-500 text-sm">
        Made with ❤️ by Kuldeepsinh Makwana
      </div>
    </div>
  );
};

export default LoadingPage; 