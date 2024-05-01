import { defineStore } from 'pinia'
import { socket } from '@/socket'
import { getStorageItem } from '@/utils/localStorage'

const getName = (state: any) =>
  getStorageItem(state, 'name') || `Guest${Math.floor(Math.random() * 1000)}`

const defaultUser = () =>
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

export const useUsersStore = defineStore('user', {
  state: () => ({
    users: [] as User[],
    user: defaultUser(),
    messages: [] as Message[],
    blocks: [
      { position: { x: -25, y: 1, z: -5 } },

      { position: { x: 5, y: 1, z: -5 } },
      { position: { x: 7.5, y: 1, z: -5 } },
      { position: { x: 10, y: 1, z: -5 } },
      { position: { x: 12.5, y: 1, z: -5 } },
      { position: { x: 15, y: 1, z: -5 } },
      { position: { x: 17.5, y: 1, z: -5 } },
      { position: { x: 20, y: 1, z: -5 } },

      { position: { x: 7.5, y: 3.5, z: -5 } },
      { position: { x: 10, y: 3.5, z: -5 } },
      { position: { x: 12.5, y: 3.5, z: -5 } },
      { position: { x: 15, y: 3.5, z: -5 } },
      { position: { x: 17.5, y: 3.5, z: -5 } }
    ] as GameBlock[]
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
        ...defaultUser(),
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

    updateUserPosition({
      position,
      rotation
    }: {
      position: User['position']
      rotation: User['rotation']
    }) {
      this.user.position = position
      this.user.rotation = rotation
      socket.emit('user:change', this.user)
    }
  }
})
