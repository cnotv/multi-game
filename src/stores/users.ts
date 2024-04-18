import { defineStore } from "pinia";
import { socket } from "@/socket";

export const useUsersStore = defineStore("user", {
  state: () => ({
    users: [] as User[],
    user: {
      id: Date.now().toString(),
      name: `Guest + Date.now().toString()`,
      position: {
        x: 0,
        y: 0,
        z: 0,
      },
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
        name,
        position: {
          x: 0,
          y: 0,
          z: 0,
        }
      };
      this.user = user;
      // Allow offline without check the other store
      if (!this.users.length) {
        this.users = [user];
      }

      socket.emit("user:create", { name }, (user: User) => {
        this.user = user;
      });
    },

    changeUserName(name: string) {
      this.user.name = name;

      // Allow offline without check the other store
      if (this.users.length === 1) {
        this.users = [this.user];
      }
      socket.emit("user:change", this.user);
    },

    sendMessage(message: string) {   
      socket.emit("message:create", { 
        name: this.user.name,
        id: this.user.id,
        text: message,
      });
    },

    updateUserPosition(position: User['position']) {
      const currentPos = JSON.stringify(this.user.position)
      const newPos = JSON.stringify(position)
      if (currentPos !== newPos) {
        this.user.position = position;
        socket.emit("user:change", this.user);
      }
    },
  },
});