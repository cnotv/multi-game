<script setup lang="ts">
import { watch, onUnmounted } from 'vue';
import * as dat from "dat.gui";
import { useUiStore } from "@/stores/ui";

const uiStore = useUiStore();
let gui: dat.GUI | null = null;

const props = defineProps<{
  config: Record<string, any>
}>();
const emit = defineEmits(['update'])

const openControl = (open: boolean) => {
  if (open) {
    gui = new dat.GUI({name: 'asd'});
    const control = gui.addFolder("control");
    control.open();
    // Add controls for each property in the config object
    for (const key in props.config) {
      if (typeof props.config[key] === 'object') {
        control.addFolder(key);
        for (const subKey in props.config[key]) {
          control.add(props.config[key], subKey).onChange((value) => {
            props.config[key][subKey] = value;
            emit('update', { key, config: props.config });
          });
        }
      } else {
        control.add(props.config, key).onChange((value) => {
          props.config[key] = value;
          emit('update', { key, config: props.config });
        });
      }
    }
  }
}
openControl(uiStore.isConfigOpen);
onUnmounted(() => {
  if (gui) {
    gui.destroy();
    gui = null;
  }
});

watch(() => uiStore.isConfigOpen, (open) => {
  if (open) {
    openControl(true);
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