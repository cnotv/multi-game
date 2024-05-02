import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', {
  state: () => ({
    isChatOpen: false,
    isConfigOpen: false,
    isUserListOpen: false,
    isHotkeysOpen: true,
    isTouchDevice: false
  }),

  actions: {
    toggleChat(state?: boolean) {
      this.isChatOpen = state ?? !this.isChatOpen
    },
    toggleConfig(state?: boolean) {
      this.isConfigOpen = state ?? !this.isConfigOpen
    },
    toggleUserList(state?: boolean) {
      this.isUserListOpen = state ?? !this.isUserListOpen
    },
    toggleHotkeys(state?: boolean) {
      this.isHotkeysOpen = state ?? !this.isHotkeysOpen
    }
  }
})
