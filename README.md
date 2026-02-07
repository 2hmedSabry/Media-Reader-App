# 🎬 Media Reader

A beautiful, distraction-free desktop application for viewing local media files and courses. Built with Electron and React.

![Media Reader](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Features

- 📁 **Folder-based Library** - Add local folders as courses
- 📂 **Virtual Groups** - Create custom groups to organize your files without changing the disk structure
- 🗂️ **Physical Folder Management** - Move files between physical folders directly from the app
- 🎥 **Video Player** - Built-in player with playback controls and PiP support
- 📄 **PDF Viewer** - View PDF documents
- 📝 **Text Viewer** - Read text files and code
- 🔍 **Quick Search** - Find files instantly with `Ctrl+F`
- ⏱️ **Progress Tracking** - Automatically saves your progress and statistics
- 🎨 **Multiple Themes** - Default Dark, Oceanic, and Warm Light
- ⌨️ **Keyboard Shortcuts** - Full keyboard navigation
- 📸 **Snapshots** - Capture video frames as images
- 🎯 **Subtitles Support** - Load and display SRT/VTT subtitles
- 🎛️ **Playback Speed Control** - Adjust video speed (0.5x - 3x)
- 📊 **Statistics** - Track your daily study time and streaks

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- macOS, Windows, or Linux

### Installation

```bash
# Clone the repository
git clone https://github.com/2hmedSabry/media-reader.git
cd media-reader

# Install dependencies
npm install

# Run in development mode
npm run dev
```

## 🔄 Check for Updates

This project is actively maintained. Check the GitHub repository for the latest version:

[![GitHub Release](https://img.shields.io/github/v/release/2hmedSabry/media-reader?label=Latest%20Version&style=for-the-badge&color=blue)](https://github.com/2hmedSabry/media-reader/releases)

[View Repository](https://github.com/2hmedSabry/media-reader)

## 📦 Building

### Icons

✅ **Application icons are already included** in the `build/` directory for all platforms.

To customize the icon design, see `build/README.md` for instructions.

### For macOS
```bash
npm run build:mac
```
Outputs: DMG and PKG installers for Intel and Apple Silicon

### For Windows
```bash
npm run build:win
```
Outputs: NSIS installer

### For Linux
```bash
npm run build:linux
```
Outputs: AppImage, DEB, and RPM packages

## ⌨️ Keyboard Shortcuts

### Video Controls
- `Space` - Play/Pause
- `→` - Forward 10 seconds
- `←` - Backward 10 seconds
- `]` - Increase playback speed
- `[` - Decrease playback speed
- `F` - Toggle fullscreen

### Navigation
- `N` - Next lesson
- `P` - Previous lesson
- `Ctrl+F` - Search files
- `Esc` - Close modals

### Subtitles & Capture
- `C` - Toggle subtitles
- `V` - Select subtitle file
- `S` - Take snapshot

## 🎨 Themes

- **Default Dark** - Modern dark theme with indigo accents
- **Oceanic** - Calm teal and ocean blue palette
- **Sunset Light** - Warm light theme with orange accents

## 🛠️ Tech Stack

- **Electron** - Desktop application framework
- **React** - UI library
- **Vite** - Build tool and dev server
- **Lucide React** - Icon library
- **Electron Builder** - Application packaging

## 📁 Project Structure

```
media-reader/
├── src/
│   ├── App.jsx          # Main React component
│   ├── index.css        # Global styles and themes
│   └── main.jsx         # React entry point
├── main.js              # Electron main process
├── preload.js           # Electron preload script
├── index.html           # HTML template
└── package.json         # Project configuration
```

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Ahmed Sabry**

- GitHub: [@2hmedSabry](https://github.com/2hmedSabry)
- Twitter: [@2hmedsabri](https://twitter.com/2hmedsabri)

## 🙏 Acknowledgments

- Built with ❤️ using Electron and React
- Icons by [Lucide](https://lucide.dev)

---

**Note:** This application works with local files only. No data is uploaded or shared externally.
