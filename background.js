// Load the Discord RPC library
importScripts('discord-rpc.js');

// Your Discord application client ID (you'll need to create this)
const CLIENT_ID = 'YOUR_DISCORD_CLIENT_ID';

// Track current state
let rpc = null;
let currentSong = null;
let startTimestamp = null;
let connected = false;
let connectionAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// Initialize Discord RPC connection
function initDiscordRPC() {
  if (connectionAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error('Max reconnection attempts reached. Please restart the extension.');
    return;
  }
  
  connectionAttempts++;
  
  try {
    // Create RPC client
    rpc = new DiscordRPC.Client({ transport: 'websocket' });
    
    // Set up event handlers
    rpc.on('ready', () => {
      console.log('Discord RPC connected');
      connected = true;
      connectionAttempts = 0;
      
      // If we have song data, update presence immediately
      if (currentSong && currentSong.isPlaying) {
        updateDiscordPresence(currentSong);
      }
    });
    
    rpc.on('disconnected', () => {
      console.log('Discord RPC disconnected');
      connected = false;
      
      // Try to reconnect
      setTimeout(initDiscordRPC, 5000);
    });
    
    // Log in to Discord
    rpc.login({ clientId: CLIENT_ID }).catch(err => {
      console.error('Failed to connect to Discord:', err);
      connected = false;
      
      // Try to reconnect after a delay
      setTimeout(initDiscordRPC, 10000);
    });
  } catch (error) {
    console.error('Error initializing Discord RPC:', error);
    connected = false;
    
    // Try to reconnect after a delay
    setTimeout(initDiscordRPC, 10000);
  }
}

// Update Discord Rich Presence with song info
function updateDiscordPresence(songData) {
  if (!connected || !rpc) {
    console.log('Discord RPC not connected yet');
    return;
  }
  
  try {
    // If it's a new song, reset the timestamp
    if (!startTimestamp || !currentSong || 
        currentSong.title !== songData.title || 
        currentSong.artist !== songData.artist) {
      startTimestamp = Date.now();
    }
    
    // Set the activity in Discord
    rpc.setActivity({
      details: songData.title,
      state: `by ${songData.artist}`,
      largeImageKey: 'youtube_music_logo', // Must be uploaded to your Discord application
      largeImageText: 'YouTube Music',
      smallImageKey: 'playing', // Must be uploaded to your Discord application
      smallImageText: 'Playing',
      startTimestamp,
      instance: false,
    }).catch(error => {
      console.error('Error setting activity:', error);
      
      if (error.message.includes('connection closed')) {
        connected = false;
        initDiscordRPC();
      }
    });
  } catch (error) {
    console.error('Error updating Discord presence:', error);
    
    // If there's a connection error, try to reconnect
    if (error.message.includes('connection') || error.message.includes('not connected')) {
      connected = false;
      initDiscordRPC();
    }
  }
}

// Clear Discord Rich Presence
function clearDiscordPresence() {
  if (!connected || !rpc) return;
  
  try {
    rpc.clearActivity().catch(console.error);
  } catch (error) {
    console.error('Error clearing Discord presence:', error);
  }
}

// Listen for song updates from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SONG_UPDATE') {
    console.log('Received song update:', message.data);
    
    if (message.data.isPlaying) {
      currentSong = message.data;
      updateDiscordPresence(message.data);
    } else {
      clearDiscordPresence();
      currentSong = null;
      startTimestamp = null;
    }
  }
  
  // Always return true if you're using sendResponse asynchronously
  return true;
});

// Check if Discord is running periodically
function checkDiscordRunning() {
  if (!connected) {
    initDiscordRPC();
  }
  
  // Check again after 30 seconds
  setTimeout(checkDiscordRunning, 30000);
}

// Initialize when the background script loads
initDiscordRPC();
checkDiscordRunning();