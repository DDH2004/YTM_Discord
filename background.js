// Debugging flag - set to true to enable verbose logging
const DEBUG = true;

function debugLog(...args) {
  if (DEBUG) {
    console.log("[YTMusic Discord BG]", ...args);
  }
}

debugLog("Background script loaded");

// Track our connection to Discord
let discordConnected = false;

// Listen for song updates from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SONG_UPDATE') {
    debugLog("Received song update:", message.data);
    
    // For now, just log the data
    if (message.data.isPlaying) {
      debugLog(`Now playing: ${message.data.title} by ${message.data.artist}`);
    } else {
      debugLog("Music stopped playing");
    }
    
    // In the future, we'd update Discord here
  }
  
  // Return true to keep the message channel open for async responses
  return true;
});

// Set up the context menu for debugging
function setupContextMenu() {
  chrome.contextMenus?.create({
    id: 'debug-ytmusic',
    title: 'Debug YouTube Music Elements',
    contexts: ['page'],
    documentUrlPatterns: ['*://music.youtube.com/*']
  }, () => {
    if (chrome.runtime.lastError) {
      debugLog("Error creating context menu:", chrome.runtime.lastError);
    } else {
      debugLog("Context menu created successfully");
    }
  });
}

// Handle context menu clicks
chrome.contextMenus?.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'debug-ytmusic') {
    debugLog("Debug context menu clicked, sending message to tab:", tab.id);
    
    chrome.tabs.sendMessage(tab.id, { 
      type: 'DEBUG_PAGE' 
    }).then(response => {
      debugLog("Debug response:", response);
    }).catch(error => {
      debugLog("Error sending debug message:", error);
    });
  }
});

// Set up everything when the extension starts
setupContextMenu();

// Listen for tab updates to detect when YouTube Music is loaded
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.includes('music.youtube.com')) {
    debugLog("YouTube Music tab loaded:", tab.url);
  }
});