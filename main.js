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
    mainWindow.webContents.openDevTools(); // Open DevTools automatically
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
          console.log('📦 Native drop - file path:', filePath);
          
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

// IPC Handlers
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
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
          getAllFiles(fullPath, rootDir, allFiles);
        } else {
          const relativeDir = path.relative(rootDir, dir);
          allFiles.push({
            name: file.name,
            path: fullPath,
            folder: relativeDir || '',
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
