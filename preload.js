const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    startTracking: () => ipcRenderer.send('start-tracking'),
    stopTracking: () => ipcRenderer.send('stop-tracking'),
    resetTracking: () => ipcRenderer.send('reset-tracking'),
    onUpdateActiveWindow: (callback) => ipcRenderer.on('update-active-window', (event, ...args) => callback(...args)),
    onResetActiveWindow: (callback) => ipcRenderer.on('reset-active-window', callback),
    loginSuccess: () => ipcRenderer.send('login-success')
    
});

contextBridge.exposeInMainWorld('api', {
    startScreenshot: () => {
      ipcRenderer.invoke('start-screenshot');
    },
    stopScreenshot: () => {
      ipcRenderer.invoke('stop-screenshot');
    }
  });
  
  contextBridge.exposeInMainWorld('electron', {
    send: (channel, data) => ipcRenderer.send(channel, data),
    invoke: (channel, data) => ipcRenderer.invoke(channel, data)
});
window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector);
        if (element) element.innerText = text;
    };

    for (const dependency of ['chrome', 'node', 'electron']) {
        replaceText(`${dependency}-version`, process.versions[dependency]);
    }
});