<script setup lang="ts">
import { watch, onMounted } from "vue";
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

onMounted(() => {
  uiStore.isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
})

// Set UI in localsStorage
watch(() => uiStore.$state, (state) => {
  ['isChatOpen', 'isConfigOpen', 'isUserListOpen', 'isHotkeysOpen'].forEach((key) => setStorageItem(state, key));
}, { deep: true });

// Set in username localsStorage
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
