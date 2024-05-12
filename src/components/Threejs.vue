<script setup lang="ts">
import * as THREE from 'three';
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { useUsersStore } from "@/stores/users";
import { useUiStore } from "@/stores/ui";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import Controls from '@/components/Controls.vue'
import TouchControl from '@/components/TouchControl.vue'
import { resetModels, loadGround, loadSky, setThirdPersonCamera, loadLights } from '@/utils/threeJs';

const userStore = useUsersStore();
const uiStore = useUiStore();
const isFocused = ref(true)
const canvas = ref(null)

let scene: THREE.Scene;
let players: Record<string, UserModel> = {};
let player: UserModel | null = null;
let frame: number = 0;
let globalCamera: THREE.PerspectiveCamera;

const config = {
  velocityY: 0,
  gravity: 25,
  worldSize: 500,
  fov: 60,
  aspect: window.innerWidth / window.innerHeight,
  near: 1.0,
  far: 1000.0,
  showHelpers: false,
  speed: {
    move: 25,
    rotate: 3,
    jump: 45
  },
  offset: {
    x: 0,
    y: 4,
    z: -22,
  },
  lookAt: {
    x: 0,
    y: 10,
    z: 50,
  },
  light: {
    intensity: 50,
    distance: 0,
    decay: 2,
  }
}

const keyUp = (event: KeyboardEvent) => uiStore.setKeyState(event.key, true)
const keyDown = (event: KeyboardEvent) => uiStore.setKeyState(event.key, false)

onMounted(async() => {
  const handleFocusIn = () => (isFocused.value = false)
  const handleFocusOut = () => (isFocused.value = true)

  window.addEventListener('focusin', handleFocusIn)
  window.addEventListener('focusout', handleFocusOut)
  window.addEventListener('keydown', keyUp)
  window.addEventListener('keyup', keyDown)
  
  onUnmounted(() => {
    window.removeEventListener('focusin', handleFocusIn)
    window.removeEventListener('focusout', handleFocusOut)
    window.removeEventListener('keydown', keyUp)
    window.removeEventListener('keyup', keyDown)
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
        setModel(scene).then(cube => {
          players[user.id] = cube;
        });
        // TODO: Avoid to create a new player and remove models by ID
        player = await setModel(scene);
        // loadFonts(player.model, userStore.user.name);
      } else {
        updatePosition(cube, user, frame);
      }
    });
  }
})

/**
 * Add fonts on top of the model
 */
const loadFonts = (model: Model, name: string) => {
  // Load the font
  const loader = new FontLoader();
  const fontFile = new URL('../assets/Lato_Regular.json', import.meta.url) as unknown as string;

  loader.load(fontFile, function (font) {
    // Create a TextGeometry with the user name
    const geometry = new TextGeometry(name, {
      font: font,
      size: 0.2,
      depth: 0.1,
    });

    // Add the TextGeometry to the model
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const text = new THREE.Mesh(geometry, material);
    // text.position.z = 0.5;
    text.position.y = 0.7;
    text.position.x = -0.35;
    model.add(text)
  });
}


/**
 * Return threeJS valid 3D model
 */
const loadModel = (): Promise<{ model: Model, gltf: any}> => {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load('goomba.glb', (gltf) => {
      resolve({model: gltf.scene, gltf});
    }, undefined, reject);
  });
}

const playAnimationModel = (mixer: THREE.AnimationMixer, frame: number) => {
  if (mixer) {
    mixer.timeScale = 1;
    if (frame % 6 === 0) {
      mixer.update(frame / 2);
    }
  }
} 

const resetAnimationModel = (mixer: THREE.AnimationMixer) => {
  if (mixer) {
    mixer.timeScale = 0;
  } 
} 

const setAnimationModel = (mixer: THREE.AnimationMixer, model: Model, gltf: any) => {
  // Flip the model
  model.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI);
  const action = mixer.clipAction(gltf.animations[0]);
  action.play();
  mixer.timeScale = 0;
}

/**
 * Generate model with predefined information (e.g. position) and add it to the scene
 */
const setModel = async (scene: THREE.Scene): Promise<UserModel> => {
  // Load the model
  const {model, gltf} = await loadModel();
  // Create an AnimationMixer and set the first animation to play
  const mixer = new THREE.AnimationMixer(model)
  model.scale.set(0.03, 0.03, 0.03);
  setAnimationModel(mixer, model, gltf);
  scene.add(model);

  return {model, mixer, status: {}};
}

/**
 * Generate all the models for the users and add them to the scene
 */
const setPlayers = async (scene: THREE.Scene): Promise<Record<string, UserModel>> => {
  const players = userStore.users.reduce(async (acc, user) => ({
    ...acc,
    [user.id]: setModel(scene)
  }), {});

  return players;
}

