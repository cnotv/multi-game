<script setup lang="ts">
import { watch } from "vue";
import { RouterLink, RouterView } from 'vue-router'
import { useUiStore } from "@/stores/ui";
import { useUsersStore } from "@/stores/users";
import { useConnectionStore } from "@/stores/connection";
import { socket } from "@/socket";
import Chat from '@/components/Chat.vue'
import { getStorageItem, setStorageItem } from "@/utils/localStorage";

const uiStore = useUiStore();
const userStore = useUsersStore();
const connectionStore = useConnectionStore();


// Load state from localStorage
['isChatOpen', 'isConfigOpen', 'isUserListOpen'].forEach((key) => getStorageItem(uiStore, key) === 'true');

// remove any existing listeners (after a hot module replacement)
socket.off();

userStore.bindEvents();
connectionStore.bindEvents();

// Set UI in localsStorage
watch(() => uiStore.$state, (state) => {
  ['isChatOpen', 'isConfigOpen', 'isUserListOpen'].forEach((key) => setStorageItem(state, key));
}, { deep: true });

// Set in username localsStorage
watch(() => userStore.$state.user, (user) => setStorageItem(user, 'name'), { deep: true });
</script>

<template>
  <div class="layout">
    <header class="layout__header">
      <nav class="layout__header__left">
        <input 
          type="text"
          placeholder="Press enter to type"
          :value="userStore.user.name"
          @input="(event: Event) => userStore.changeUserName(event.target!.value)"
          ref="inputElement"
        />
        <RouterLink to="/">Chat room</RouterLink>
        <!-- <RouterLink to="/about">About</RouterLink> -->
        {{ connectionStore.isConnected ? 'Connected' : 'Disconnected' }}
        - Users online: ({{ userStore.users.length }})
      </nav>
      <nav class="layout__header__right">
        <button @click="uiStore.toggleUserList()">👥</button>
        <button @click="uiStore.toggleConfig()">⚙️</button>
        <button @click="uiStore.toggleChat()">💬</button>
      </nav>
    </header>

    <main class="layout__main">
      <RouterView />
      <Chat
        class="chat-wrap"
        v-if="uiStore.isChatOpen"
        :messages="userStore.messages"
        :user="userStore.user"
        @new-message="(message) => userStore.sendMessage(message)"
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

  &__header {
    background-color: var(--color-background-soft);
    padding: 0.5em 0;
    z-index: 1;
    display: flex;

    &__right {
      margin-left: auto;
    }
  }

  &__main {
    overflow: auto;
    position: relative;
    overflow: hidden;
  }
}
</style>
