import { defineStore } from "pinia";

export const useUiStore = defineStore("ui", {
  state: () => ({
    isChatOpen: true,
    isConfigOpen: false,
    isUserListOpen: false,
  }),

  actions: {
    toggleChat() {
      this.isChatOpen = !this.isChatOpen;
    },
    toggleConfig() {
      this.isConfigOpen = !this.isConfigOpen;
    },
    toggleUserList() {
      this.isUserListOpen = !this.isUserListOpen;
    }
  },
});