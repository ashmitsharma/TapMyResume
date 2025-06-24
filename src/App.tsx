
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Topbar from './components/common/Topbar';
import Footer from './components/common/Footer';
import Home from './components/pages/Home';
import Optimizer from './components/pages/Optimizer';
import AuthForm from './components/authPages/authForm/AuthForm';

function App() {
  return (
    <Router>
      <div className="app">
        <Topbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/optimizer" element={<Optimizer />} />
            <Route path="/auth" element={<AuthForm />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
