import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DevToolsGuard from './components/DevToolsGuard/DevToolsGuard';
import CustomCursor from './components/CustomCursor/CustomCursor';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import Home from './pages/Home/Home';
import About from './pages/About/About';
import Projects from './pages/Projects/Projects';
import Blogs from './pages/Blogs/Blogs';
import Contact from './pages/Contact/Contact';

function App() {
  return (
    <Router>
      <DevToolsGuard>
        <CustomCursor />
        <div className="app-wrapper">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/blogs" element={<Blogs />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
          <Footer />
        </div>
      </DevToolsGuard>
    </Router>
  );
}

export default App;
