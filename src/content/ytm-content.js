// Content script that runs on YouTube Music

function getCurrentSongData() {
  try {
    // More robust selectors for YouTube Music
    const songElement = document.querySelector('.title.style-scope.ytmusic-player-bar');
    const artistElement = document.querySelector('.subtitle.style-scope.ytmusic-player-bar');
    const albumArtElement = document.querySelector('img.style-scope.ytmusic-player-bar');
    
    // Add null checks before accessing properties
    const songTitle = songElement ? songElement.textContent.trim() : null;
    const artistText = artistElement ? artistElement.textContent.trim() : null;
    const albumArt = albumArtElement && albumArtElement.src ? albumArtElement.src : null;
    
    // Extract artist name more carefully
    let artist = null;
    if (artistText) {
      // Artist information might be combined with other text
      // Just take the first part as the artist name
      artist = artistText.split('•')[0].trim();
    }
    
    if (!songTitle || !artist) {
      return null;
    }
    
    return { songTitle, artist, albumArt };
  } catch (error) {
    console.error('Error extracting YouTube Music data:', error);
    return null;
  }
}

// Check for music changes periodically
let previousSong = '';
setInterval(() => {
  const musicInfo = getCurrentSongData();
  
  // Only update if song data exists and has changed
  if (musicInfo && musicInfo.songTitle && musicInfo.songTitle !== previousSong) {
    previousSong = musicInfo.songTitle;
    sendToLocalApp(musicInfo);
  }
}, 5000); // Check every 5 seconds

function sendToLocalApp(data) {
  fetch('http://localhost:3000/update-status', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  .then(response => response.json())
  .catch(error => console.error('Error sending data to local app:', error));
}