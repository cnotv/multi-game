import { defineStore } from "pinia";
import { socket } from "@/socket";

const defaultUser = () => ({
  id: Date.now().toString(),
  name: `Guest${Math.floor(Math.random() * 1000)}`,
  position: {
    x: 0,
    y: 0,
    z: 0,
  },
  rotation: {
    x: 0,
    y: 0,
    z: 0,
  }
}) as User;

export const useUsersStore = defineStore("user", {
  state: () => ({
    users: [] as User[],
    user: defaultUser(),
    messages: [] as Message[],
  }),

  actions: {
    bindEvents() {
      // sync the list of users upon connection
      socket.on("connect", () => {
        this.createUser(`Guest${Math.floor(Math.random() * 1000)}`);
      });

      socket.on("user:list", ({users, id}: {users: User[], id: string}) => {
        if (id !== this.user.id) {
          this.users = users.filter((user) => user.id !== this.user.id);
        }
      });

      // update the store when a message is received
      socket.on("message:created", (message: Message) => {
        this.messages.push(message);
      });
    },

    createUser(name: string) {
      const user: User = {
        ...defaultUser(),
        name,
      };
      this.user = user;
      socket.emit("user:create", user, (newUser: User) => {
        this.user = newUser;
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

    updateUserPosition({position, rotation}: {position: User['position'], rotation: User['rotation']}) {
      this.user.position = position;
      this.user.rotation = rotation;
      socket.emit("user:change", this.user);
    },
  },
});