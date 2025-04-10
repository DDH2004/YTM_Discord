// filepath: /ytm-discord-extension/ytm-discord-extension/src/popup/popup.js

document.addEventListener('DOMContentLoaded', () => {
  const statusElement = document.getElementById('music-status');
  const titleElement = document.getElementById('music-title');
  const artistElement = document.getElementById('music-artist');

  // Function to update the popup with the current music status
  function updateStatus(status) {
    if (status.isPlaying) {
      statusElement.textContent = 'Now Playing';
      titleElement.textContent = status.title;
      artistElement.textContent = status.artist;
    } else {
      statusElement.textContent = 'Not Playing';
      titleElement.textContent = '';
      artistElement.textContent = '';
    }
  }

  // Request the current music status from the background script
  chrome.runtime.sendMessage({ type: 'REQUEST_STATUS' }, (response) => {
    if (response) {
      updateStatus(response);
    }
  });
});