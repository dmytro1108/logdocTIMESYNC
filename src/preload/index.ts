import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import {webUtils} from 'electron'

// Custom APIs for renderer
const api = {}

// directly call window.getPathForFile(file) exposed without the api wrapper
if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('getPathForFile', (file: File) => {
    return webUtils.getPathForFile(file)
  })
} else {
  // @ts-ignore (define in dts)
  window.getPathForFile = (file: File) => {
    return webUtils.getPathForFile(file)
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
