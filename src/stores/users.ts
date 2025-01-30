import { defineStore } from 'pinia'
import { socket } from '@/socket'
import { getStorageItem } from '@/utils/localStorage'
import { throttle } from 'lodash'

const getName = (state: any) =>
  getStorageItem(state, 'name') || `Guest${Math.floor(Math.random() * 1000)}`

const getDefaultUser = () =>
  ({
    id: Date.now().toString(),
    name: '',
    position: {
      x: 0,
      y: 0,
      z: 0
    },
    rotation: {
      _x: 0,
      _y: 0,
      _z: 0
    }
  }) as User

const getBlocks = () =>
  [
    { type: 'coin', position: { x: -25, y: 6, z: -5 } },

    { type: 'question', position: { x: -20, y: 6, z: -5 } },

    { type: 'brick', position: { x: -27.5, y: 1, z: -5 } },

    { type: 'brick', position: { x: 5, y: 1, z: -5 } },
    { type: 'brick', position: { x: 7.5, y: 1, z: -5 } },
    { type: 'brick', position: { x: 10, y: 1, z: -5 } },
    { type: 'brick', position: { x: 12.5, y: 1, z: -5 } },
    { type: 'brick', position: { x: 15, y: 1, z: -5 } },
    { type: 'brick', position: { x: 17.5, y: 1, z: -5 } },
    { type: 'brick', position: { x: 20, y: 1, z: -5 } },

    { type: 'brick', position: { x: 7.5, y: 3.5, z: -5 } },
    { type: 'brick', position: { x: 10, y: 3.5, z: -5 } },
    { type: 'brick', position: { x: 12.5, y: 3.5, z: -5 } },
    { type: 'brick', position: { x: 15, y: 3.5, z: -5 } },
    { type: 'brick', position: { x: 17.5, y: 3.5, z: -5 } }
  ] as GameBlock[]

export const useUsersStore = defineStore('user', {
  state: () => ({
    users: [] as User[],
    user: getDefaultUser(),
    messages: [] as Message[],
    blocks: getBlocks(),
    dynamicBodies: {} as Record<BlockTypes, PhysicObject[]>
  }),

  actions: {
    bindEvents() {
      // sync the list of users upon connection
      socket.on('connect', () => {
        this.createUser(getName(this.$state))
      })

      socket.on('user:list', ({ users, id }: { users: User[]; id: string }) => {
        if (id !== this.user.id) {
          this.users = users.filter((user) => user.id !== this.user.id)
        }
      })

      // update the store when a message is received
      socket.on('message:created', (message: Message) => {
        this.messages.push(message)
      })
    },

    createUser(name: string) {
      const user: User = {
        ...getDefaultUser(),
        name
      }
      this.user = user
      socket.emit('user:create', user, (newUser: User) => {
        this.user = newUser
      })
    },

    changeUserName(name: string) {
      this.user.name = name
      socket.emit('user:change', this.user)
    },

    sendMessage(message: string) {
      socket.emit('message:create', {
        name: this.user.name,
        id: this.user.id,
        text: message
      })
    },

    updateUserData({
      position,
      rotation
    }: {
      position: User['position']
      rotation: User['rotation']
    }) {
      this.user.position = position
      this.user.rotation = rotation
      throttledEmitUserChange(this.user)
    }
  }
})

// Set rate limit of requests to the server to tickrate (60 for rts and 30 for fps)
const throttledEmitUserChange = throttle(function (user) {
  socket.emit('user:change', user)
}, 30)
