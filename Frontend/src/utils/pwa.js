// PWA utilities
let deferredPrompt = null;

// Register service worker
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('✅ Service Worker registered:', registration.scope);
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('🔄 New Service Worker found, installing...');
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('🎉 New content available, refresh to update');
            // You can show a toast here to notify user
          }
        });
      });
      
      return registration;
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  }
};

// Handle install prompt
export const initInstallPrompt = () => {
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('💾 Install prompt available');
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button
    const installBtn = document.getElementById('install-button');
    if (installBtn) {
      installBtn.style.display = 'block';
    }
  });
  
  window.addEventListener('appinstalled', () => {
    console.log('✅ PWA installed successfully');
    deferredPrompt = null;
  });
};

// Trigger install prompt
export const promptInstall = async () => {
  if (!deferredPrompt) {
    console.log('❌ Install prompt not available');
    return false;
  }
  
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  console.log(`User response to install prompt: ${outcome}`);
  deferredPrompt = null;
  return outcome === 'accepted';
};

// Check if app is installed
export const isInstalled = () => {
  // Check if running in standalone mode
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
};

// Get install instructions based on platform
export const getInstallInstructions = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return {
      platform: 'iOS',
      steps: [
        'Tap the Share button',
        'Scroll down and tap "Add to Home Screen"',
        'Tap "Add" to install'
      ]
    };
  } else if (/android/.test(userAgent)) {
    return {
      platform: 'Android',
      steps: [
        'Tap the menu button (⋮)',
        'Tap "Install app" or "Add to Home screen"',
        'Tap "Install" to confirm'
      ]
    };
  } else {
    return {
      platform: 'Desktop',
      steps: [
        'Click the install button in the address bar',
        'Or use browser menu > Install SniffGuard'
      ]
    };
  }
};
