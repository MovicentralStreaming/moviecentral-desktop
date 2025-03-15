import { app, shell, BrowserWindow, ipcMain, session, net } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { startServer } from './server/server'

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

  let tracksData: any[] | null = null
  let hlsUrl: string | null = null

  session.defaultSession.webRequest.onCompleted((details) => {
    if (details.url.includes('getSources')) {
      tracksData = null
      hlsUrl = null

      net
        .request(details.url)
        .on('response', (response) => {
          let data = ''

          response.on('data', (chunk) => {
            data += chunk.toString()
          })

          response.on('end', () => {
            try {
              const jsonData = JSON.parse(data)
              tracksData = jsonData.tracks
              if (hlsUrl && tracksData) {
                sendCombinedData(hlsUrl, tracksData)
              }
            } catch (error) {
              console.error('Failed to parse JSON:', error)
            }
          })
        })
        .end()
    }

    if (details.url.includes('.m3u8')) {
      if (!hlsUrl) {
        hlsUrl = details.url

        if (tracksData) {
          sendCombinedData(hlsUrl, tracksData)
        }
      }
    }
  })

  function sendCombinedData(_hlsUrl: string, tracks: any[]) {
    const sourcesResponse = {
      sources: [{ stream: _hlsUrl }],
      tracks: tracks
    }

    mainWindow?.webContents.send('sources-response', sourcesResponse)

    tracksData = null
    hlsUrl = null
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
