<script setup lang="ts">
import { reactive } from 'vue'
import Chat from '@/components/Chat.vue'
import Threejs from '@/components/Threejs.vue'
import { useUsersStore } from "@/stores/users";

const userStore = useUsersStore();
</script>

<template>
  <Threejs :users="[userStore.user]" />
  <Chat
    class="chat-wrap"
    :messages="userStore.messages"
    :user="userStore.user"
    @new-message="(message) => userStore.sendMessage(message)"
  />
</template>

<style lang="scss">
.chat {
  position: absolute;
  bottom: 0;
  right: 0;
  max-width: 300px;
  height: 100%;
  background-color: white;
  border: 1px solid black;
  overflow: hidden;
}
</style>