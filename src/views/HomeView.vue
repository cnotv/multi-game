<script setup lang="ts">
import { reactive } from 'vue'
import Chat from '@/components/Chat.vue'

const messages: Message[] = reactive(Array.from(Array(1).keys()).map((i) => ({
  text: 'Hello!',
  name: 'Bot',
  id: i.toString()
})))
const user: User = { name: 'Dude', id: '1' }
</script>

<template>
  <Chat 
    :messages="messages"
    :user="user"
    @new-message="(message) => messages.push(message)"
  />
</template>
