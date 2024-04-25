<script setup lang="ts">
import { ref, onMounted, nextTick, onUnmounted } from 'vue'

const props = defineProps<{
  messages: Message[]
  user: User
}>()

const userMessage = ref('')
const messagesContainer = ref<HTMLInputElement>()
const inputElement = ref<HTMLInputElement>()

const emit = defineEmits<{
  (event: 'new-message', payload: string): void
}>()

const onSendMessage = () => {
  if (!userMessage.value) return

  emit('new-message', userMessage.value)
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
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      focusInput()
    }
  };

  window.addEventListener('keydown', handleKeydown);

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown);
  });
  scrollToBottom()
})
</script>

<template>
  <div class="chat">
    <div class="chat__messages" ref="messagesContainer">
      <div
        class="chat__messages__item"
        :class="{ 'chat__messages__item--user': message.id === user.id }"
        v-for="message in messages"
        :key="message.id"
      >
        <span v-if="message.id !== user.id">{{ message.name }}: </span>
        <span>{{ message.text }}</span>
      </div>
    </div>

    <form
      class="chat__actions"
      @submit.prevent="onSendMessage"
    >
      <input 
        class="chat__actions__input"
        type="text"
        placeholder="Press enter to type"
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
  position: absolute;
  bottom: 0;
  right: 0;
  max-width: 300px;
  height: 100%;
  background-color: white;
  border: 1px solid black;
  overflow: hidden;

  display: grid;
  grid-template-rows: 1fr auto;
  width: 100%;
  max-width: 500px;
  height: 30vh;
  min-height: 200px;
  max-height: 700px;
  background-color: var(--color-background);
  opacity: 0.75;

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
        color: var(--color-text-user);
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
