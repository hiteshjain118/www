import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { 
  UserIcon, 
  BuildingOfficeIcon, 
  LinkIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';

import apiClient from '../services/api';
import ThreadsSidebar from '../components/ThreadsSidebar';

interface QBCompany {
  realm_id: string;
  company_name?: string;
  connected: boolean;
  last_connected?: string;
}

interface QBProfile {
  realm_id: string;
  connected: boolean;
  has_valid_token: boolean;
  user_id: string;
  cbid: string; // Changed from bigint to string since backend sends it as string
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [qbProfile, setQbProfile] = useState<QBProfile | null>(null);
  const [qbCompanies, setQbCompanies] = useState<QBCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  // Debug logging
  console.log('Profile component rendered with user:', user);
  console.log('AuthContext loading state:', loading);

  // Handle URL parameters for QuickBooks connection status
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const connected = urlParams.get('connected');
    const realmId = urlParams.get('realm_id');
    const errorParam = urlParams.get('error');

    if (connected === 'true') {
      setSuccessMessage(`Successfully connected to QuickBooks! ${realmId ? `(Company ID: ${realmId})` : ''}`);
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (errorParam) {
      let errorMessage = 'Failed to connect to QuickBooks';
      switch (errorParam) {
        case 'token_storage_failed':
          errorMessage = 'Failed to store QuickBooks connection tokens';
          break;
        case 'connection_failed':
          errorMessage = 'Failed to connect to QuickBooks. Please try again';
          break;
        case 'callback_error':
          errorMessage = 'An error occurred during QuickBooks authentication';
          break;
        case 'missing_auth_code':
        case 'missing_realm_id':
        case 'missing_state':
          errorMessage = 'QuickBooks authentication failed - missing required parameters';
          break;
      }
      setError(errorMessage);
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    console.log('Profile useEffect triggered, user?.cbid:', user?.cbid);
    if (user?.cbid) {
      fetchUserData();
    } else {
      console.log('No user or no cbid, setting loading to false');
      setLoading(false);
    }
  }, [user?.cbid]);

  const fetchUserData = async () => {
    if (!user?.cbid) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);

      // Fetch user profile using API client
      const profileResponse = await apiClient.getUserProfile(user.cbid);
      if (profileResponse.success && profileResponse.data) {
        console.log('Profile data received:', profileResponse.data);
        setUserProfile(profileResponse.data);
      } else {
        console.warn('Could not fetch user profile:', profileResponse.error);
        setError(profileResponse.error || 'Failed to fetch user profile');
      }

      // Fetch QuickBooks profile and companies
      try {
        const qbProfileResponse = await apiClient.getQuickBooksProfile(user.cbid);
        const qbCompaniesResponse = await apiClient.getQuickBooksCompanies(user.cbid);
        
        if (qbProfileResponse.success && qbProfileResponse.data) {
          console.log('QB Profile data received:', qbProfileResponse.data);
          setQbProfile(qbProfileResponse.data);
        }
        
        if (qbCompaniesResponse.success && qbCompaniesResponse.data) {
          console.log('QB Companies data received:', qbCompaniesResponse.data);
          setQbCompanies(qbCompaniesResponse.data);
        }
        
        // Clear any success message when loading fresh data
        if (successMessage) {
          setSuccessMessage(null);
        }
      } catch (qbError) {
        console.log('QuickBooks data not available (user may not be connected):', qbError);
        // This is expected if user hasn't connected QuickBooks yet
      }
    } catch (err) {
      setError('Failed to fetch user data');
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  };



  const handleThreadSelect = (threadId: string) => {
    setSelectedThreadId(threadId);
    console.log('Selected thread:', threadId);
  };

  const handleThreadCreate = (threadId: string) => {
    setSelectedThreadId(threadId);
    console.log('Created and selected new thread:', threadId);
  };

  const handleConnectQuickBooks = async () => {
    console.log('handleConnectQuickBooks called');
    console.log('User object:', user);
    
    if (!user?.cbid) {
      console.error('User not authenticated or cbid missing');
      setError('User not authenticated');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('Calling initiateQuickBooksAuth with cbid:', user.cbid);
      
      // Call the QuickBooks OAuth initiation endpoint using API client
      const response = await apiClient.initiateQuickBooksAuth(user.cbid);
      
      console.log('QuickBooks auth response:', response);
      
      if (response.success && response.data?.auth_url) {
        console.log('Redirecting to QuickBooks OAuth URL:', response.data.auth_url);
        // Redirect user to QuickBooks OAuth URL
        window.location.href = response.data.auth_url;
      } else {
        console.error('Failed to get auth URL:', response.error);
        setError(response.error || 'Failed to get QuickBooks authorization URL');
      }
    } catch (err: any) {
      console.error('QuickBooks connect error:', err);
      setError(err.message || 'Failed to connect to QuickBooks');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-coral-50 to-brick-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view your profile</h2>
          <a 
            href="/login" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-coral-600 to-brick-600 hover:from-coral-700 hover:to-brick-700"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-coral-50 to-brick-50 flex">
      {/* Threads Sidebar */}
      <ThreadsSidebar 
        userCbid={user.cbid}
        selectedThreadId={selectedThreadId || undefined}
        onThreadSelect={handleThreadSelect}
        onThreadCreate={handleThreadCreate}
      />
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-coral-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your profile...</p>
            </div>
          ) : (
            <div className="space-y-8">
            {/* User Profile Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center space-x-4 mb-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-r from-coral-500 to-brick-500 rounded-full flex items-center justify-center">
                    <UserIcon className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">User Profile</h2>
                  <p className="text-gray-600">Your CoralBricks account information</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <p className="text-gray-900">{userProfile?.email || user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <p className="text-gray-900">{userProfile?.full_name || 'Not available'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">User ID</label>
                  <p className="text-gray-900 font-mono text-sm">{user.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CBID</label>
                  <p className="text-gray-900 font-mono text-sm">{user.cbid}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time Zone</label>
                  <p className="text-gray-900">{userProfile?.timezone || 'Not available'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.role === 'authenticated' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user.role === 'authenticated' ? 'Verified' : 'Pending Verification'}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* QuickBooks Profile Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center space-x-4 mb-6">
                <div className="flex-shrink-0">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    qbProfile?.connected 
                      ? 'bg-green-100' 
                      : 'bg-gray-100'
                  }`}>
                    <BuildingOfficeIcon className={`w-8 h-8 ${
                      qbProfile?.connected ? 'text-green-600' : 'text-gray-400'
                    }`} />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">QuickBooks Integration</h2>
                  <p className="text-gray-600">{qbCompanies.length > 0 ? 'Your connected QuickBooks companies' : 'Your QuickBooks integration status'}</p>
                </div>
              </div>

              {qbCompanies.length > 0 ? (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {qbCompanies.map((company, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium text-gray-900">
                            {company.company_name || `Company ${index + 1}`}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            company.connected 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {company.connected ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-gray-500">Realm ID:</span>
                            <p className="font-mono text-gray-900">{company.realm_id}</p>
                          </div>
                          {company.last_connected && (
                            <div>
                              <span className="text-gray-500">Last Connected:</span>
                              <p className="text-gray-900">
                                {new Date(company.last_connected).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-center">
                    <button 
                      onClick={handleConnectQuickBooks}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <LinkIcon className="w-4 h-4 mr-2" />
                      Connect Another Company
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <LinkIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No QuickBooks Connection</h3>
                  <p className="text-gray-600 mb-4">Connect your QuickBooks account to get started</p>
                  <button 
                    onClick={handleConnectQuickBooks}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-coral-600 to-brick-600 hover:from-coral-700 hover:to-brick-700"
                  >
                    Connect QuickBooks
                  </button>
                </div>
              )}
            </motion.div>



            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 border border-green-200 rounded-lg p-4"
              >
                <div className="flex">
                  <CheckCircleIcon className="w-5 h-5 text-green-400 mr-3 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-green-800">Success</h3>
                    <p className="text-sm text-green-700 mt-1">{successMessage}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-lg p-4"
              >
                <div className="flex">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mr-3 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default Profile; 