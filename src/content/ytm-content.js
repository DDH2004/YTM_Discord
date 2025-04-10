const { debugLog } = require('../utils/logger');

// Content script that runs on YouTube Music

function getCurrentSongData() {
  try {
    // Improved selectors for YouTube Music
    const songElement = document.querySelector('.title.style-scope.ytmusic-player-bar');
    const artistElement = document.querySelector('.byline.style-scope.ytmusic-player-bar');
    const albumArtElement = document.querySelector('.image.style-scope.ytmusic-player-bar');
    
    // Check if elements exist before accessing properties
    if (!songElement || !artistElement) {
      debugLog('Song or artist element not found on the page');
      return null;
    }
    
    const songTitle = songElement.textContent.trim();
    const artistText = artistElement.textContent.trim();
    
    // Fix for the specific error - add null check before using includes
    if (!artistText) {
      debugLog('Artist text is null or empty');
      return null;
    }
    
    // Extract artist - this was likely line 52 with the error
    const artist = artistText.split('•')[0].trim();
    
    // Get album art if available
    const albumArt = albumArtElement && albumArtElement.src ? albumArtElement.src : null;
    
    return { songTitle, artist, albumArt };
  } catch (error) {
    debugLog('Error extracting YouTube Music data:', error);
    return null;
  }
}

// Track previous song to avoid redundant updates
let previousSong = '';

function sendToLocalApp(data) {
  fetch('http://localhost:3000/update-status', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  .then(response => response.json())
  .catch(error => debugLog('Error sending data to local app:', error));
}

// Check for music updates periodically
setInterval(() => {
  const musicInfo = getCurrentSongData();
  
  if (musicInfo && musicInfo.songTitle && musicInfo.songTitle !== previousSong) {
    debugLog('New song detected:', musicInfo.songTitle, 'by', musicInfo.artist);
    previousSong = musicInfo.songTitle;
    sendToLocalApp(musicInfo);
  }
}, 3000);

// Initial check when script loads
setTimeout(getCurrentSongData, 1500);