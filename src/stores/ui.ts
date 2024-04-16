import { defineStore } from "pinia";

export const useUiStore = defineStore("ui", {
  state: () => ({
    isChatOpen: true,
  }),

  actions: {
    toggleChat() {
      this.isChatOpen = !this.isChatOpen;
    }
  },
});