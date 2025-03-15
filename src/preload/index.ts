import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // send m3u8 files to the client
  onHlsUrl: (callback: (url: string) => void) => {
    ipcRenderer.on('hls-url', (_, url) => callback(url))
  },
  //send tracks response to the client
  onTracks: (callback: (tracks: any) => void) => {
    ipcRenderer.on('tracks', (_, tracks) => callback(tracks))
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
