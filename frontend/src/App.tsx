import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Home from './components/Home';
import About from './components/About';
import MapView from './components/MapView';
import PWABadge from './components/PWABadge';
import InstallPrompt from './components/InstallPrompt';
import './App.css'

function App() {
  return (
    <Router>
      <div className="app">
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/map" element={<MapView />} />
          </Routes>
        </main>
        <PWABadge />
        <InstallPrompt />
      </div>
    </Router>
  )
}

export default App
