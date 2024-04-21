<script setup lang="ts">
import { useUiStore } from "@/stores/ui";
import { useUsersStore } from "@/stores/users";

const uiStore = useUiStore();
const usersStore = useUsersStore();
</script>

<template>
  <div class="ui">
    <div class="ui-user">
      User:
      {{ usersStore.user.name }}
      {{ usersStore.user.id }}
    </div>
    <div 
      class="ui-users"
      v-if="uiStore.isUserListOpen"
    >
      User list:
      <div 
        class="ui-users-item"
        v-for="user in usersStore.users"
      >
        {{ user.name }}
        {{ user.id }}
      </div>
    </div>
  </div>
</template>

<style lang="scss">

.ui {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 100;
  color: white;
  font-size: 20px;
  padding: 10px;
}
</style>