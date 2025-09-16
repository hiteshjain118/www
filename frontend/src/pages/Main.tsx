import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { 
  ChatBubbleLeftRightIcon,
  PlusIcon,
  ArrowLeftIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const Main: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="flex-1 flex min-h-0 h-full">
      {/* Chat Panel */}
      <div className="w-full bg-white flex flex-col min-h-0 h-full">

        {/* Main Content - Welcome Message */}
        <div className="flex-1 flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-md"
          >
            <div className="w-16 h-16 bg-gradient-to-r from-coral-500 to-brick-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <SparklesIcon className="w-8 h-8 text-white" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome back, {user?.email.split('@')[0]}! 👋
            </h1>
            
            <p className="text-gray-600 mb-8 leading-relaxed">
              Ready to build something amazing with AI? Get started by creating a new thread or exploring your existing conversations in the sidebar.
            </p>

            {/* Nudge to use sidebar */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
            >
              <div className="flex items-center space-x-3">
                <ArrowLeftIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-medium text-blue-900">
                    Start building your AI agent
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Click "New Thread" in the sidebar to begin a conversation with our AI agent builder, or select an existing thread to continue where you left off.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Quick action button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <button
                onClick={() => window.location.href = '/create'}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-coral-600 to-brick-600 text-white font-medium rounded-lg hover:from-coral-700 hover:to-brick-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Create Your First Agent
              </button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Main;
