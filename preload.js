const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  readDir: (path) => ipcRenderer.invoke('read-dir', path),
  readFile: (path) => ipcRenderer.invoke('read-file', path),
  loadCourses: () => ipcRenderer.invoke('load-courses'),
  saveCourses: (courses) => ipcRenderer.invoke('save-courses', courses),
});
