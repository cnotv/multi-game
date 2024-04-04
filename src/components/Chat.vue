<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'

const props = defineProps<{
  messages: Message[]
  user: User
}>()

const userMessage = ref('')
const messagesContainer = ref<HTMLInputElement>()
const inputElement = ref<HTMLInputElement>()

const emit = defineEmits<{
  (event: 'new-message', payload: Message): void
}>()

const sendMessage = () => {
  if (!userMessage.value) return

  emit('new-message', {
    id: props.messages.length.toString(),
    name: props.user.name,
    text: userMessage.value
  })
  userMessage.value = ''
  focusInput()
  scrollToBottom()
}

const focusInput = () => {
  inputElement.value?.focus()
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

onMounted(() => {
  focusInput()
  scrollToBottom()
})
</script>

<template>
  <div class="chat">
    <div class="chat__messages" ref="messagesContainer">
      <div
        class="chat__messages__item"
        :class="{ 'chat__messages__item--user': message.name === user.name }"
        v-for="message in messages"
        :key="message.id"
      >{{ message.name }}: {{ message.text }}</div>
    </div>

    <form
      class="chat__actions"
      @submit.prevent="sendMessage"
    >
      <input 
        class="chat__actions__input"
        type="text"
        v-model="userMessage"
        ref="inputElement"
      />
      <button
        type="submit"
        class="chat__actions__button"
      >></button>
    </form>
  </div>
</template>

<style scoped lang="scss">
.chat {
  display: grid;
  grid-template-rows: 1fr auto;
  width: 100%;
  max-height: 100%;
  background-color: var(--color-background);

  &__messages {
    overflow: auto;
    padding: 0.5em 1em;
    display: flex;
    flex-direction: column;

    &__item {
      padding: 0.5em;
      border-radius: 0.5em;
      background-color: var(--color-background-soft);
      align-self: flex-start;

      &+& {
        margin-top: 0.5em;
      }

      &--user {
        background-color: var(--color-background-user);
        justify-self: right;
        align-self: flex-end;
      }
    }
  }

  &__actions {
    display: flex;

    &__input {
      flex-grow: 1;
    }

    &__button {
    }
  }
}
</style>
