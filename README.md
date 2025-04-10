# YTMusic Discord Extension

This project is a browser extension designed to monitor the status of YouTube Music and display that status on Discord. It allows users to keep their friends updated on what they are currently listening to on YouTube Music.

## Features

- Monitors the current song being played on YouTube Music.
- Updates the user's Discord status with the current song information.
- Provides a popup interface to view the current music status.
- Context menu integration for debugging and manual updates.

## Project Structure

```
ytm-discord-extension
├── src
│   ├── background
│   │   └── background.js        # Background script for the extension
│   ├── content
│   │   └── content.js           # Content script interacting with YouTube Music
│   ├── popup
│   │   ├── popup.html           # HTML structure for the popup
│   │   ├── popup.js             # JavaScript logic for the popup
│   │   └── popup.css            # Styles for the popup
│   ├── discord
│   │   └── discord-client.js     # Integration with Discord API
│   └── utils
│       └── logger.js            # Utility functions for logging
├── manifest.json                 # Configuration file for the Chrome extension
├── assets
│   └── icons
│       ├── icon16.png           # 16x16 pixel icon for the extension
│       ├── icon48.png           # 48x48 pixel icon for the extension
│       └── icon128.png          # 128x128 pixel icon for the extension
├── package.json                  # npm configuration file
├── .gitignore                    # Specifies files to ignore by Git
└── README.md                     # Documentation for the project
```

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd ytm-discord-extension
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Load the extension in your browser:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `ytm-discord-extension` directory.

## Usage

- Once the extension is loaded, it will automatically monitor your YouTube Music status.
- You can click on the extension icon to view the current music status in the popup.
- The extension will update your Discord status with the current song being played.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.