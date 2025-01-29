<script setup lang="ts">
import * as THREE from 'three';
import { ref, onMounted, onUnmounted, watch, h } from 'vue';
import { useUsersStore } from "@/stores/users";
import { useUiStore } from "@/stores/ui";
import Controls from '@/components/Controls.vue'
import TouchControl from '@/components/TouchControl.vue'
import { resetModels, loadGround, loadSky, setThirdPersonCamera, loadLights, config, setBrickBlock, setQuestionBlock, setCoinBlock, getModel } from '@/utils/threeJs';
import RAPIER from '@dimforge/rapier3d'

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
        getModel(scene, world, dynamicBodies).then(cube => {
          players[user.id] = cube;
        });
        // TODO: Avoid to create a new player and remove models by ID
        player = await getModel(scene, world, dynamicBodies);
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
    [user.id]: getModel(scene, world, dynamicBodies)
  }), {});

  return players;
}

const setBlocks = (scene: THREE.Scene) => {
  userStore.blocks.forEach((block) => {
    let model, rigidBody, collider;
    switch (block.type) {
      case 'brick': ({ model, rigidBody, collider } = setBrickBlock(block, scene, world)); break;
      case 'question': setQuestionBlock(block, scene, world); break;
      case 'coin': setCoinBlock(block, scene, world); break;
      default:
        break;
    }

    if (model && rigidBody) {
      dynamicBodies.blocks.push({ model, rigidBody, collider });
    }
  });
}

/**
 * Update the animation of the model based on given time
 */
const updateAnimation = (
  mixer: THREE.AnimationMixer,
  actions: Record<string, THREE.AnimationAction>,
  delta: number = 0,
  speed: number = 0
) => {
  const coefficient = 0.1;
  // const clip = mixer.clipAction();
  // const action = mixer.clipAction(clip);
  if (delta) {
    mixer.update(delta * speed * coefficient);
    actions.run.play();
  } else {
    actions.run.stop();
  }
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
  updateAnimation(mixer, actions, delta, config.speed.move);
}

/**
 * Move the player and emit new scene information
 */
const movePlayer = (player: UserModel, delta: number, camera: THREE.PerspectiveCamera) => {
  const { model, mixer, actions } = player;
  if (isFocused.value) {
    if (uiStore.controls.up) {
      // model.position.z -= 0.1
      // Calculate the forward vector
      const forward = new THREE.Vector3();
      model.getWorldDirection(forward);
      forward.multiplyScalar(config.speed.move * 0.01);

      // Add the forward vector to the model's position
      model.position.add(forward);
    }
    if (uiStore.controls.down) {
      // model.position.z += 0.1
      // Calculate the forward vector
      const forward = new THREE.Vector3();
      model.getWorldDirection(forward);
      forward.negate();
      forward.multiplyScalar(config.speed.move * 0.01);

      // Add the forward vector to the model's position
      model.position.add(forward);
    }
    if (uiStore.controls.left) {
      model.rotateY(config.speed.rotate * 0.01)
    }
    if (uiStore.controls.right) {
      model.rotateY(-config.speed.rotate * 0.01)
    }

    // TODO: Model is updated only on key press and not on movement, so jump animation is not completed
    if (uiStore.controls.jump) {
      if (!player.status.jumping) {
        config.velocityY = config.speed.jump * 0.01  // Set an upward velocity when the space key is pressed
        player.status.jumping = true
      }
    }

    if (mixer && actions) {
      if ([
        'left',
        'right',
        'up',
        'down',
        'jump',
      ].some(action => uiStore.controls[action])) {
        updateAnimation(mixer, actions, delta, config.speed.move);
        
        // For some reason the rotation is reported as Euler type but it's not
        userStore.updateUserData({ position: model.position, rotation: model.rotation });
      } else {
        updateAnimation(mixer, actions);
      }
    } 
  }

  // Apply the velocity and gravity
  config.velocityY -= (config.gravity * 0.001)
  model.position.y += config.velocityY

  // Prevent the model from falling below the ground
  if (model.position.y < 0) {
    model.position.y = 0
    config.velocityY = 0
    player.status.jumping = false
  }

  setThirdPersonCamera(camera, config, player);
}

const loadEnv = (scene: THREE.Scene) => {
  const loader = new THREE.TextureLoader();
  const groundData = loadGround(scene, loader, config, '../assets/grass2.jpg', world)
  dynamicBodies.ground.push(groundData as any)
  loadSky(scene, loader, config, '../assets/landscape.jpg');
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
  globalCamera = new THREE.PerspectiveCamera( config.fov, config.aspect, config.near, config.far );
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
    player = await getModel(scene, world, dynamicBodies);
    // loadFonts(player.model, userStore.user.name);
    loadEnv(scene);
    setBlocks(scene);
    
    function animate() {
      requestAnimationFrame(animate);
      delta = clock.getDelta();

      if (player) {
        movePlayer(player, delta, camera);
      }

      // Update the position and rotation of your objects based on the physics simulation
      dynamicBodies.characters.forEach(({ model, rigidBody, helper }) => {
        // HELPERS: Update model body position
        if (config.showBodyHelpers) {
          helper.position.set(model.position.x, model.position.y, model.position.z);
          helper.rotation.set(model.rotation.x, model.rotation.y, model.rotation.z);
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
  <Controls :config="config" @update="onConfigUpdate" />

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
