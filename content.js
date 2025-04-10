// Track the last song data to avoid unnecessary updates
let lastSongData = null;
let checkInterval = null;

// Extract song information from YouTube Music page
function getCurrentSongData() {
  try {
    // Get song title
    const title = document.querySelector('.title.style-scope.ytmusic-player-bar');
    
    // Get artist name
    const artist = document.querySelector('.subtitle.style-scope.ytmusic-player-bar yt-formatted-string a');
    
    // Get album art
    const albumArt = document.querySelector('.image.style-scope.ytmusic-player-bar');
    let albumUrl = '';
    if (albumArt) {
      const img = albumArt.querySelector('img');
      if (img && img.src) {
        albumUrl = img.src;
      }
    }
    
    // Get playing state
    const playButton = document.querySelector('.play-pause-button.style-scope.ytmusic-player-bar');
    const isPlaying = playButton && playButton.getAttribute('aria-label').includes('Pause');
    
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
    
    if (title && artist) {
      return {
        title: title.textContent,
        artist: artist.textContent,
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

// Start tracking YouTube Music playback
function startTracking() {
  if (checkInterval) {
    clearInterval(checkInterval);
  }
  
  checkInterval = setInterval(() => {
    const songData = getCurrentSongData();
    
    // Only send update if something has changed
    if (songData && 
        (!lastSongData || 
         songData.title !== lastSongData.title || 
         songData.artist !== lastSongData.artist || 
         songData.isPlaying !== lastSongData.isPlaying)) {
      
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
  }
});

// Start tracking when the content script loads
startTracking();

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