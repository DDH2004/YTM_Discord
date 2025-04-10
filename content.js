// Track the last song data to avoid unnecessary updates
let lastSongData = null;
let checkInterval = null;

// Extract song information from YouTube Music page
function getCurrentSongData() {
  try {
    // Get song title
    const title = document.querySelector('.title.style-scope.ytmusic-player-bar');
    
    // Get artist name
    const artistContainer = document.querySelector('.subtitle.style-scope.ytmusic-player-bar');
    let artistText = '';
    if (artistContainer) {
      // Try different ways to get the artist
      const artistLink = artistContainer.querySelector('yt-formatted-string a');
      if (artistLink) {
        artistText = artistLink.textContent;
      } else {
        // Fallback to the entire subtitle text
        artistText = artistContainer.textContent || 'Unknown Artist';
      }
    }
    
    // Get album art
    const albumArt = document.querySelector('.image.style-scope.ytmusic-player-bar');
    let albumUrl = '';
    if (albumArt) {
      const img = albumArt.querySelector('img');
      if (img && img.src) {
        albumUrl = img.src;
      }
    }
    
    // Get playing state - more defensively
    let isPlaying = false;
    try {
      const playButton = document.querySelector('.play-pause-button.style-scope.ytmusic-player-bar');
      if (playButton) {
        const ariaLabel = playButton.getAttribute('aria-label');
        isPlaying = ariaLabel ? ariaLabel.includes('Pause') : false;
        
        // Alternative detection if aria-label doesn't work
        if (!ariaLabel) {
          // Check if the play icon is hidden (meaning it's currently playing)
          const playIcon = playButton.querySelector('path[d^="M8,5 L19"]');
          const pauseIcon = playButton.querySelector('path[d^="M6,19h4V5H6v14z"]');
          
          if (playIcon && pauseIcon) {
            isPlaying = window.getComputedStyle(pauseIcon.parentElement).display !== 'none';
          }
        }
      }
    } catch (err) {
      console.log('Error getting play state:', err);
      // Default to not playing if we can't determine
      isPlaying = false;
    }
    
    // Get timestamps
    const timeInfo = document.querySelector('.time-info.style-scope.ytmusic-player-bar');
    let currentTime = '';
    let totalTime = '';
    if (timeInfo) {
      const times = timeInfo.textContent.split(' / ');
      if (times.length === 2) {
        currentTime = times[0].trim();
        totalTime = times[1].trim();
      }
    }
    
    // Only return data if we have at least a title
    if (title) {
      return {
        title: title.textContent || 'Unknown Title',
        artist: artistText || 'Unknown Artist',
        albumUrl,
        isPlaying,
        currentTime,
        totalTime,
        timestamp: Date.now()
      };
    }
  } catch (e) {
    console.error('Error extracting YouTube Music data:', e);
  }
  
  return null;
}

// Debugging helper function - log what's found on the page
function debugPageElements() {
  console.log('Debug: Looking for YouTube Music elements');
  
  const title = document.querySelector('.title.style-scope.ytmusic-player-bar');
  console.log('Title element found:', !!title, title ? title.textContent : 'N/A');
  
  const artist = document.querySelector('.subtitle.style-scope.ytmusic-player-bar');
  console.log('Artist element found:', !!artist, artist ? artist.textContent : 'N/A');
  
  const playButton = document.querySelector('.play-pause-button.style-scope.ytmusic-player-bar');
  console.log('Play button found:', !!playButton);
  
  if (playButton) {
    console.log('Play button aria-label:', playButton.getAttribute('aria-label'));
  }
}

// Start tracking YouTube Music playback
function startTracking() {
  if (checkInterval) {
    clearInterval(checkInterval);
  }
  
  // Log debug info once at startup
  setTimeout(debugPageElements, 2000);
  
  checkInterval = setInterval(() => {
    const songData = getCurrentSongData();
    
    // Only send update if something has changed and we have data
    if (songData && 
        (!lastSongData || 
         songData.title !== lastSongData.title || 
         songData.artist !== lastSongData.artist || 
         songData.isPlaying !== lastSongData.isPlaying)) {
      
      console.log('Song data changed, sending update:', songData);
      lastSongData = songData;
      
      // Send to background script
      chrome.runtime.sendMessage({
        type: 'SONG_UPDATE',
        data: songData
      });
    }
  }, 1000); // Check every second
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_CURRENT_SONG') {
    sendResponse(getCurrentSongData());
  } else if (message.type === 'DEBUG_PAGE') {
    debugPageElements();
    sendResponse({status: 'Debug info logged to console'});
  }
});

// The page might not be fully loaded yet, so wait a bit before starting
console.log('YouTube Music Discord Presence extension loaded');
setTimeout(startTracking, 1500);

// Handle cleanup when the page is unloaded
window.addEventListener('beforeunload', () => {
  if (checkInterval) {
    clearInterval(checkInterval);
  }
  
  // Tell background script music has stopped
  chrome.runtime.sendMessage({
    type: 'SONG_UPDATE',
    data: { isPlaying: false }
  });
});