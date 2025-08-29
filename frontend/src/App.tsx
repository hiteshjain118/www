import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Thread from './pages/Thread';
import Pipeline from './pages/Pipeline';

function App() {
  return (
    <AuthProvider>
      <div className="App flex flex-col min-h-screen">
        <Navigation />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/create" element={<Thread />} />
            <Route path="/thread/:threadId" element={<Thread />} />
            <Route path="/pipeline/:pipelineId" element={<Pipeline />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}

export default App; 