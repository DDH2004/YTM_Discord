// Content script that runs on YouTube Music

function extractMusicInfo() {
  // Get song title
  const songElement = document.querySelector('.title.style-scope.ytmusic-player-bar');
  const songTitle = songElement ? songElement.textContent.trim() : null;
  
  // Get artist
  const artistElement = document.querySelector('.subtitle.style-scope.ytmusic-player-bar a');
  const artist = artistElement ? artistElement.textContent.trim() : null;
  
  // Get album art (if possible)
  const albumArtElement = document.querySelector('img.style-scope.ytmusic-player-bar');
  const albumArt = albumArtElement ? albumArtElement.src : null;
  
  return { songTitle, artist, albumArt };
}

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

// Check for music changes periodically
let previousSong = '';
setInterval(() => {
  const musicInfo = extractMusicInfo();
  
  // Only update if song has changed
  if (musicInfo.songTitle && musicInfo.songTitle !== previousSong) {
    previousSong = musicInfo.songTitle;
    sendToLocalApp(musicInfo);
  }
}, 5000); // Check every 5 seconds