import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', {
  state: () => ({
    keyState: {} as Record<string, boolean>,
    gamepad: null as Gamepad | null,
    gamepadButtons: {} as Record<string, GamepadButton>,
    controls: {} as Record<string, boolean>,
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
    },
    setKeyState(key: string, state: boolean) {
      this.keyState[key] = state
    },
    setGamePad(gamepad: Gamepad | null) {
      this.gamepad = gamepad
    },
    setGamePadButtons(buttons: Record<string, GamepadButton>) {
      this.gamepadButtons = buttons

      this.keyState['ArrowLeft'] = this.gamepadButtons.left.pressed
      this.keyState['ArrowRight'] = this.gamepadButtons.right.pressed
      this.keyState['ArrowUp'] = this.gamepadButtons.up.pressed
      this.keyState['ArrowDown'] = this.gamepadButtons.down.pressed
      this.keyState[' '] = this.gamepadButtons.a.pressed
    }
  }
})
