/**
 * Browser detection utility
 * Helps identify the browser and apply specific fixes
 */

// Detect browser and version
export const detectBrowser = () => {
  const userAgent = window.navigator.userAgent;
  let browser = 'unknown';
  let version = 'unknown';
  let os = 'unknown';

  // Detect Chrome
  if (userAgent.indexOf('Chrome') !== -1 && userAgent.indexOf('Edg') === -1 && userAgent.indexOf("OPR") === -1) {
    browser = 'chrome';
    const matches = userAgent.match(/Chrome\/(\d+)/);
    if (matches) version = parseInt(matches[1], 10);
  }
  // Detect Firefox
  else if (userAgent.indexOf('Firefox') !== -1) {
    browser = 'firefox';
    const matches = userAgent.match(/Firefox\/(\d+)/);
    if (matches) version = parseInt(matches[1], 10);
  }
  // Detect Safari (non-Chrome browsers on WebKit)
  else if (userAgent.indexOf('Safari') !== -1 && userAgent.indexOf('Chrome') === -1) {
    browser = 'safari';
    const matches = userAgent.match(/Version\/(\d+)/);
    if (matches) version = parseInt(matches[1], 10);
  }
  // Detect Edge
  else if (userAgent.indexOf('Edg') !== -1) {
    browser = 'edge';
    const matches = userAgent.match(/Edg\/(\d+)/);
    if (matches) version = parseInt(matches[1], 10);
  }
  // Detect Opera
  else if (userAgent.indexOf("OPR") !== -1 || userAgent.indexOf("Opera") !== -1) {
    browser = 'opera';
    const matches = userAgent.match(/(?:OPR|Opera)\/(\d+)/);
    if (matches) version = parseInt(matches[1], 10);
  }
  // Detect IE
  else if (userAgent.indexOf("Trident") !== -1) {
    browser = 'ie';
    const matches = userAgent.match(/rv:(\d+)/);
    if (matches) version = parseInt(matches[1], 10);
  }

  // Detect OS
  if (userAgent.indexOf('Windows') !== -1) {
    os = 'windows';
  } else if (userAgent.indexOf('Macintosh') !== -1) {
    os = 'mac';
  } else if (userAgent.indexOf('Linux') !== -1) {
    os = 'linux';
  } else if (userAgent.indexOf('Android') !== -1) {
    os = 'android';
  } else if (userAgent.indexOf('iOS') !== -1 || userAgent.indexOf('iPhone') !== -1 || userAgent.indexOf('iPad') !== -1) {
    os = 'ios';
  }

  return { browser, version, os, userAgent };
};

// Apply browser-specific fixes
export const applyBrowserFixes = () => {
  const { browser, version } = detectBrowser();
  
  // Chrome-specific fixes
  if (browser === 'chrome') {
    // Fix for Chrome 80+ SameSite cookie issues
    document.cookie = "SameSite=None; Secure";
    
    // Fix for older Chrome versions' CORS issues
    if (version < 80) {
      // Add window property to help detect in API calls
      window.isLegacyChrome = true;
    }
  }
  
  // Safari-specific fixes
  if (browser === 'safari') {
    // Safari has issues with localStorage in private browsing
    try {
      localStorage.setItem('test', '1');
      localStorage.removeItem('test');
    } catch (e) {
      // Create a polyfill for localStorage
      const storage = {};
      window.localStorage = {
        getItem: key => storage[key] || null,
        setItem: (key, value) => { storage[key] = value.toString(); },
        removeItem: key => { delete storage[key]; },
        clear: () => { Object.keys(storage).forEach(key => delete storage[key]); }
      };
    }
  }
  
  // Log browser information
  console.log(`Browser detected: ${browser} version ${version}`);
  
  return { browser, version };
};

// Check for browser support of features
export const checkFeatureSupport = () => {
  return {
    localStorage: typeof localStorage !== 'undefined',
    sessionStorage: typeof sessionStorage !== 'undefined',
    cookies: navigator.cookieEnabled,
    serviceWorker: 'serviceWorker' in navigator,
    webp: document.createElement('canvas')
      .toDataURL('image/webp')
      .indexOf('data:image/webp') === 0,
    webgl: (() => {
      try {
        return !!window.WebGLRenderingContext && 
          !!document.createElement('canvas').getContext('experimental-webgl');
      } catch(e) {
        return false;
      }
    })(),
    webrtc: navigator.getUserMedia || navigator.webkitGetUserMedia || 
            navigator.mozGetUserMedia || navigator.msGetUserMedia,
    fetch: 'fetch' in window,
    promises: 'Promise' in window,
    cors: 'XMLHttpRequest' in window && 'withCredentials' in new XMLHttpRequest(),
    flexbox: (() => {
      const elem = document.createElement('div');
      return 'flexBasis' in elem.style || 
             'webkitFlexBasis' in elem.style || 
             'mozFlexBasis' in elem.style;
    })()
  };
};

export default {
  detectBrowser,
  applyBrowserFixes,
  checkFeatureSupport
}; 