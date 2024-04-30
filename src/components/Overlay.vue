<script setup lang="ts">
import Hotkeys from '@/components/Hotkeys.vue'
import Userlist from '@/components/Userlist.vue'

const hotkeys = [
  { name: '⌘ + K', description: 'Toggle hotkeys' },
  { name: '⌘ + U', description: 'Toggle user list' },
  { name: '⌘ + C', description: 'Toggle config' },
  { name: 'Enter', description: 'Send message' },
  { name: 'W / ↑', description: 'Go forward' },
  { name: 'A / ←', description: 'Turn left' },
  { name: 'D / →', description: 'Turn right' },
  { name: 'S / ↓', description: 'Go back' },
]
</script>

<template>
  <div class="ui">
    <Hotkeys :hotkeys="hotkeys"/>
    <Userlist />
  </div>
</template>
