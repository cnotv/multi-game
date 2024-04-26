<script setup lang="ts">
import { useUiStore } from "@/stores/ui";
import { useUsersStore } from "@/stores/users";

const uiStore = useUiStore();
const usersStore = useUsersStore();
</script>

<template>
  <div class="ui">
    <div 
      class="ui__users"
      v-if="uiStore.isUserListOpen"
    >
      <div class="ui__users__title">👥 Users list</div>
      <div 
        class="ui__users__item"
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
  &__users {
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

    &__title {
      background-color: var(--color-background-soft);
      padding: 10px;
      font-size: 1.2em;
    }

    &__item {
      background-color: var(--color-background-soft);
      opacity: 0.75;
      padding: 10px;
    }
  }
}
</style>