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
  openExternal: (path) => ipcRenderer.invoke('open-external', path),
  moveFile: (data) => ipcRenderer.invoke('move-file', data),
  createDir: (path) => ipcRenderer.invoke('create-dir', path),
  isDirectory: (path) => ipcRenderer.invoke('is-directory', path),
  handleNativeDrop: (path) => ipcRenderer.invoke('handle-native-drop', path),
  toggleMiniMode: (isMini) => ipcRenderer.invoke('toggle-mini-mode', isMini),
  watchCourse: (path) => ipcRenderer.invoke('watch-course', path),
  stopWatchingCourse: () => ipcRenderer.invoke('stop-watching-course'),
  onCourseChanged: (callback) => {
    let timeout;
    const listener = () => {
      // Method 1: Debouncing - wait for changes to settle
      clearTimeout(timeout);
      timeout = setTimeout(callback, 500);
    };
    ipcRenderer.on('course-content-changed', listener);
    return () => ipcRenderer.removeListener('course-content-changed', listener);
  },
  checkUpdates: () => ipcRenderer.invoke('check-updates'),
});
