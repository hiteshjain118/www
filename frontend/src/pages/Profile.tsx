import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import Sidebar from '../components/Sidebar';

interface QBCompany {
  realm_id: string;
  company_name?: string;
  connected: boolean;
  last_connected?: string;
}



const Profile: React.FC = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);

  const [qbCompanies, setQbCompanies] = useState<QBCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage] = useState<string | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Authentication guard - redirect to login if not authenticated
  useEffect(() => {
    if (!user || !user.cbid) {
      console.log('User not authenticated, redirecting to login');
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  // Fetch user profile and QuickBooks data
  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user.cbid) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch user profile
        const profileResponse = await apiClient.get(`/profile/${user.cbid}`);
        setUserProfile(profileResponse.data);

        // Fetch QuickBooks user info
        const qbUserResponse = await apiClient.get(`/quickbooks/profile/user?cbid=${user.cbid}`);
        if (qbUserResponse.success && qbUserResponse.data) {
  
        }

        // Fetch QuickBooks companies
        const qbCompaniesResponse = await apiClient.get(`/quickbooks/profile/companies?cbid=${user.cbid}`);
        if (qbCompaniesResponse.success && qbCompaniesResponse.data) {
          setQbCompanies(qbCompaniesResponse.data as QBCompany[]);
        }

      } catch (error) {
        console.error('Error fetching profile data:', error);
        setError('Failed to load profile data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Show loading while validating authentication
  if (!user || !user.cbid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-coral-50 to-brick-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-600 mx-auto mb-4"></div>
          <h2 className="text-xl text-gray-700">Validating authentication...</h2>
        </div>
      </div>
    );
  }

  const handleThreadSelect = (threadId: string) => {
    setSelectedThreadId(threadId);
    console.log('Selected thread:', threadId);
    // Navigate to thread page with the selected thread
    navigate(`/thread/${threadId}`);
  };

  const handleThreadCreate = (threadId: string) => {
    setSelectedThreadId(threadId);
    console.log('Created and selected new thread:', threadId);
    // Navigate to thread page with the new thread
    navigate(`/thread/${threadId}`);
  };

  const handleConnectQuickBooks = async () => {
    if (!user?.cbid) {
      setError('User not authenticated');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.initiateQuickBooksAuth(user.cbid);
      
      if (response.success && response.data?.auth_url) {
        window.location.href = response.data.auth_url;
      } else {
        setError(response.error || 'Failed to get QuickBooks authorization URL');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to QuickBooks');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-coral-50 to-brick-50 flex">
      <Sidebar 
        userCbid={user.cbid}
        selectedThreadId={selectedThreadId || undefined}
        onThreadSelect={handleThreadSelect}
        onThreadCreate={handleThreadCreate}
                    onPipelineSelect={(pipelineId) => navigate(`/pipeline/${pipelineId}`)}
        onPipelineCreate={(pipelineId) => console.log('Pipeline created:', pipelineId)}
      />
      
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-coral-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your profile...</p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">User Profile</h1>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <p className="text-gray-900">{userProfile?.email || user.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CBID</label>
                    <p className="text-gray-900 font-mono text-sm">{user.cbid}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    <p className="text-gray-900">{user.role}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">QuickBooks Integration</h2>
                
                {qbCompanies.length > 0 ? (
                  <div className="space-y-4">
                    {qbCompanies.map((company) => (
                      <div key={company.realm_id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {company.company_name || `Company ${company.realm_id}`}
                            </h3>
                            <p className="text-sm text-gray-600">Realm ID: {company.realm_id}</p>
                            {company.last_connected && (
                              <p className="text-sm text-gray-500">
                                Last connected: {new Date(company.last_connected).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              company.connected 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {company.connected ? 'Connected' : 'Disconnected'}
                            </span>
                            <button 
                              onClick={handleConnectQuickBooks}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-coral-600 hover:bg-coral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-coral-500 transition-colors"
                            >
                              {company.connected ? 'Reconnect' : 'Connect'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-500 mb-4">
                      <p className="text-lg font-medium">No QuickBooks companies connected</p>
                      <p className="text-sm">Connect your QuickBooks account to get started</p>
                    </div>
                    <button 
                      onClick={handleConnectQuickBooks}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-coral-600 hover:bg-coral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-coral-500 transition-colors"
                    >
                      Connect QuickBooks
                    </button>
                  </div>
                )}
              </div>

              {successMessage && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-green-800">Success</h3>
                  <p className="text-sm text-green-700 mt-1">{successMessage}</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile; 