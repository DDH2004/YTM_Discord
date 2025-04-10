const DiscordRPC = require('discord-rpc');
const { debugLog } = require('../utils/logger');

// Discord application client ID (create at https://discord.com/developers/applications)
const clientId = 'YOUR_CLIENT_ID';

// Initialize RPC
const rpc = new DiscordRPC.Client({ transport: 'ipc' });

// Register ready event
rpc.on('ready', () => {
  debugLog('Discord RPC client is ready');
});

// Update Discord Rich Presence
function updateDiscordStatus(songTitle, artist, albumArt = null) {
  if (!songTitle || !artist) {
    rpc.clearActivity().catch(console.error);
    return;
  }

  rpc.setActivity({
    details: songTitle,
    state: `by ${artist}`,
    largeImageKey: albumArt || 'ytm_logo', // Default image key
    largeImageText: 'YouTube Music',
    instance: false,
  }).catch(error => {
    debugLog('Error updating Discord Rich Presence:', error);
  });
}

// Connect to Discord
function connect() {
  rpc.login({ clientId }).catch(error => {
    debugLog('Error connecting to Discord:', error);
  });
}

module.exports = {
  connect,
  updateDiscordStatus,
};