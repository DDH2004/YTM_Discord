// filepath: /ytm-discord-extension/ytm-discord-extension/src/content/content.js

// This script interacts with the YouTube Music page to monitor music status
// and sends updates to the background script.

function sendSongUpdate(title, artist, isPlaying) {
  chrome.runtime.sendMessage({
    type: 'SONG_UPDATE',
    data: {
      title: title,
      artist: artist,
      isPlaying: isPlaying
    }
  });
}

// Function to monitor the music player for changes
function monitorMusicPlayer() {
  const player = document.querySelector('your-music-player-selector'); // Replace with actual selector

  if (!player) {
    console.error("Music player not found");
    return;
  }

  // Example of monitoring the play/pause button
  const playButton = player.querySelector('your-play-button-selector'); // Replace with actual selector

  playButton.addEventListener('click', () => {
    const isPlaying = !playButton.classList.contains('paused'); // Adjust based on actual class
    const title = player.querySelector('your-title-selector').innerText; // Replace with actual selector
    const artist = player.querySelector('your-artist-selector').innerText; // Replace with actual selector

    sendSongUpdate(title, artist, isPlaying);
  });
}

// Start monitoring when the content script is loaded
monitorMusicPlayer();