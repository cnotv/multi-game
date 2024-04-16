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
      socket.on("connect", () => {
        socket.emit("user:list", () => {
        });
      });

      // update the store when an user was created
      socket.on("user:created", (user: User) => {
        this.users.push(user);
      });

      // update the store when an user name changes
      socket.on("user:changed", (users: User[]) => {
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

      socket.emit("user:create", { name }, (res: any) => {
        user.id = res.data;
        this.users.push(user);
      });
    },

    changeUserName(name: string) {
      socket.emit("user:change", {
        name,
        id: this.user.id,
      });
      this.user.name = name;
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