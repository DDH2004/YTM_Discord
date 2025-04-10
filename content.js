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

// Extract song information from YouTube Music page
function getCurrentSongData() {
  // Initialize with default "not playing" state
  const data = {
    isPlaying: false,
    title: '',
    artist: '',
    albumUrl: '',
    currentTime: '',
    totalTime: '',
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
    
    // Get timestamps
    const timeInfo = document.querySelector('.time-info.style-scope.ytmusic-player-bar');
    if (timeInfo && timeInfo.textContent) {
      const times = timeInfo.textContent.split(' / ');
      if (times.length === 2) {
        data.currentTime = times[0].trim();
        data.totalTime = times[1].trim();
      }
    }
    
    // Determine if music is playing using multiple methods
    // We'll try several approaches and use the first one that works
    
    // Method 1: Check if video element is playing
    try {
      const videoElement = document.querySelector('video');
      if (videoElement && !videoElement.paused && !videoElement.ended) {
        debugLog("Video element indicates music is playing");
        data.isPlaying = true;
      }
    } catch (e) {
      debugLog("Error checking video element:", e);
    }
    
    // Method 2: Check play/pause button - MOST DEFENSIVE APPROACH
    if (!data.isPlaying) {
      try {
        // This is where the error was happening - we'll be ultra defensive
        const playPauseSelectors = [
          '.play-pause-button',
          'tp-yt-paper-icon-button.play-pause-button',
          'ytmusic-player-bar .play-pause-button'
        ];
        
        for (const selector of playPauseSelectors) {
          const playButton = document.querySelector(selector);
          if (!playButton) continue;
          
          // Check aria-label very carefully
          try {
            const ariaLabel = playButton.getAttribute('aria-label');
            // Only check includes if ariaLabel is a non-null string
            if (typeof ariaLabel === 'string' && ariaLabel) {
              if (ariaLabel.includes('Pause')) {
                debugLog("Aria-label indicates music is playing:", ariaLabel);
                data.isPlaying = true;
                break;
              }
            }
          } catch (ariaError) {
            debugLog("Error checking aria-label:", ariaError);
          }
          
          // Try checking the icon state
          try {
            const pauseIcon = playButton.querySelector('path[d^="M6,19h4"]') || 
                              playButton.querySelector('[d*="h4V5H6v14zm8-14v14h4V5h-4z"]');
            
            if (pauseIcon) {
              const iconStyle = window.getComputedStyle(pauseIcon.parentElement || pauseIcon);
              if (iconStyle.display !== 'none') {
                debugLog("Pause icon visible, music is playing");
                data.isPlaying = true;
                break;
              }
            }
          } catch (iconError) {
            debugLog("Error checking play/pause icon:", iconError);
          }
        }
      } catch (buttonError) {
        debugLog("Error checking play button:", buttonError);
      }
    }
    
    // Method 3: Check player state class
    if (!data.isPlaying) {
      try {
        // YouTube Music adds classes to elements when playing
        const playerPlaying = document.querySelector('.playing');
        if (playerPlaying) {
          debugLog("Found .playing class, music is playing");
          data.isPlaying = true;
        }
      } catch (e) {
        debugLog("Error checking player state class:", e);
      }
    }
    
    // If all methods failed, use a heuristic - if we have song data, it's likely playing
    if (!data.isPlaying && data.title && data.currentTime) {
      // Check if current time is not "0:00" - indicating playback has started
      if (data.currentTime !== "0:00") {
        debugLog("Using time heuristic to determine playback state");
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
    ],
    "Time Info": [
      '.time-info',
      'ytmusic-player-bar .time-info'
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
  
  // More detailed play button check
  const playButton = document.querySelector('.play-pause-button');
  if (playButton) {
    debugLog("Play button details:");
    debugLog("  - className:", playButton.className);
    debugLog("  - id:", playButton.id);
    debugLog("  - attributes:", Array.from(playButton.attributes).map(a => `${a.name}="${a.value}"`).join(', '));
    
    const svgPaths = playButton.querySelectorAll('path');
    debugLog("  - SVG paths:", Array.from(svgPaths).map(p => p.getAttribute('d')));
  }
  
  // Get current song data
  const songData = getCurrentSongData();
  debugLog("getCurrentSongData() result:", songData);
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
      try {
        chrome.runtime.sendMessage({
          type: 'SONG_UPDATE',
          data: songData
        }).catch(error => {
          // Handle errors in sending message (happens if background script isn't ready)
          debugLog("Error sending message to background script:", error);
        });
      } catch (e) {
        debugLog("Error sending message:", e);
      }
    }
  }, 1000); // Check every second
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
  try {
    chrome.runtime.sendMessage({
      type: 'SONG_UPDATE',
      data: { isPlaying: false }
    }).catch(() => {
      // Ignore errors on page unload
    });
  } catch (e) {
    // Ignore errors on page unload
  }
});