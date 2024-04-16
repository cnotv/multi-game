<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useUiStore } from "@/stores/ui";
import { useUsersStore } from "@/stores/users";
import { useConnectionStore } from "@/stores/connection";
import { socket } from "@/socket";

const uiStore = useUiStore();
const userStore = useUsersStore();
const connectionStore = useConnectionStore();

// remove any existing listeners (after a hot module replacement)
socket.off();

userStore.bindEvents();
connectionStore.bindEvents();
userStore.createUser(`User${Math.floor(Math.random() * 1000)}`);
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
        - Users online: {{ userStore.users.map(user => user.name).join(', ') }} ({{ userStore.users.length }})
      </nav>
      <nav class="layout__header__right">
        <button @click="uiStore.toggleChat()">💬</button>
      </nav>
    </header>

    <main class="layout__main">
      <RouterView />
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
