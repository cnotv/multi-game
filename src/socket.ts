import { reactive } from 'vue'
import { io } from 'socket.io-client'

export const state = reactive({
  connected: false
})

// "undefined" means the URL will be computed from the `window.location` object
const URL = import.meta.env.VITE_APP_SERVER_URL
export const socket = io(URL)

socket.on('connect', () => {
  state.connected = true
})

socket.on('disconnect', () => {
  state.connected = false
})
