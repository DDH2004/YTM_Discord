const { Client, GatewayIntentBits } = require('discord.js');
const { debugLog } = require('../utils/logger');

const DISCORD_TOKEN = 'YOUR_DISCORD_BOT_TOKEN'; // Replace with your Discord bot token
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildPresences] });

client.once('ready', () => {
  debugLog('Discord client is ready');
});

function updateDiscordStatus(songTitle, artist) {
  const statusMessage = songTitle ? `Listening to ${songTitle} by ${artist}` : 'Not playing any music';
  
  client.user.setPresence({
    activities: [{ name: statusMessage, type: 2 }], // Activity type 2 is for listening
    status: 'online',
  }).then(() => {
    debugLog('Discord status updated:', statusMessage);
  }).catch(error => {
    debugLog('Error updating Discord status:', error);
  });
}

client.login(DISCORD_TOKEN).catch(error => {
  debugLog('Error logging into Discord:', error);
});

module.exports = {
  updateDiscordStatus,
};