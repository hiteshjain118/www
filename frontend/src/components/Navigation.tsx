import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navigation: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if we're on a demo page or thread page
  const isDemoPage = location.pathname.startsWith('/demo');
  const isThreadPage = location.pathname.startsWith('/thread') || location.pathname === '/create';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
    setIsDropdownOpen(false);
  };

  const handleProfileClick = () => {
    navigate('/profile');
    setIsDropdownOpen(false);
  };

  const handleCreateClick = () => {
    navigate('/create');
    setIsDropdownOpen(false);
  };

  const handleDebugClick = () => {
    navigate('/intern/message');
    setIsDropdownOpen(false);
  };

  const handleAgentsClick = () => {
    navigate('/agents');
    setIsDropdownOpen(false);
  };

  const handlePrivacyClick = () => {
    navigate('/privacy-policy');
    setIsDropdownOpen(false);
  };

  const handleTermsClick = () => {
    navigate('/terms-of-service');
    setIsDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <nav className="bg-white shadow-md border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center h-16">
        {/* Logo - Far Left */}
        <div className="flex items-center pl-4">
            <img
              src="/logo.png"
              alt="Coral Bricks"
              className="h-8 w-auto"
            />
            <span className="ml-2 text-xl font-semibold text-gray-900">
              {isDemoPage ? 'Demo' : isThreadPage ? '' : 'Imports'}
            </span>
          </div>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* User Menu - Far Right */}
        {user ? (
          <div className="relative pr-4" ref={dropdownRef}>
            <button
              onClick={toggleDropdown}
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md px-3 py-2"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user.email.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium">{user.email}</span>
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                <button
                  onClick={handleProfileClick}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                >
                  Imports
                </button>

                <button
                  onClick={handleDebugClick}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                >
                  Debug Tools
                </button>
                
                <div className="border-t border-gray-200 my-1"></div>
                
                <button
                  onClick={handleAgentsClick}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                >
                  Agents
                </button>
                
                <button
                  onClick={handlePrivacyClick}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                >
                  Privacy Policy
                </button>
                
                <button
                  onClick={handleTermsClick}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                >
                  Terms of Service
                </button>
                
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          // Public navigation menu for unauthenticated users
          <div className="flex items-center space-x-4 pr-4">
            <button
              onClick={handleAgentsClick}
              className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium"
            >
              Agents
            </button>
            <button
              onClick={handlePrivacyClick}
              className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium"
            >
              Privacy
            </button>
            <button
              onClick={handleTermsClick}
              className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium"
            >
              Terms
            </button>
            <button
              onClick={() => navigate('/login')}
              className="bg-coral-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-coral-700 focus:outline-none focus:ring-2 focus:ring-coral-500"
            >
              Login
            </button>
          </div>
        )}
        </div>
      </nav>
  );
};

export default Navigation; 