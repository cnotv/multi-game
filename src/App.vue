<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="layout">
    <header class="layout__header">
      <nav class="layout__header__nav">
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
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
