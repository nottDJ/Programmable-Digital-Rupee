// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './context/UserContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import IntentBuilder from './pages/IntentBuilder';
import SimulateUPI from './pages/SimulateUPI';
import EscrowManager from './pages/EscrowManager';
import Analytics from './pages/Analytics';
import Reputation from './pages/Reputation';
import Architecture from './pages/Architecture';
import Login from './pages/Login';
import Contacts from './pages/Contacts';
import './index.css';


const ProtectedRoute = ({ children }) => {
  const { user, loading } = useUser();
  if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" />;
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
          <Route path="/intent" element={<ProtectedRoute><IntentBuilder /></ProtectedRoute>} />

          <Route path="/simulate" element={<ProtectedRoute><SimulateUPI /></ProtectedRoute>} />
          <Route path="/escrow" element={<ProtectedRoute><EscrowManager /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/reputation" element={<ProtectedRoute><Reputation /></ProtectedRoute>} />
          <Route path="/architecture" element={<ProtectedRoute><Architecture /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}