const setBlocks = (scene: THREE.Scene) => {
  const loader = new THREE.TextureLoader();

  userStore.blocks.forEach((block) => {
    switch (block.type) {
      case 'brick': {
        const texture = loader.load(new URL('../assets/brick.jpg', import.meta.url) as unknown as string);
        const material = new THREE.MeshBasicMaterial({ map: texture });
        const geometry = new THREE.BoxGeometry(2.5, 2.5, 2.5);
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(block.position.x, block.position.y, block.position.z);
        scene.add(cube);
        break;
      }
      
      case 'question': {
        const loader = new THREE.TextureLoader();

        // Load the textures
        const textures = [
          loader.load(new URL('../assets/question_symbol.jpg', import.meta.url) as unknown as string),
          loader.load(new URL('../assets/question_symbol.jpg', import.meta.url) as unknown as string),
          loader.load(new URL('../assets/question_empty.jpg', import.meta.url) as unknown as string),
          loader.load(new URL('../assets/question_empty.jpg', import.meta.url) as unknown as string),
          loader.load(new URL('../assets/question_symbol.jpg', import.meta.url) as unknown as string),
          loader.load(new URL('../assets/question_symbol.jpg', import.meta.url) as unknown as string),
        ];
        const materials = textures.map(texture => new THREE.MeshBasicMaterial({ map: texture }));
        const geometry = new THREE.BoxGeometry(2.5, 2.5, 2.5);
        const cube = new THREE.Mesh(geometry, materials);
        cube.position.set(block.position.x, block.position.y, block.position.z);
        scene.add(cube);
        break;
      }

      case 'coin': {
        const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const geometry = new THREE.CylinderGeometry(1.25, 1.25, 0.1, 32);
        const coin = new THREE.Mesh(geometry, material);
        coin.position.set(block.position.x, block.position.y, block.position.z);
        coin.rotation.x = Math.PI / 2;
        scene.add(coin);
        break;
      }
    
      default:
        break;
    }
  });
}

/**
 * Update the position of the cube
 */
const updatePosition = (cube: UserModel, user: User, frame: number) => {
  const { model, mixer } = cube;
  if (model) {
    if (user.position && model.position) {
      model.position.set(user.position.x, user.position.y, user.position.z);
    }
    if (user.rotation && model.rotation) {
      model.rotation.set(user.rotation._x, user.rotation._y, user.rotation._z);
    } 
  }
  // const oldMovement = JSON.stringify(user.position) + JSON.stringify(user.rotation);
  // const newMovement = JSON.stringify(model.position) + JSON.stringify(model.rotation);
  // if (oldMovement !== newMovement) {
    playAnimationModel(mixer, frame);
  // } else {
    // resetAnimationModel(mixer);
  // }
}

/**
 * Move the player and emit new scene information
 */
const movePlayer = (player: UserModel, frame: number, camera: THREE.PerspectiveCamera) => {
  const { model, mixer } = player;
  if (isFocused.value) {
    if (mixer) {
      if ([
        'ArrowUp',
        'w',
        'ArrowDown',
        's',
        'ArrowLeft',
        'a',
        'ArrowRight',
        'd',
        ' ',
      ].some(key => uiStore.keyState[key])) {
        playAnimationModel(mixer, frame)
        // For some reason the rotation is reported as Euler type but it's not
        userStore.updateUserPosition({ position: model.position, rotation: model.rotation as unknown as UserRotation });
      } else {
        resetAnimationModel(mixer)
      }
    } 

    if (uiStore.keyState['ArrowUp'] || uiStore.keyState['w']) {
      // model.position.z -= 0.1
        // Calculate the forward vector
        const forward = new THREE.Vector3();
        model.getWorldDirection(forward);
        forward.multiplyScalar(config.speed.move * 0.01);

        // Add the forward vector to the model's position
        model.position.add(forward);
    }
    if (uiStore.keyState['ArrowDown'] || uiStore.keyState['s']) {
      // model.position.z += 0.1
      // Calculate the forward vector
      const forward = new THREE.Vector3();
      model.getWorldDirection(forward);
      forward.negate();
      forward.multiplyScalar(config.speed.move * 0.01);

      // Add the forward vector to the model's position
      model.position.add(forward);
    }
    if (uiStore.keyState['ArrowLeft'] || uiStore.keyState['a']) {
      model.rotateY(config.speed.rotate * 0.01)
    }
    if (uiStore.keyState['ArrowRight'] || uiStore.keyState['d']) {
      model.rotateY(-config.speed.rotate * 0.01)
    }

    if (uiStore.keyState[' ']) {
      if (!player.status.jumping) {
        config.velocityY = config.speed.jump * 0.01  // Set an upward velocity when the space key is pressed
        player.status.jumping = true
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
  loadGround(scene, loader, config, '../assets/grass2.jpg');
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
      const helper = new THREE.CameraHelper(globalCamera);
      scene.add(helper);
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
const onMoved = ((direction: BidimensionalCoords | void) => {
  if (!direction) {
    uiStore.keyState['ArrowUp'] = false;
    uiStore.keyState['ArrowDown'] = false;
    uiStore.keyState['ArrowLeft'] = false;
    uiStore.keyState['ArrowRight'] = false;
  } else {
    const { x, y } = direction;
    const threshold = 25;
    uiStore.keyState['ArrowUp'] = y < -threshold;
    uiStore.keyState['ArrowDown'] = y > threshold;
    uiStore.keyState['ArrowLeft'] = x < -threshold;
    uiStore.keyState['ArrowRight'] = x > threshold;
  }
});
 
const init = async(canvas: HTMLCanvasElement) => {
  const setup = async () => {
    const { scene, renderer, camera } = loadScene(canvas);
    window.addEventListener('resize', onBrowserResize.bind(null, camera, renderer))
    loadLights(scene);
    resetModels(scene)
    players = await setPlayers(scene);
    player = await setModel(scene);
    // loadFonts(player.model, userStore.user.name);
    loadEnv(scene);
    setBlocks(scene);
    
    function animate() {
      frame = requestAnimationFrame(animate);
      if (player) {
        movePlayer(player, frame, camera);
      }
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
      @moved="onMoved"
      @touchend="onMoved"
    />
    <TouchControl
      style="right: 25px; bottom: 25px;"
      ref="touchControlInside"
      class="touch-control"
      @touchstart="() => keyUp({ key: ' ' } as KeyboardEvent)"
      @touchend="() => keyDown({ key: ' ' } as KeyboardEvent)"
    />
  </div>
</template>
