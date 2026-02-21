// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import IntentBuilder from './pages/IntentBuilder';
import SimulateUPI from './pages/SimulateUPI';
import EscrowManager from './pages/EscrowManager';
import Analytics from './pages/Analytics';
import Reputation from './pages/Reputation';
import Architecture from './pages/Architecture';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/intent" element={<IntentBuilder />} />
            <Route path="/simulate" element={<SimulateUPI />} />
            <Route path="/escrow" element={<EscrowManager />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/reputation" element={<Reputation />} />
            <Route path="/architecture" element={<Architecture />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
