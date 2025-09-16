import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Thread from './pages/Thread';
import Pipeline from './pages/Pipeline';
import DemoRevenue from './pages/DemoRevenue';
import DemoLeads from './pages/DemoLeads';
import DemoCampaigns from './pages/DemoCampaigns';
import DemoLaunchPromo from './pages/DemoLaunchPromo';
import DashboardMetricsNotebook from './pages/DashboardMetricsNotebook';
import UserChurnNotebook from './pages/UserChurnNotebook';
import Agents from './pages/Agents';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import RightSidebar from './components/RightSidebar';
import InternalDebugger from './components/InternalDebugger';
import { useAuth } from './contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

// Main layout component that includes sidebar
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedThreadId, setSelectedThreadId] = useState<string | undefined>();
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | undefined>();
  const [showDemoThread, setShowDemoThread] = useState<boolean>(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState<boolean>(true);

  // Get context-specific pipelines based on current route
  const getContextPipelines = () => {
    if (location.pathname.startsWith('/demo/revenue')) {
      return [
        {
          cbId: 'revenue-pipeline-1',
          name: 'Monthly revenue report to CFO',
          createdAt: '2025-08-01T10:00:00Z',
          parentThread: { cbId: 'demo-revenue' },
          status: 'Running'
        }
      ];
    } else if (location.pathname.startsWith('/demo/leads')) {
      return [
        {
          cbId: 'leads-pipeline-1',
          name: 'Daily lead scoring',
          createdAt: '2025-09-01T09:00:00Z',
          parentThread: { cbId: 'demo-leads' },
          status: 'Running'
        },
        {
          cbId: 'leads-pipeline-2',
          name: 'Daily export to Apollo',
          createdAt: '2025-09-02T08:00:00Z',
          parentThread: { cbId: 'demo-leads' },
          status: 'Delayed'
        }
      ];
    } else if (location.pathname.startsWith('/demo/campaigns')) {
      return [
        {
          cbId: 'campaigns-pipeline-2',
          name: 'Weekly Campaign Email',
          createdAt: '2025-08-20T16:00:00Z',
          parentThread: { cbId: 'demo-campaigns' },
          status: 'Stopped'
        }
      ];
    } else if (location.pathname.startsWith('/demo/notebook/metrics')) {
      return [
        {
          cbId: 'metrics-pipeline-1',
          name: 'Dashboard Refresh Pipeline',
          createdAt: '2025-08-25T08:00:00Z',
          parentThread: { cbId: 'notebook-metrics' },
          status: 'Running'
        }
      ];
    } else if (location.pathname.startsWith('/demo/notebook/churn')) {
      return [
        {
          cbId: 'churn-pipeline-1',
          name: 'Daily Churn Prediction',
          createdAt: '2025-08-30T07:00:00Z',
          parentThread: { cbId: 'notebook-churn' },
          status: 'Completed'
        }
      ];
    }
    return []; // No pipelines for other routes (like dashboard)
  };

  // Extract threadId from URL if we're on a thread page
  useEffect(() => {
    if (location.pathname.startsWith('/thread/')) {
      const threadId = location.pathname.split('/thread/')[1];
      setSelectedThreadId(threadId);
      setShowDemoThread(false);
    } else if (location.pathname.startsWith('/demo/revenue')) {
      setSelectedThreadId('demo-revenue');
      setShowDemoThread(true);
    } else if (location.pathname.startsWith('/demo/leads')) {
      setSelectedThreadId('demo-leads');
      setShowDemoThread(true);
    } else if (location.pathname.startsWith('/demo/campaigns')) {
      setSelectedThreadId('demo-campaigns');
      setShowDemoThread(true);
    } else if (location.pathname.startsWith('/demo/dashboard')) {
      setSelectedThreadId('demo-dashboard');
      setShowDemoThread(true);
    } else if (location.pathname.startsWith('/demo/notebook/metrics')) {
      setSelectedThreadId('notebook-metrics');
      setShowDemoThread(true);
    } else if (location.pathname.startsWith('/demo/notebook/churn')) {
      setSelectedThreadId('notebook-churn');
      setShowDemoThread(true);
    } else if (location.pathname.startsWith('/demo')) {
      setSelectedThreadId('demo-campaigns'); // default to campaigns demo
      setShowDemoThread(true);
    } else if (location.pathname.startsWith('/pipeline/')) {
      const pipelineId = location.pathname.split('/pipeline/')[1];
      setSelectedPipelineId(pipelineId);
      setShowDemoThread(false);
    } else {
      setSelectedThreadId(undefined);
      setShowDemoThread(false);
    }
  }, [location.pathname]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && (!user || !user.cbid)) {
      navigate('/login');
      return;
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-coral-50 to-brick-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Don't return null, let the redirect effect handle it
    return (
      <div className="min-h-screen bg-gradient-to-br from-coral-50 to-brick-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  const handleThreadSelect = (threadId: string) => {
    setSelectedThreadId(threadId);
    navigate(`/thread/${threadId}`);
  };

  const handleThreadCreate = async (threadId: string) => {
    setSelectedThreadId(threadId);
    navigate(`/thread/${threadId}`);
  };

  const handlePipelineSelect = (pipelineId: string) => {
    setSelectedPipelineId(pipelineId);
    navigate(`/pipeline/${pipelineId}`);
  };

  const handlePipelineCreate = async (pipelineId: string) => {
    setSelectedPipelineId(pipelineId);
    navigate(`/pipeline/${pipelineId}`);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-coral-50 to-brick-50 flex pt-16 overflow-hidden">
      {/* Left Panel - Threads Sidebar */}
      <div className="flex-shrink-0 h-full">
        <Sidebar 
          userCbid={user.cbid}
          selectedThreadId={selectedThreadId}
          selectedPipelineId={selectedPipelineId}
          onThreadSelect={handleThreadSelect}
          onThreadCreate={handleThreadCreate}
          onPipelineSelect={handlePipelineSelect}
          onPipelineCreate={handlePipelineCreate}
          showDemoThread={showDemoThread}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0 h-full">
        <div className="flex-1 h-full">
          {children}
        </div>
        
        {/* Right Sidebar */}
        <RightSidebar
          userCbid={user.cbid}
          selectedPipelineId={selectedPipelineId}
          onPipelineSelect={handlePipelineSelect}
          onPipelineCreate={handlePipelineCreate}
          isCollapsed={isRightSidebarCollapsed}
          onToggle={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
          contextPipelines={getContextPipelines()}
        />
      </div>
    </div>
  );
};

// Public layout component for pages that don't require authentication
const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-coral-50 to-brick-50 pt-16">
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <div className="App flex flex-col min-h-screen">
        <Navigation />
        <main className="flex-1 flex">
          <div className="flex-1">
            <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route 
              path="/agents" 
              element={
                <PublicLayout>
                  <Agents />
                </PublicLayout>
              } 
            />
            <Route 
              path="/privacy-policy" 
              element={
                <PublicLayout>
                  <PrivacyPolicy />
                </PublicLayout>
              } 
            />
            <Route 
              path="/terms-of-service" 
              element={
                <PublicLayout>
                  <TermsOfService />
                </PublicLayout>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <MainLayout>
                  <Profile />
                </MainLayout>
              } 
            />
            <Route 
              path="/create" 
              element={
                <MainLayout>
                  <Thread />
                </MainLayout>
              } 
            />
            <Route 
              path="/thread/:threadId" 
              element={
                <MainLayout>
                  <Thread />
                </MainLayout>
              } 
            />
            <Route 
              path="/pipeline/:pipelineId" 
              element={
                <MainLayout>
                  <Pipeline />
                </MainLayout>
              } 
            />
            <Route 
              path="/demo" 
              element={
                <MainLayout>
                  <DemoCampaigns />
                </MainLayout>
              } 
            />
            <Route 
              path="/demo/revenue" 
              element={
                <MainLayout>
                  <DemoRevenue />
                </MainLayout>
              } 
            />
            <Route 
              path="/demo/leads" 
              element={
                <MainLayout>
                  <DemoLeads />
                </MainLayout>
              } 
            />
            <Route 
              path="/demo/campaigns" 
              element={
                <MainLayout>
                  <DemoCampaigns />
                </MainLayout>
              } 
            />
            <Route 
              path="/demo/dashboard" 
              element={
                <MainLayout>
                  <DemoLaunchPromo />
                </MainLayout>
              } 
            />
            <Route 
              path="/demo/notebook/metrics" 
              element={
                <MainLayout>
                  <DashboardMetricsNotebook />
                </MainLayout>
              } 
            />
            <Route 
              path="/demo/notebook/churn" 
              element={
                <MainLayout>
                  <UserChurnNotebook />
                </MainLayout>
              } 
            />
            <Route 
              path="/intern/message" 
              element={
                <MainLayout>
                  <InternalDebugger />
                </MainLayout>
              } 
            />
          </Routes>
          </div>
          

        </main>
      </div>
    </AuthProvider>
  );
}

export default App; 