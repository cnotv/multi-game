import { defineStore } from "pinia";
import { socket } from "@/socket";

export const useUsersStore = defineStore("user", {
  state: () => ({
    users: [] as User[],
    user: {
      id: Date.now().toString(),
      name: `Guest + Date.now().toString()`,
    } as User,
    messages: [] as Message[],
  }),

  actions: {
    bindEvents() {
      // sync the list of users upon connection
      socket.on("connect", () => {});

      socket.on("user:list", (users: User[]) => {
        this.users = users;
      });

      // update the store when a message is received
      socket.on("message:created", (message: Message) => {
        this.messages.push(message);
      });
    },

    createUser(name: string) {
      const user: User = {
        id: Date.now().toString(), // temporary ID for v-for key
        name
      };
      this.user = user;

      socket.emit("user:create", { name }, (user: User) => {
        this.user = user;
      });
    },

    changeUserName(name: string) {
      this.user.name = name;
      socket.emit("user:change", this.user);
    },

    sendMessage(message: string) {   
      socket.emit("message:create", { 
        name: this.user.name,
        id: this.user.id,
        text: message,
      });
    },
  },
});