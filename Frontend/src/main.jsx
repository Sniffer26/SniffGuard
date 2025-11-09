import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './app.jsx'
import './index.css'
import { registerServiceWorker, initInstallPrompt } from './utils/pwa'

// Register Service Worker for PWA
if (import.meta.env.PROD) {
  registerServiceWorker();
  initInstallPrompt();
}

// Initialize libsodium for encryption
import sodium from 'libsodium-wrappers'

async function initializeApp() {
  try {
    // Wait for libsodium to be ready
    await sodium.ready
    console.log('🔐 Encryption library initialized')
    
    // Render the app
    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <BrowserRouter>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '14px',
                maxWidth: '500px',
              },
              success: {
                style: {
                  background: '#10b981',
                },
                iconTheme: {
                  primary: '#fff',
                  secondary: '#10b981',
                },
              },
              error: {
                style: {
                  background: '#ef4444',
                },
                iconTheme: {
                  primary: '#fff',
                  secondary: '#ef4444',
                },
              },
              loading: {
                style: {
                  background: '#3b82f6',
                },
              },
            }}
          />
        </BrowserRouter>
      </React.StrictMode>,
    )
  } catch (error) {
    console.error('Failed to initialize app:', error)
    
    // Show error message
    document.getElementById('root').innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        text-align: center;
        padding: 20px;
      ">
        <div>
          <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
          <h2 style="margin-bottom: 8px;">Failed to Initialize SniffGuard</h2>
          <p style="opacity: 0.8; margin-bottom: 16px;">There was an error loading the encryption library.</p>
          <button 
            onclick="window.location.reload()"
            style="
              background: rgba(255,255,255,0.2);
              border: none;
              color: white;
              padding: 12px 24px;
              border-radius: 8px;
              cursor: pointer;
              font-size: 14px;
            "
          >
            Reload Page
          </button>
        </div>
      </div>
    `
  }
}

// Initialize the app
initializeApp()