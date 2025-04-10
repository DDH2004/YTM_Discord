const express = require('express');
const cors = require('cors');
const { connect, updateDiscordStatus } = require('./discord/discord-rpc-client');
const { debugLog } = require('./utils/logger');

const app = express();
const PORT = 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Endpoint to receive updates from the browser extension
app.post('/update-status', (req, res) => {
  const { songTitle, artist, albumArt } = req.body;
  
  debugLog('Received status update:', { songTitle, artist });
  updateDiscordStatus(songTitle, artist, albumArt);
  
  res.json({ success: true });
});

// Start the server
app.listen(PORT, () => {
  debugLog(`Server running on http://localhost:${PORT}`);
  connect(); // Connect to Discord RPC when server starts
});