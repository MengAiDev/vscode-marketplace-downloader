# VS Code Marketplace Downloader

A Chrome browser extension that allows you to download VS Code extensions directly from the Visual Studio Marketplace.

![pic](use.png)

## Features

- 🚀 **Direct Download**: Download .VSIX files directly from VS Code Marketplace without navigating through the web interface
- 📡 **API Integration**: Uses official VS Code Marketplace API for reliable and up-to-date extension information
- 🎯 **Smart Detection**: Automatically detects when you're on a VS Code Marketplace extension page
- 🖱️ **Inline Button**: Injects a download button directly on the extension page for quick access
- 📊 **Extension Info**: View extension details including version, download count, and rating
- 🔒 **Privacy Focused**: No data collection, runs entirely locally in your browser

## Installation
Download our release!

### Manual Installation (Developer Mode)

1. Clone this repository:
```bash
git clone https://github.com/MengAiDev/vscode-marketplace-downloader.git
cd vscode-marketplace-downloader
```

2. Build the extension:
```bash
npm install
npm run build
```

3. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner
   - Click "Load unpacked"
   - Select the `dist` folder from the cloned repository

## Usage

1. Visit any VS Code Marketplace extension page (e.g., https://marketplace.visualstudio.com/items?itemName=ms-python.python)
2. You'll see a **"Download .VSIX"** button injected on the page
3. Click the button to download the extension file
4. Alternatively, click the extension icon in your browser toolbar to view extension details

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Building

```bash
# Install dependencies
npm install

# Build for development
npm run dev

# Build for production
npm run build
```

### Testing

```bash
# Run tests
npm test
```

### Project Structure

```
vscode-marketplace-downloader/
├── src/
│   ├── background/       # Background service worker
│   ├── content/          # Content scripts (injected into web pages)
│   ├── popup/            # Popup UI and logic
│   └── utils/            # Utility functions (API clients, helpers)
├── assets/               # Extension icons and images
├── dist/                 # Built extension files
├── .github/              # GitHub Actions workflows
└── manifest.json         # Extension manifest
```

## Technical Details

- **Manifest Version**: 3
- **TypeScript**: Full TypeScript support with type definitions
- **Build Tool**: Webpack 5
- **API**: Official VS Code Marketplace API
- **Permissions**: 
  - `activeTab`: Access current tab information
  - `storage`: Store extension preferences
  - `downloads`: Download extension files

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [VS Code Marketplace API](https://marketplace.visualstudio.com/apis) for providing extension data
- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/) for development guidelines

## Support

If you encounter any issues or have questions, please open an issue on GitHub.
