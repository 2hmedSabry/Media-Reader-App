const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0f172a',
  });

  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    // Open DevTools in development only
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  // Handle file drops on the window
  mainWindow.webContents.on('did-finish-load', () => {
    // Listen for file drops
    mainWindow.webContents.on('will-navigate', (event, url) => {
      // Prevent navigation when dropping files
      if (url.startsWith('file://')) {
        event.preventDefault();
      }
    });
  });

  // Handle dropped files
  mainWindow.webContents.on('dom-ready', () => {
    mainWindow.webContents.executeJavaScript(`
      document.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
          const filePath = files[0].path;
          
          // Call React's handler if available
          if (window.handleNativeFileDrop) {
            window.handleNativeFileDrop(filePath);
          }
        }
      });
      
      document.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    `);
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

let currentWatcher = null;

ipcMain.handle('watch-course', (event, dirPath) => {
  // Stop any existing watcher first
  if (currentWatcher) {
    currentWatcher.close();
    currentWatcher = null;
  }

  if (!dirPath || !fs.existsSync(dirPath)) return false;

  try {
    // Native OS events (Method 3) - Very low resource
    currentWatcher = fs.watch(dirPath, { recursive: true }, (eventType, filename) => {
      if (mainWindow) {
        // Debouncing logic will be on the receiver side for simplicity, 
        // or we can just send the event.
        mainWindow.webContents.send('course-content-changed');
      }
    });

    console.log('Started watching course:', dirPath);
    return true;
  } catch (err) {
    console.error('Watch error:', err);
    return false;
  }
});

ipcMain.handle('stop-watching-course', () => {
  if (currentWatcher) {
    currentWatcher.close();
    currentWatcher = null;
    console.log('Stopped watching course');
  }
  return true;
});

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Subtitles', extensions: ['srt', 'vtt'] }
    ]
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

ipcMain.handle('read-dir', async (event, dirPath) => {
  try {
    const getAllFiles = (dir, rootDir, allFiles = []) => {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      files.forEach(file => {
        // HIDE SYSTEM FILES (.DS_Store, etc)
        if (file.name.startsWith('.')) return;
        
        const fullPath = path.join(dir, file.name);
        const stats = fs.statSync(fullPath);
        if (file.isDirectory()) {
          getAllFiles(fullPath, rootDir, allFiles);
        } else {
          const relativeDir = path.relative(rootDir, dir);
          allFiles.push({
            name: file.name,
            path: fullPath,
            folder: relativeDir || '',
            size: stats.size,
            type: path.extname(file.name).toLowerCase().replace('.', '')
          });
        }
      });
      return allFiles;
    };

    const files = getAllFiles(dirPath, dirPath);
    
    // Natural sort helper that considers folder first, then filename
    const naturalSort = (a, b) => {
      // Compare folders first
      const folderCompare = a.folder.localeCompare(b.folder, undefined, { numeric: true, sensitivity: 'base' });
      if (folderCompare !== 0) return folderCompare;
      
      // If in same folder, compare filenames
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    };
    
    return files.sort(naturalSort);
  } catch (error) {
    console.error('Error reading directory:', error);
    return [];
  }
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error('Error reading file:', error);
    return null;
  }
});

ipcMain.handle('get-subtitle', async (event, filePath) => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    if (filePath.toLowerCase().endsWith('.srt')) {
      // Simple SRT to VTT conversion
      content = 'WEBVTT\n\n' + content
        .replace(/,/g, '.')
        .replace(/(\d{2}:\d{2}:\d{2})\.(\d{3})/g, '$1.$2');
    }
    return content;
  } catch (error) {
    console.error('Error reading subtitle:', error);
    return null;
  }
});

ipcMain.handle('toggle-mini-mode', async (event, isMini) => {
  if (mainWindow) {
    if (isMini) {
      mainWindow.setSize(480, 270, true);
      mainWindow.setAlwaysOnTop(true, 'floating');
    } else {
      mainWindow.setSize(1200, 800, true);
      mainWindow.setAlwaysOnTop(false);
      mainWindow.center();
    }
  }
});

// Storage for settings (courses)
const settingsPath = path.join(app.getPath('userData'), 'settings.json');

ipcMain.handle('load-courses', () => {
  if (fs.existsSync(settingsPath)) {
    return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  }
  return [];
});

const progressPath = path.join(app.getPath('userData'), 'progress.json');

ipcMain.handle('save-progress', (event, progress) => {
  fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2));
});

ipcMain.handle('save-snapshot', async (event, { base64Data, filePath }) => {
  try {
    const buffer = Buffer.from(base64Data.split(',')[1], 'base64');
    fs.writeFileSync(filePath, buffer);
    return true;
  } catch (error) {
    console.error('Error saving snapshot:', error);
    return false;
  }
});

ipcMain.handle('open-path', async (event, filePath) => {
  const { shell } = require('electron');
  shell.showItemInFolder(filePath);
});

ipcMain.handle('open-external', async (event, url) => {
  const { shell } = require('electron');
  shell.openExternal(url);
});

ipcMain.handle('load-progress', () => {
  if (fs.existsSync(progressPath)) {
    return JSON.parse(fs.readFileSync(progressPath, 'utf8'));
  }
  return {};
});

ipcMain.handle('save-courses', (event, courses) => {
  fs.writeFileSync(settingsPath, JSON.stringify(courses, null, 2));
});

ipcMain.handle('is-directory', async (event, filePath) => {
  try {
    const stats = fs.statSync(filePath);
    return stats.isDirectory();
  } catch (error) {
    console.error('Error checking if directory:', error);
    return false;
  }
});

ipcMain.handle('handle-native-drop', async (event, filePath) => {
  try {
    console.log('Main process received drop:', filePath);
    const stats = fs.statSync(filePath);
    
    let folderPath;
    if (stats.isDirectory()) {
      folderPath = filePath;
    } else {
      folderPath = path.dirname(filePath);
    }
    
    console.log('Folder to add:', folderPath);
    return folderPath;
  } catch (error) {
    console.error('Error handling native drop:', error);
    return null;
  }
});

ipcMain.handle('move-file', async (event, { oldPath, newPath }) => {
  try {
    // Ensure parent directory exists
    const dir = path.dirname(newPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.renameSync(oldPath, newPath);
    return true;
  } catch (error) {
    console.error('Error moving file:', error);
    return false;
  }
});

ipcMain.handle('create-dir', async (event, dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return true;
  } catch (error) {
    console.error('Error creating directory:', error);
    return false;
  }
});
