import { reactive } from 'vue'
import { io } from 'socket.io-client'

export const state = reactive({
  connected: false
})

// "undefined" means the URL will be computed from the `window.location` object
const URL = `http://104.248.253.167:3000`
export const socket = io(URL)

socket.on('connect', () => {
  state.connected = true
})

socket.on('disconnect', () => {
  state.connected = false
})
