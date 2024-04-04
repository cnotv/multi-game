<script setup lang="ts">
import { reactive } from 'vue'
import Chat from '@/components/Chat.vue'
import Threejs from '@/components/Threejs.vue'

const messages: Message[] = reactive(Array.from(Array(1).keys()).map((i) => ({
  text: 'Hello!',
  name: 'Bot',
  id: i.toString()
})))
const user: User = { name: 'Dude', id: '1' }
</script>

<template>
  <Threejs :users="[user]" />
  <Chat
    class="chat-wrap"
    :messages="messages"
    :user="user"
    @new-message="(message) => messages.push(message)"
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