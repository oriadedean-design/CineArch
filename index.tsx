
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// SECURITY LAYER: "The Vault Protocol"
// Deterring casual inspection to preserve proprietary feel.
const protectSource = () => {
  // Disable Right-Click
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  }, false);

  // Disable DevTools Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    // F12
    if (e.key === 'F12') {
      e.preventDefault();
    }
    // Ctrl+Shift+I / J / C / U
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
      e.preventDefault();
    }
    // Ctrl+U (View Source)
    if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
    }
  }, false);
};

const root = ReactDOM.createRoot(rootElement);

const RootApp = () => {
  useEffect(() => {
    protectSource();
  }, []);

  return (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

root.render(<RootApp />);
