import { app, BrowserWindow, nativeTheme } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
    const preloadPath = path.join(__dirname, 'preload.js');
    console.log('Preload path:', preloadPath);

    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: preloadPath,
        },
    });

    startNowPlayingWatcher(win);

    // Auto-select Bluetooth device if it matches our target
    win.webContents.on('select-bluetooth-device', (event, deviceList, callback) => {
        event.preventDefault();
        console.log('Bluetooth device request:', deviceList);
        const result = deviceList.find((device) => {
            return device.deviceName === '3KMC3144';
        });
        if (result) {
            callback(result.deviceId);
        } else {
            console.log('Target device not found');
            // callback('');
        }
    });

    win.loadFile(path.join(__dirname, '../dist/index.html'));
}

// Ignore certificate errors for self-signed certs in dev (not strictly needed for file:// but harmless)
app.commandLine.appendSwitch('ignore-certificate-errors');

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

import { spawn } from 'child_process';

let nowPlayingProcess: any = null;

function startNowPlayingWatcher(win: BrowserWindow) {
    if (nowPlayingProcess) {
        nowPlayingProcess.kill();
    }

    const scriptPath = path.join(__dirname, '../scripts/watch-now-playing.swift');
    console.log('Starting now playing watcher from:', scriptPath);

    nowPlayingProcess = spawn('swift', [scriptPath]);

    nowPlayingProcess.stdout.on('data', (data: any) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
            if (line.trim().startsWith('{')) {
                try {
                    const jsonData = JSON.parse(line.trim());
                    win.webContents.send('now-playing-update', jsonData);
                } catch (e) {
                    console.error('Failed to parse JSON update:', e);
                }
            }
        }
    });

    nowPlayingProcess.stderr.on('data', (data: any) => {
        console.error(`Watcher stderr: ${data}`);
    });

    nowPlayingProcess.on('close', (code: any) => {
        console.log(`Watcher process exited with code ${code}`);
    });
}

app.on('before-quit', () => {
    if (nowPlayingProcess) {
        nowPlayingProcess.kill();
    }
});
