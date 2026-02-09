// preload.ts
// All the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
    console.log('Preload script loaded successfully');
    const replaceText = (selector: string, text: string) => {
        const element = document.getElementById(selector)
        if (element) element.innerText = text
    }

    for (const dependency of ['chrome', 'node', 'electron']) {
        replaceText(`${dependency}-version`, process.versions[dependency] as string)
    }
})

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
    getNowPlaying: () => ipcRenderer.invoke('get-now-playing'),
    onNowPlayingUpdate: (callback: (data: any) => void) => {
        ipcRenderer.on('now-playing-update', (_event, data) => callback(data));
    }
});
