<script setup lang="ts">
const emit = defineEmits<{
  (event: 'close'): void
}>()
</script>

<template>
  <div class="panel">
    <div class="panel__header">
      <div class="panel__title">
        <slot name="title"></slot>
      </div>
      <button class="panel__close" @click="() => emit('close')">X</button>
    </div>
    <slot name="content"></slot>
  </div>
</template>

<style lang="scss">
.panel {
  position: absolute;
  max-width: 300px;
  border: 1px solid black;
  overflow: hidden;
  font-family: "Darumadrop One", sans-serif;

  display: grid;
  grid-template-rows: auto 1fr;
  width: 100%;
  max-width: 500px;
  max-height: 700px;

  &__header {
    display: flex;
    background-color: var(--color-background-soft);
    padding: 10px;
    font-size: 1.2em;
    justify-content: space-between;
  }

  &__close {
    font-family: "Darumadrop One", sans-serif;
  }

  &__title {
    line-height: 2.5;
  }
}
</style>