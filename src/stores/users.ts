import { defineStore } from "pinia";
import { socket } from "@/socket";

export const useUsersStore = defineStore("user", {
  state: () => ({
    users: [] as User[],
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
    },

    // createUser(label) {
    //   const user = {
    //     id: Date.now(), // temporary ID for v-for key
    //     label
    //   };
    //   this.users.push(user);

    //   socket.emit("user:create", { label }, (res) => {
    //     user.id = res.data;
    //   });
    // },
  },
});