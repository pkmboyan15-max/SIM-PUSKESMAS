import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Intercept and silence benign Vite HMR/WebSocket connection errors
// to prevent disruptive "Unhandled Rejection" error overlays in the environment.
if (typeof window !== 'undefined') {
  const isWebSocketError = (msg: string) => {
    return msg && (
      msg.includes('WebSocket') ||
      msg.includes('websocket') ||
      msg.includes('connection to') ||
      msg.includes('HMR')
    );
  };

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const errorMsg = reason ? (reason.message || String(reason)) : '';
    if (isWebSocketError(errorMsg)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });

  window.addEventListener('error', (event) => {
    const errorMsg = event.message || '';
    if (isWebSocketError(errorMsg)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

