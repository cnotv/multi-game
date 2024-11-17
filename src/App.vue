<script setup lang="ts">
import { watch, onMounted, onUnmounted } from "vue";
import { RouterLink, RouterView } from 'vue-router'
import { useUiStore } from "@/stores/ui";
import { useUsersStore } from "@/stores/users";
import { useConnectionStore } from "@/stores/connection";
import { socket } from "@/socket";
import Chat from '@/components/Chat.vue'
import TopNavigation from '@/components/TopNavigation.vue'
import { getStorageItem, setStorageItem } from "@/utils/localStorage";

const uiStore = useUiStore();
const userStore = useUsersStore();
const connectionStore = useConnectionStore();


// Load state from localStorage
['isChatOpen', 'isConfigOpen', 'isUserListOpen', 'isHotkeysOpen'].forEach((key) => getStorageItem(uiStore, key) === 'true');

// remove any existing listeners (after a hot module replacement)
socket.off();

userStore.bindEvents();
connectionStore.bindEvents();

const gamepadMap: Record<number, string> = {
  0: 'a',
  1: 'b',
  2: 'x',
  3: 'y',
  4: 'lb',
  5: 'rb',
  6: 'lt',
  7: 'rt',
  8: 'back',
  9: 'start',
  10: 'ls',
  11: 'rs',
  12: 'up',
  13: 'down',
  14: 'left',
  15: 'right',
  16: 'home',
}

const keyUp = (event: KeyboardEvent) => uiStore.setKeyState(event.key, true)
const keyDown = (event: KeyboardEvent) => uiStore.setKeyState(event.key, false)
const setGamepad = (event: GamepadEvent) => {
  if (!uiStore.gamepad) {
    console.log(`Gamepad connected: ${event.gamepad.id}`);
    uiStore.setGamePad(event.gamepad)
  } else {
    const { buttons } = navigator.getGamepads()[0]!;
    uiStore.setGamePadButtons(buttons.reduce((record, button, i) => {
      // if (button.pressed) {
      //   console.log(`Button ${gamepadMap[i]} pressed`);
      // }
      return ({
        ...record,
        [gamepadMap[i]]: button
      })
    }, {} as Record<string, GamepadButton>))
  }
  
  window.requestAnimationFrame(() => setGamepad(event))
}

onMounted(() => {
  uiStore.isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
  window.addEventListener('keydown', keyUp)
  window.addEventListener('keyup', keyDown)
  window.addEventListener('gamepadconnected', event => window.requestAnimationFrame(() => setGamepad(event)));
})

onUnmounted(() => {
  window.removeEventListener('keydown', keyUp)
  window.removeEventListener('keyup', keyDown)
  window.removeEventListener('gamepadconnected', setGamepad);
}) 

// Set UI in localStorage
watch(() => uiStore.$state, (state) => {
  ['isChatOpen', 'isConfigOpen', 'isUserListOpen', 'isHotkeysOpen'].forEach((key) => setStorageItem(state, key));
}, { deep: true });

// Set in username localStorage
watch(() => userStore.$state.user, (user) => setStorageItem(user, 'name'), { deep: true });
</script>

<template>
  <div class="layout">
    <TopNavigation />
    <main class="layout__main">
      <RouterView />
      <Chat
        class="chat-wrap"
        v-if="uiStore.isChatOpen"
        :messages="userStore.messages"
        :user="userStore.user"
        @new-message="(message) => userStore.sendMessage(message)"
        @close-chat="() => uiStore.toggleChat(false)"
      />
    </main>
  </div>
</template>

<style scoped lang="scss">
.layout {
  display: grid;
  grid-template-rows: auto 1fr;
  min-height: 100vh;
  max-height: 100vh;
  width: 100vw;

  &__main {
    overflow: auto;
    position: relative;
    overflow: hidden;
  }
}
</style>
