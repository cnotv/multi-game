<script setup lang="ts">
import * as THREE from 'three';
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { useUsersStore } from "@/stores/users";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import Controls from '@/components/Controls.vue'

type Model = THREE.Group<THREE.Object3DEventMap>
type UserModel = {
  model: Model,
  mixer: THREE.AnimationMixer,
  status: {
    jumping?: boolean,
  }
}

const userStore = useUsersStore();
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

const keyState: Record<string, boolean> = {}
const keyUp = (event: KeyboardEvent) => (keyState[event.key] = true)
const keyDown = (event: KeyboardEvent) => (keyState[event.key] = false)

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
        setModel().then(cube => {
          players[user.id] = cube;
        });
        // TODO: Avoid to create a new player and remove models by ID
        player = await setModel();
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
 * Remove all the models types from the scene
 */
const resetModels = (scene: THREE.Scene) => {
  for (let i = scene.children.length - 1; i >= 0; i--) {
    const object = scene.children[i];
    if (object instanceof THREE.Group && object.isObject3D) {
      scene.remove(object);
    }
  }
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
const setModel = async (): Promise<UserModel> => {
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
    [user.id]: setModel()
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
      ].some(key => keyState[key])) {
        playAnimationModel(mixer, frame)
        // For some reason the rotation is reported as Euler type but it's not
        userStore.updateUserPosition({ position: model.position, rotation: model.rotation as unknown as UserRotation });
      } else {
        resetAnimationModel(mixer)
      }
    } 

    if (keyState['ArrowUp'] || keyState['w']) {
      // model.position.z -= 0.1
        // Calculate the forward vector
        const forward = new THREE.Vector3();
        model.getWorldDirection(forward);
        forward.multiplyScalar(config.speed.move * 0.01);

        // Add the forward vector to the model's position
        model.position.add(forward);
    }
    if (keyState['ArrowDown'] || keyState['s']) {
      // model.position.z += 0.1
      // Calculate the forward vector
      const forward = new THREE.Vector3();
      model.getWorldDirection(forward);
      forward.negate();
      forward.multiplyScalar(config.speed.move * 0.01);

      // Add the forward vector to the model's position
      model.position.add(forward);
    }
    if (keyState['ArrowLeft'] || keyState['a']) {
      model.rotateY(config.speed.rotate * 0.01)
    }
    if (keyState['ArrowRight'] || keyState['d']) {
      model.rotateY(-config.speed.rotate * 0.01)
    }

    if (keyState[' ']) {
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

  updateCamera(camera, frame);
}

const loadGround = (scene: THREE.Scene, loader: THREE.TextureLoader) => {
  const groundGeometry = new THREE.PlaneGeometry(config.worldSize, config.worldSize);
  const groundTexture = loader.load(new URL('../assets/grass2.jpg', import.meta.url) as unknown as string);

  // Repeat the texture
  groundTexture.wrapS = THREE.RepeatWrapping;
  groundTexture.wrapT = THREE.RepeatWrapping;
  groundTexture.repeat.set(10, 10);  // Repeat the texture 10 times in both directions

  const groundMaterial = new THREE.MeshBasicMaterial({ map: groundTexture });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;  // Rotate the ground to make it horizontal
  ground.position.y = -0.5;
  scene.add(ground);
}

const loadSky = (scene: THREE.Scene, loader: THREE.TextureLoader) => {
  const skyGeometry = new THREE.SphereGeometry(config.worldSize, 32, 32);
  const skyTexture = loader.load(new URL('../assets/landscape.jpg', import.meta.url) as unknown as string);
  const skyMaterial = new THREE.MeshBasicMaterial({ map: skyTexture, side: THREE.BackSide });
  const sky = new THREE.Mesh(skyGeometry, skyMaterial);
  scene.add(sky);
}

const loadEnv = (scene: THREE.Scene) => {
  const loader = new THREE.TextureLoader();
  loadGround(scene, loader);
  loadSky(scene, loader);
}

const loadLights = (scene: THREE.Scene) => {
  // const light = new THREE.PointLight(0xffffff, 50, config.light.distance, config.light.decay);  // Increase the intensity
  // light.position.set(4, 4, 4);  // Adjust the position
  // scene.add(light);
  // const ambientLight = new THREE.AmbientLight(0xffffff, config.light.intensity);  // Add an ambient light
  // scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1.0);
  directionalLight.position.set(-100, 100, 100);
  directionalLight.target.position.set(0, 0, 0);
  directionalLight.castShadow = true;
  directionalLight.shadow.bias = -0.001;
  directionalLight.shadow.mapSize.width = 4096;
  directionalLight.shadow.mapSize.height = 4096;
  directionalLight.shadow.camera.near = 0.1;
  directionalLight.shadow.camera.far = 500.0;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 500.0;
  directionalLight.shadow.camera.left = 50;
  directionalLight.shadow.camera.right = -50;
  directionalLight.shadow.camera.top = 50;
  directionalLight.shadow.camera.bottom = -50;
  scene.add(directionalLight);

  const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.25);
  scene.add(ambientLight);
}

const getOffset = (model: Model) => {
  const { x, y, z } = config.offset;
  const offset = new THREE.Vector3(x, y, z)
  offset.applyQuaternion(model.quaternion);
  offset.add(model.position);

  return offset;
}

const getLookAt = (model: Model) => {
  const { x, y, z } = config.lookAt;
  const lookAt = new THREE.Vector3(x, y, z)
  lookAt.applyQuaternion(model.quaternion);
  lookAt.add(model.position);

  return lookAt;
}

const updateCamera = (camera: THREE.PerspectiveCamera, frame: number) => {
  if (player) {
    const offset = getOffset(player.model);
    const lookAt = getLookAt(player.model);

    camera.position.copy(offset);
    camera.lookAt(lookAt);
  }
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
 
const init = async(canvas: HTMLCanvasElement) => {
  const setup = async () => {
    const { scene, renderer, camera } = loadScene(canvas);
    window.addEventListener('resize', onBrowserResize.bind(null, camera, renderer))
    loadLights(scene);
    resetModels(scene)
    players = await setPlayers(scene);
    player = await setModel();
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
</template>
