<script setup lang="ts">
import Panel from '@/components/Panel.vue'
import { useUiStore } from "@/stores/ui";
import { useUsersStore } from "@/stores/users";

const uiStore = useUiStore();
const usersStore = useUsersStore();
</script>

<template>
  <Panel
    v-if="uiStore.isUserListOpen"
    @close="uiStore.toggleUserList(false)"
  >
    <template #title>
      <div>👥 Users list</div>
    </template>
    <template #content>
      <div 
        class="users__item"
        v-for="user in usersStore.users"
      >
        <span>{{ user.name }}</span> - 
        <span>{{ user.id }}</span>
      </div>
    </template>
  </Panel>
</template>

<style lang="scss">
.users {
  position: absolute;
  max-width: 300px;
  border: 1px solid black;
  overflow: hidden;
  font-family: "Darumadrop One", sans-serif;

  &__item {
    background-color: var(--color-background-soft);
    opacity: 0.75;
    padding: 10px;
  }
}
</style>