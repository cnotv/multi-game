<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useUsersStore } from "@/stores/users";
import { useConnectionStore } from "@/stores/connection";
import { socket } from "@/socket";

const itemStore = useUsersStore();
const connectionStore = useConnectionStore();

// remove any existing listeners (after a hot module replacement)
socket.off();

itemStore.bindEvents();
connectionStore.bindEvents();
</script>

<template>
  <div class="layout">
    <header class="layout__header">
      <nav class="layout__header__nav">
        <RouterLink to="/">Chat room</RouterLink>
        <!-- <RouterLink to="/about">About</RouterLink> -->
        {{ connectionStore.isConnected ? 'Connected' : 'Disconnected' }}
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
    padding: 0.5em 1em;
    z-index: 1;
  }

  &__main {
    overflow: auto;
    position: relative;
    overflow: hidden;
  }
}
</style>
