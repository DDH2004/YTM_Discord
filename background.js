// Simple version that just logs song updates

console.log('YouTube Music Discord Presence background script loaded');

// Listen for song updates from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SONG_UPDATE') {
    console.log('Received song update:', message.data);
    
    // For now, just log the data - Discord integration will come later
    if (message.data.isPlaying) {
      console.log(`Now playing: ${message.data.title} by ${message.data.artist}`);
    } else {
      console.log('Music stopped playing');
    }
  }
  
  // Always return true if you're using sendResponse asynchronously
  return true;
});

// Add a context menu to help with debugging
chrome.contextMenus?.create({
  id: 'debug-ytmusic',
  title: 'Debug YouTube Music Elements',
  contexts: ['page'],
  documentUrlPatterns: ['*://music.youtube.com/*']
});

// Handle context menu clicks
chrome.contextMenus?.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'debug-ytmusic') {
    chrome.tabs.sendMessage(tab.id, { type: 'DEBUG_PAGE' });
  }
});