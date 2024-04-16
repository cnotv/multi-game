<script setup lang="ts">
import Threejs from '@/components/Threejs.vue'
import Controls from '@/components/Controls.vue'
import { useUsersStore } from "@/stores/users";
const userStore = useUsersStore();
</script>

<template>
  <Controls />
  <Threejs :users="[userStore.user]" />
</template>

<style lang="scss">
</style>