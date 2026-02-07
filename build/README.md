# 🎨 Icon System

This directory contains all application icons in various formats for different platforms.

## 📁 Files Structure

```
build/
├── icon.icns          # macOS icon (285 KB)
├── icon.ico           # Windows icon (353 KB)
├── icon.png           # Linux/Base icon (1024x1024, 92 KB)
├── icons/             # Generated intermediate files (gitignored)
│   ├── mac/
│   ├── win/
│   └── png/
└── README.md          # This file
```

## ✅ Current Status

✅ **Icons are ready!** All platform-specific icons have been generated.

## 🎨 Icon Design

The current icon features:
- **Gradient background** (Indigo to Purple)
- **Play button** symbol (representing media playback)
- **Document lines** (representing course content)
- **Modern, clean design** that scales well at all sizes

## 🔄 Regenerating Icons

If you want to customize the icon design:

1. **Edit the SVG** in `scripts/generate-icons.js`
2. **Run the generator:**
   ```bash
   npm run generate-icons
   ```

This will:
- Generate a new SVG design
- Convert it to PNG (1024x1024)
- Create platform-specific formats (.icns, .ico)
- Copy final icons to the build directory

## 🛠️ Manual Icon Creation

If you have your own icon design (PNG, 1024x1024):

1. Replace `build/icon.png` with your design
2. Run:
   ```bash
   npx electron-icon-maker --input=build/icon.png --output=./build
   cp build/icons/mac/icon.icns build/
   cp build/icons/win/icon.ico build/
   ```

## 📝 Icon Requirements

- **macOS (.icns)**: Multi-resolution icon set (16px to 1024px)
- **Windows (.ico)**: Multi-resolution icon (16px, 32px, 48px, 256px)
- **Linux (.png)**: Single PNG file (512x512 or 1024x1024)

## 🎯 Best Practices

- Use simple, recognizable shapes
- Avoid fine details (they don't scale well to 16x16)
- Test at multiple sizes
- Use transparent backgrounds
- Ensure good contrast for both light and dark backgrounds

---

**Note:** The `icons/` subdirectory contains intermediate files and is excluded from git. Only the final icon files (`.icns`, `.ico`, `.png`) are tracked.
