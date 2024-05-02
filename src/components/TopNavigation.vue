<script setup lang="ts">
import { useUiStore } from "@/stores/ui";
import { useUsersStore } from "@/stores/users";
import { useConnectionStore } from "@/stores/connection";

const uiStore = useUiStore();
const userStore = useUsersStore();
const connectionStore = useConnectionStore();
</script>

<template>
  <header class="top-navigation">
    <nav class="top-navigation__left">
      <span 
        class="status"
        :class="{ 'status--connected': connectionStore.isConnected }"
      ></span>
      <input 
        class="name-input"
        type="text"
        placeholder="Press enter to type"
        :value="userStore.user.name"
        @input="(event: any) => userStore.changeUserName(event.target!.value)"
        ref="inputElement"
      />
      <!-- <RouterLink to="/">Chat room</RouterLink> -->
      <!-- <RouterLink to="/about">About</RouterLink> -->
    </nav>
    <nav class="top-navigation__right">
      <button @click="uiStore.toggleHotkeys()">⌨️</button>
      <button class="btn" @click="uiStore.toggleUserList()">
        👥
        <span class="btn__counter">{{ userStore.users.length }}</span>
      </button>
      <button @click="uiStore.toggleConfig()">⚙️</button>
      <button @click="uiStore.toggleChat()">💬</button>
    </nav>
  </header>
</template>


<style scoped lang="scss">
.top-navigation {
  background-color: var(--color-background-soft);
  padding: 0.5em 0;
  z-index: 1;
  display: flex;

  &__right {
    margin-left: auto;
  }

  &__input {
    font-family: "Darumadrop One", sans-serif;

    @media screen and (max-width: var(--breakpoint-sm)) {
      max-width: 200px;
    }
  }
}

.status {
  display: inline-block;
  width: 1em;
  height: 1em;
  border-radius: 50%;
  margin: 0 1em;
  background-color: red;
  
  &--connected {
    background-color: green;
  }
}


.btn__counter {
  position: absolute;
  margin-top: 1em;
  margin-left: 0.2em;
  font-family: "Darumadrop One", sans-serif;
  font-size: 0.7em;
  font-weight: 900;
}
</style>
