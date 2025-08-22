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
      <div className="App">
        <Navigation />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/create" element={<Thread />} />
          <Route path="/thread/:threadId" element={<Thread />} />
          <Route path="/pipeline/:pipelineId" element={<Pipeline />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App; 