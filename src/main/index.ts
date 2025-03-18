import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { startServer } from './server/server'
import path from 'path'
import fs from 'fs'

const dataDir = app.getPath('userData')
const historyPath = path.join(dataDir, 'history.json')

export function getHistory(): any {
  if (!fs.existsSync(historyPath)) return {}
  const data = fs.readFileSync(historyPath, 'utf-8').trim()
  return data ? JSON.parse(data) : {}
}

export function deleteHistory(): any {
  if (!fs.existsSync(historyPath)) return {}
  fs.rmSync(historyPath)
}

export function updateHistory(newData: any) {
  const history = getHistory()

  if (newData.id) {
    if (newData.media_type == 'movie') {
      const movieKey = `movie-${newData.id}`
      if (history[movieKey]) {
        history[movieKey].watch_time = newData.watch_time
        history[movieKey].duration = newData.duration
      } else {
        history[movieKey] = newData
      }
    } else {
      const episodeKey = `tv-${newData.id}-${newData.season}-${newData.episode}`
      if (history[episodeKey]) {
        history[episodeKey].watch_time = newData.watch_time
        history[episodeKey].duration = newData.duration
      } else {
        history[episodeKey] = newData
      }
    }
  }

  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2), 'utf-8')
}

function createWindow(): void {
  // Create the browser window.
  startServer()

  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    mainWindow.maximize()
    if (is.dev) {
      mainWindow.webContents.openDevTools()
    } else {
      mainWindow.removeMenu()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
