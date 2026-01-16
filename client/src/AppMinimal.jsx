import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TechDashboard from './features/technician/pages/TechDashboard';

const App = () => {
  return (
    <Router>
      <div style={{ padding: '20px' }}>
        <h1>Mesob Help Desk</h1>
        <Routes>
          <Route path="/" element={<div><h2>Home Page</h2><p>Basic routing works</p></div>} />
          <Route path="/tech" element={<TechDashboard />} />
          <Route path="/login" element={<div><h2>Login Page</h2><p>Login page placeholder</p></div>} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
