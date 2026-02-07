const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  readDir: (path) => ipcRenderer.invoke('read-dir', path),
  readFile: (path) => ipcRenderer.invoke('read-file', path),
  loadCourses: () => ipcRenderer.invoke('load-courses'),
  saveCourses: (courses) => ipcRenderer.invoke('save-courses', courses),
  saveProgress: (progress) => ipcRenderer.invoke('save-progress', progress),
  loadProgress: () => ipcRenderer.invoke('load-progress'),
  getSubtitle: (path) => ipcRenderer.invoke('get-subtitle', path),
  selectFile: () => ipcRenderer.invoke('select-file'),
  saveSnapshot: (data) => ipcRenderer.invoke('save-snapshot', data),
  openPath: (path) => ipcRenderer.invoke('open-path', path),
});
