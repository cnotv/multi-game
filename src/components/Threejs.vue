<script setup lang="ts">
import * as THREE from 'three';
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useUsersStore } from "@/stores/users";
import { useUiStore } from "@/stores/ui";
import Controls from '@/components/Controls.vue'
import TouchControl from '@/components/TouchControl.vue'
import { resetModels, setThirdPersonCamera, loadLights, updateAnimation } from '@/utils/threeJs';
import RAPIER from '@dimforge/rapier3d'
import { movePlayer } from '@/utils/game';
import { getPlayer, getGround, getSky, getBrickBlock, getQuestionBlock, getCoinBlock, getBall } from '@/utils/models';
import { gameConfig } from '@/config';

const gravity = new RAPIER.Vector3(0.0, -9.81, 0.0)
const world = new RAPIER.World(gravity)
const dynamicBodies: Record<BlockTypes, PhysicObject[]> = {
  characters: [],
  ground: [],
  blocks: []
};

const userStore = useUsersStore();
const uiStore = useUiStore();
const isFocused = ref(true)
const canvas = ref(null)

let scene: THREE.Scene;
let players: Record<string, UserModel> = {};
let player: UserModel | null = null;
let delta: number = 0;
let globalCamera: THREE.PerspectiveCamera;

onMounted(async() => {
  const handleFocusIn = () => (isFocused.value = false)
  const handleFocusOut = () => (isFocused.value = true)

  window.addEventListener('focusin', handleFocusIn)
  window.addEventListener('focusout', handleFocusOut)
  
  onUnmounted(() => {
    window.removeEventListener('focusin', handleFocusIn)
    window.removeEventListener('focusout', handleFocusOut)
    window.removeEventListener('resize', () => onBrowserResize)
  }) 

  await init(
    canvas.value as unknown as HTMLCanvasElement,
  );
})

watch(() => userStore.users, async (newValue) => {
  const userIds = newValue.map(user => user.id)
  const playersIds = Object.keys(players)
  if (userIds.length !== playersIds.length || userIds.every((id, index) => id === playersIds[index])) {
    userStore.users.forEach(async(user) => {
      const cube = players[user.id];
      if (!cube) {
        resetModels(scene)
        getPlayer(scene, world, dynamicBodies, gameConfig).then(cube => {
          players[user.id] = cube;
        });
        // TODO: Avoid to create a new player and remove models by ID
        player = await getPlayer(scene, world, dynamicBodies, gameConfig);
        // loadFonts(player.model, userStore.user.name);
      } else {
        updatePosition(cube, user, delta);
      }
    });
  }
})

/**
 * Generate all the models for the users and add them to the scene
 */
const setPlayers = async (scene: THREE.Scene): Promise<Record<string, UserModel>> => {
  const players = userStore.users.reduce(async (acc, user) => ({
    ...acc,
    [user.id]: getPlayer(scene, world, dynamicBodies, gameConfig)
  }), {});

  return players;
}

const setBlocks = (scene: THREE.Scene) => {
  userStore.blocks.forEach((block) => {
    let model, rigidBody, collider;
    switch (block.type) {
      case 'brick': ({ model, rigidBody, collider } = getBrickBlock(block, scene, world)); break;
      case 'question': getQuestionBlock(block, scene, world); break;
      case 'coin': getCoinBlock(block, scene, world); break;
      default:
        break;
    }

    if (model && rigidBody) {
      dynamicBodies.blocks.push({ model, rigidBody, collider });
    }
  });
}

/**
 * Update the position of the character
 */
const updatePosition = (character: UserModel, user: User, delta: number) => {
  const { model, mixer, actions } = character;
  if (model) {
    if (user.position && model.position) {
      model.position.set(user.position.x, user.position.y, user.position.z);
    }
    if (user.rotation && model.rotation) {
      model.rotation.set(user.rotation._x, user.rotation._y, user.rotation._z);
    } 
  }
  updateAnimation(mixer, actions, delta, gameConfig.speed.move);
}

const loadEnv = (scene: THREE.Scene) => {
  const loader = new THREE.TextureLoader();
  getGround(scene, loader, gameConfig, '../assets/grass2.jpg', world, dynamicBodies)
  getSky(scene, loader, gameConfig, '../assets/landscape.jpg');
}

