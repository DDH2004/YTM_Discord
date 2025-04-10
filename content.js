// Track the last song data to avoid unnecessary updates
let lastSongData = null;
let checkInterval = null;

// Debugging flag - set to true to enable verbose logging
const DEBUG = true;

function debugLog(...args) {
  if (DEBUG) {
    console.log("[YTMusic Discord]", ...args);
  }
}

// Wait for an element to be available in the DOM
function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }
    
    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve(document.querySelector(selector));
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Timeout waiting for ${selector}`));
    }, timeout);
  });
}

// Extract song information from YouTube Music page
function getCurrentSongData() {
  // Initialize with default "not playing" state
  const data = {
    isPlaying: false,
    title: '',
    artist: '',
    albumUrl: '',
    timestamp: Date.now()
  };
  
  try {
    // First, check if the player controls are visible at all
    const playerBar = document.querySelector('ytmusic-player-bar');
    if (!playerBar || window.getComputedStyle(playerBar).display === 'none') {
      debugLog("Player bar not visible or not found");
      return null;
    }
    
    // Try multiple selectors for song title
    const titleSelectors = [
      '.title.style-scope.ytmusic-player-bar',
      'ytmusic-player-bar .title',
      'ytmusic-player-bar .content-info-wrapper .title'
    ];
    
    let titleElement = null;
    for (const selector of titleSelectors) {
      titleElement = document.querySelector(selector);
      if (titleElement && titleElement.textContent.trim()) {
        data.title = titleElement.textContent.trim();
        break;
      }
    }
    
    // If we still don't have a title, the player is likely not active
    if (!data.title) {
      debugLog("No song title found, player might not be active");
      return null;
    }
    
    // Try multiple selectors for artist information
    const artistSelectors = [
      '.subtitle.style-scope.ytmusic-player-bar',
      'ytmusic-player-bar .subtitle',
      'ytmusic-player-bar .content-info-wrapper .subtitle'
    ];
    
    let artistElement = null;
    for (const selector of artistSelectors) {
      artistElement = document.querySelector(selector);
      if (artistElement && artistElement.textContent.trim()) {
        // Try to get just the artist name, not the entire subtitle
        const artistLink = artistElement.querySelector('a');
        if (artistLink) {
          data.artist = artistLink.textContent.trim();
        } else {
          // Fallback to full subtitle, cleaning up extra text as best we can
          let fullText = artistElement.textContent.trim();
          // Remove "• Album:" and similar text if present
          fullText = fullText.split('•')[0].trim();
          data.artist = fullText;
        }
        break;
      }
    }
    
    // Get album art image
    const imageSelectors = [
      '.image.style-scope.ytmusic-player-bar img',
      'ytmusic-player-bar .image img',
      'img.ytmusic-player-bar'
    ];
    
    for (const selector of imageSelectors) {
      const imgElement = document.querySelector(selector);
      if (imgElement && imgElement.src) {
        data.albumUrl = imgElement.src;
        break;
      }
    }
    
    // Determine if music is playing
    // First look for the play/pause button and check its state
    const playPauseSelectors = [
      '.play-pause-button',
      'tp-yt-paper-icon-button.play-pause-button',
      'ytmusic-player-bar .play-pause-button'
    ];
    
    let playButtonFound = false;
    for (const selector of playPauseSelectors) {
      const playButton = document.querySelector(selector);
      if (playButton) {
        playButtonFound = true;
        
        // Method 1: Check aria-label
        const ariaLabel = playButton.getAttribute('aria-label') || '';
        if (ariaLabel.includes('Pause')) {
          data.isPlaying = true;
          break;
        }
        
        // Method 2: Check button state visually
        try {
          // Check which icon is visible - play or pause
          const playIcon = playButton.querySelector('path[d^="M8"]');
          const pauseIcon = playButton.querySelector('path[d^="M6,19h4"]');
          
          if (pauseIcon && window.getComputedStyle(pauseIcon.parentElement).display !== 'none') {
            data.isPlaying = true;
            break;
          }
        } catch (iconError) {
          debugLog("Error checking play/pause icon:", iconError);
        }
      }
    }
    
    // If we couldn't find the play button, try an alternative method
    if (!playButtonFound) {
      // Alternative method: check if video is playing by looking for the video element
      const videoElement = document.querySelector('video');
      if (videoElement && !videoElement.paused && !videoElement.ended) {
        data.isPlaying = true;
      }
    }
    
    debugLog("Current song data:", data);
    return data;
    
  } catch (e) {
    console.error('Error extracting YouTube Music data:', e);
    return null;
  }
}

// Continuously check the page for YouTube Music data
function startTracking() {
  debugLog("Starting YouTube Music tracking");
  
  if (checkInterval) {
    clearInterval(checkInterval);
  }
  
  checkInterval = setInterval(() => {
    const songData = getCurrentSongData();
    
    if (!songData) {
      // No valid song data, nothing to update
      return;
    }
    
    // Only send update if something has changed
    if (!lastSongData || 
        songData.title !== lastSongData.title || 
        songData.artist !== lastSongData.artist || 
        songData.isPlaying !== lastSongData.isPlaying) {
      
      debugLog("Song data changed, sending update:", songData);
      lastSongData = songData;
      
      // Send to background script
      chrome.runtime.sendMessage({
        type: 'SONG_UPDATE',
        data: songData
      }).catch(error => {
        // Handle errors in sending message (happens if background script isn't ready)
        debugLog("Error sending message to background script:", error);
      });
    }
  }, 1000); // Check every second
}

// Debug function to show what elements are found on the page
function debugPageElements() {
  debugLog("=== YouTube Music Element Debug ===");
  
  // All potential selectors
  const selectorGroups = {
    "Player Bar": ['ytmusic-player-bar'],
    "Title": [
      '.title.style-scope.ytmusic-player-bar',
      'ytmusic-player-bar .title',
      'ytmusic-player-bar .content-info-wrapper .title'
    ],
    "Artist": [
      '.subtitle.style-scope.ytmusic-player-bar',
      'ytmusic-player-bar .subtitle',
      'ytmusic-player-bar .content-info-wrapper .subtitle'
    ],
    "Play Button": [
      '.play-pause-button',
      'tp-yt-paper-icon-button.play-pause-button',
      'ytmusic-player-bar .play-pause-button'
    ],
    "Album Art": [
      '.image.style-scope.ytmusic-player-bar img',
      'ytmusic-player-bar .image img',
      'img.ytmusic-player-bar'
    ]
  };
  
  for (const [groupName, selectors] of Object.entries(selectorGroups)) {
    debugLog(`${groupName}:`);
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      const found = !!element;
      let details = 'Not found';
      
      if (found) {
        if (selector.includes('img')) {
          details = element.src || 'No src attribute';
        } else {
          details = element.textContent?.trim() || 'Empty text';
          // Check if it has aria-label
          const ariaLabel = element.getAttribute('aria-label');
          if (ariaLabel) {
            details += ` (aria-label: "${ariaLabel}")`;
          }
        }
      }
      
      debugLog(`  ${selector}: ${found ? '✓' : '✗'} ${details}`);
    }
  }
  
  // Check for video element
  const video = document.querySelector('video');
  debugLog("Video element:", !!video, video ? `Playing: ${!video.paused}` : 'N/A');
  
  // Get current song data
  const songData = getCurrentSongData();
  debugLog("getCurrentSongData() result:", songData);
}

// Set up message handling with background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  debugLog("Received message:", message);
  
  if (message.type === 'GET_CURRENT_SONG') {
    const data = getCurrentSongData();
    debugLog("Sending song data:", data);
    sendResponse(data);
  } else if (message.type === 'DEBUG_PAGE') {
    debugPageElements();
    sendResponse({status: 'Debug info logged to console'});
  }
  
  return true; // Keep channel open for async response
});

// Start tracking with a delay to ensure page is fully loaded
debugLog("YouTube Music Discord Presence extension loaded");

setTimeout(() => {
  debugLog("Running initial debug");
  debugPageElements();
  
  // Start the tracking after initial debug
  setTimeout(startTracking, 500);
}, 2000);

// Handle cleanup when the page is unloaded
window.addEventListener('beforeunload', () => {
  debugLog("Page unloading, cleaning up");
  
  if (checkInterval) {
    clearInterval(checkInterval);
  }
  
  // Tell background script music has stopped
  chrome.runtime.sendMessage({
    type: 'SONG_UPDATE',
    data: { isPlaying: false }
  }).catch(() => {
    // Ignore errors on page unload
  });
});