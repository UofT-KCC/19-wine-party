import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Invitation from './pages/Invitation';
import Scanner from './pages/Scanner';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/scanner" element={<Scanner />} />
        <Route path="/invitation" element={<Invitation />} />
        <Route path="*" element={<Navigate to="/invitation" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
