<script setup lang="ts">
import Panel from '@/components/Panel.vue'
import { useUiStore } from "@/stores/ui";

const uiStore = useUiStore();
const props = defineProps<{
  hotkeys: { name: string, description: string }[]
}>()
</script>

<template>
  <Panel
    v-if="uiStore.isHotkeysOpen"
    @close="uiStore.toggleHotkeys(false)"
  >
    <template #title>
      <div>⌨️ Keyboard controls</div>
    </template>
    <template #content>
      <div 
        class="hotkeys__item"
        v-for="hotkey in hotkeys"
      >
        <div class="hotkeys__item__name">{{ hotkey.name }}</div>
        <div class="hotkeys__item__description">{{ hotkey.description }}</div>
      </div>
    </template>
  </Panel>
</template>

<style lang="scss">
.hotkeys {
  position: absolute;
  max-width: 300px;
  border: 1px solid black;
  overflow: hidden;
  font-family: "Darumadrop One", sans-serif;

  &__item {
    background-color: var(--color-background-soft);
    opacity: 0.75;
    padding: 0.5em 1em;
    display: flex;
    align-items: center;

    &__name {
      padding: 1em;
      border: 2px solid var(--color-border);
      border-radius: 5px;
    }

    &__description {
      margin-left: 1em;
    }
  }
}
</style>