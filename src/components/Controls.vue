<script setup lang="ts">
import { watch } from 'vue';
import * as dat from "dat.gui";
import { useUiStore } from "@/stores/ui";

const uiStore = useUiStore();
let gui: dat.GUI | null = null;

watch(() => uiStore.isConfigOpen, (open) => {
  if (open) {
    gui = new dat.GUI({name: 'asd'});
    const control = gui.addFolder("control");
    control.open();
  } else if (gui) {
    gui.destroy();
    gui = null;
  }
});

</script>

<template>
  <div 
    v-if="uiStore.isConfigOpen"
    id="gui"
  ></div>
</template> 

<style lang="scss">
.dg.main.a {
  margin-top: 50px;
  float: left;
}
</style>