const onBrowserResize = (camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Initialize ThreeJS scene and return used tools
 */
const loadScene = (canvas: HTMLCanvasElement) => {
  // Scene setup
  const renderer = new THREE.WebGLRenderer({ canvas: canvas });
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setClearColor(0x000000); // Set background color to black
  globalCamera = new THREE.PerspectiveCamera( gameConfig.fov, gameConfig.aspect, gameConfig.near, gameConfig.far );
  scene = new THREE.Scene();

  return { scene, renderer, camera: globalCamera };
}

const onConfigUpdate = ({ key, config }: { key: string, config: Record<string, any >}) => {
  Object.assign(config, config);

  if (key === 'showHelpers') {
    if (config.showHelpers) {
      // Camera helper
      const helper = new THREE.CameraHelper(globalCamera);
      scene.add(helper);

      // Ground helper
      const axesHelper = new THREE.AxesHelper(500);
      scene.add(axesHelper);
    } else {
      // Get indexes and reverse for removing the last element first
      const indexes = scene.children
        .filter(child => child instanceof THREE.CameraHelper || child instanceof THREE.AxesHelper)
        .map(child => scene.children.indexOf(child));
      indexes.sort((a, b) => b - a).forEach(i => scene.remove(scene.children[i]));
    }
  }

  if (key === 'light') {
    const indexes = scene.children
      .filter(child => child instanceof THREE.PointLight)
      .map(child => scene.children.indexOf(child));
    indexes.sort((a, b) => b - a).forEach(i => scene.remove(scene.children[i]));
      
    loadLights(scene);
  }
}

/**
 * Set key state based on the touch direction
 */
const onTouchMoved = ((direction: BidimensionalCoords | void) => {
  if (!direction) {
    uiStore.controls.up = false;
    uiStore.controls.down = false;
    uiStore.controls.left = false;
    uiStore.controls.right = false;
  } else {
    const { x, y } = direction;
    const threshold = 25;
    uiStore.controls.up = y < -threshold;
    uiStore.controls.down = y > threshold;
    uiStore.controls.left = x < -threshold;
    uiStore.controls.right = x > threshold;
  }
});
 
const init = async(canvas: HTMLCanvasElement) => {
  const setup = async () => {
    // SETUP
    const { scene, renderer, camera } = loadScene(canvas);
    const clock = new THREE.Clock();
    window.addEventListener('resize', onBrowserResize.bind(null, camera, renderer))
    loadLights(scene);

    // POPULATE
    resetModels(scene)
    players = await setPlayers(scene);
    player = await getPlayer(scene, world, dynamicBodies, gameConfig);
    // loadFonts(player.model, userStore.user.name);
    loadEnv(scene);
    setBlocks(scene);

    player.model.rotation.set(0, 1.5, 0);
    const balls = [
      getBall(1, [10, 2, 0], scene, world),
      getBall(1, [10, 5, 0], scene, world),
      getBall(1, [10, 6, 0], scene, world),
      getBall(1, [10, 7, 0], scene, world),
      getBall(1, [10, 8, 0], scene, world),
      getBall(1, [10, 9, 0], scene, world),
      getBall(1, [10, 5, 0], scene, world),
      getBall(1, [10, 5, 0], scene, world),
      getBall(1, [10, 20, 0], scene, world),
      getBall(1, [10, 15, 0], scene, world),
      getBall(1, [10, 30, 0], scene, world),
      getBall(1, [10, 50, 0], scene, world),
    ];

    userStore.dynamicBodies = dynamicBodies;
    
    function animate() {
      requestAnimationFrame(animate);
      delta = clock.getDelta();

      if (player) {
        movePlayer(player, gameConfig, world, delta, dynamicBodies, uiStore.controls, userStore.updateUserData, isFocused.value);
        setThirdPersonCamera(camera, gameConfig, player)
      }

      balls.forEach(({ model, rigidBody }) => {
        let position = rigidBody.translation();
        model.position.set(position.x, position.y, position.z);
        let rotation = rigidBody.rotation();
        model.rotation.set(rotation.x, rotation.y, rotation.z);
      });

      // Update the position and rotation of your objects based on the physics simulation
      dynamicBodies.characters.forEach(({ model, rigidBody, helper }) => {
        const position = rigidBody.translation();
        model.position.set(position.x, position.y, position.z);
 
        // HELPERS: Update model body position
        if (gameConfig.showBodyHelpers) {
          helper.position.set(rigidBody.position);
          helper.rotation.set(rigidBody.rotation);
          helper.update();
        }
      });

      // Step the physics simulation forward
      world.step();
      renderer.render( scene, camera );
    }
    animate();
  }
  setup();
}
</script>

<template>
  <Controls :config="gameConfig" @update="onConfigUpdate" />

  <canvas ref="canvas"></canvas>

  <div v-if="uiStore.isTouchDevice && !uiStore.isChatOpen">
    <TouchControl
      style="left: 25px; bottom: 25px;"
      ref="touchControlInside"
      class="touch-control"
      @moved="onTouchMoved"
      @touchend="onTouchMoved"
    />
    <TouchControl
      style="right: 25px; bottom: 25px;"
      ref="touchControlInside"
      class="touch-control"
      @touchstart="() => uiStore.controls.jump = true"
      @touchend="() => uiStore.controls.jump = false"
    />
  </div>
</template>
