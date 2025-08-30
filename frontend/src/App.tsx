import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Thread from './pages/Thread';
import Pipeline from './pages/Pipeline';
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

  // Extract threadId from URL if we're on a thread page
  useEffect(() => {
    if (location.pathname.startsWith('/thread/')) {
      const threadId = location.pathname.split('/thread/')[1];
      setSelectedThreadId(threadId);
    } else if (location.pathname.startsWith('/pipeline/')) {
      const pipelineId = location.pathname.split('/pipeline/')[1];
      setSelectedPipelineId(pipelineId);
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
    return null; // Will redirect to login
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
    <div className="h-screen bg-gradient-to-br from-coral-50 to-brick-50 flex pt-16">
      {/* Left Panel - Threads Sidebar */}
      <div className="flex-shrink-0">
        <Sidebar 
          userCbid={user.cbid}
          selectedThreadId={selectedThreadId}
          selectedPipelineId={selectedPipelineId}
          onThreadSelect={handleThreadSelect}
          onThreadCreate={handleThreadCreate}
          onPipelineSelect={handlePipelineSelect}
          onPipelineCreate={handlePipelineCreate}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
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
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
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
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}

export default App; 