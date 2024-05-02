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
['isChatOpen', 'isConfigOpen', 'isUserListOpen', 'isHotkeysOpen'].forEach((key) => getStorageItem(uiStore, key) === 'true');

// remove any existing listeners (after a hot module replacement)
socket.off();

userStore.bindEvents();
connectionStore.bindEvents();

// Set UI in localsStorage
watch(() => uiStore.$state, (state) => {
  ['isChatOpen', 'isConfigOpen', 'isUserListOpen', 'isHotkeysOpen'].forEach((key) => setStorageItem(state, key));
}, { deep: true });

// Set in username localsStorage
watch(() => userStore.$state.user, (user) => setStorageItem(user, 'name'), { deep: true });
</script>

<template>
  <div class="layout">
    <header class="layout__header">
      <nav class="layout__header__left">
        <span 
          class="status"
          :class="{ 'status--connected': connectionStore.isConnected }"
        ></span>
        <input 
          class="name-input"
          type="text"
          placeholder="Press enter to type"
          :value="userStore.user.name"
          @input="(event: any) => userStore.changeUserName(event.target!.value)"
          ref="inputElement"
        />
        <!-- <RouterLink to="/">Chat room</RouterLink> -->
        <!-- <RouterLink to="/about">About</RouterLink> -->
      </nav>
      <nav class="layout__header__right">
        <button @click="uiStore.toggleHotkeys()">⌨️</button>
        <button class="btn" @click="uiStore.toggleUserList()">
          👥
          <span class="btn__counter">{{ userStore.users.length }}</span>
        </button>
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

.status {
  display: inline-block;
  width: 1em;
  height: 1em;
  border-radius: 50%;
  margin: 0 1em;
  background-color: red;
  
  &--connected {
    background-color: green;
  }
}

.name-input {
  font-family: "Darumadrop One", sans-serif;

  @media screen and (max-width: var(--breakpoint-sm)) {
    max-width: 200px;
  }
}

.btn__counter {
  position: absolute;
  margin-top: 1em;
  margin-left: 0.2em;
  font-family: "Darumadrop One", sans-serif;
  font-size: 0.7em;
  font-weight: 900;
}
</style>
