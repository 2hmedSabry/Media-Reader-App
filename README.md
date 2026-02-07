# Calm Study - Course Reader

A distraction-free, calm, and dark-themed desktop application for reading courses (folders).

## UX Focus
- **Calm & Dark**: Deep background colors and soft typography (Plus Jakarta Sans).
- **Distraction-Free**: Minimal UI elements to keep focus on the content.
- **Natural Hierarchy**: Automatically separates videos into "Lessons" and other files into "Resources".
- **Comfortable Learning**: Optimized for long-form study sessions.

## Tech Stack
- Electron
- React (Vite)
- Lucide React (Icons)
- Node.js (fs/path)

## Setup

1. **Install**:
   ```bash
   npm install
   ```

2. **Run**:
   ```bash
   npm run dev
   ```

3. **Build**:
   ```bash
   npm run build
   ```

## Functional Details
- **Open Course Folder**: Add any local directory as a course.
- **Recursive Scanning**: Finds all lessons and resources regardless of subfolder structure.
- **Local Storage**: Remembers your courses via a local JSON file.
- **Media Support**: Built-in player for video, PDF, and text.
