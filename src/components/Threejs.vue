<script setup lang="ts">
import * as THREE from 'three';
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { useUsersStore } from "@/stores/users";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import Controls from '@/components/Controls.vue'

type Model = THREE.Group<THREE.Object3DEventMap>
type UserModel = { model: Model, mixer: THREE.AnimationMixer }

const userStore = useUsersStore();
const isFocused = ref(true)
const canvas = ref(null)

let scene: THREE.Scene;
let orbit: OrbitControls;
let players: Record<string, UserModel> = {};
let player: UserModel | null = null;
let frame: number = 0;

const config = {
  velocityY: 0,
  gravity: 0.01,
  worldSize: 500,
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
      } else {
        updatePosition(cube, user, frame);
      }
    });
  }
})

/**
 * Add fonts on top of the cube
 */
const loadFonts = (cube: Model) => {
  // Load the font
  const loader = new FontLoader();
  const fontFile = new URL('../assets/Lato_Regular.json', import.meta.url) as unknown as string;

  userStore.users.forEach(user => {
    loader.load(fontFile, function (font) {
      // Create a TextGeometry with the user name
      const geometry = new TextGeometry(user.name, {
        font: font,
        size: 0.2,
        depth: 0.1,
      });

      // Add the TextGeometry to the cube
      const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const text = new THREE.Mesh(geometry, material);
      // text.position.z = 0.5;
      text.position.y = 0.7;
      text.position.x = -0.35;
      cube.add(text)
    });
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

  return {model, mixer};
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
const movePlayer = (player: UserModel, frame: number, camera: THREE.PerspectiveCamera, orbit: OrbitControls) => {
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
        forward.multiplyScalar(0.1);

        // Add the forward vector to the model's position
        model.position.add(forward);
    }
    if (keyState['ArrowDown'] || keyState['s']) {
      // model.position.z += 0.1
      // Calculate the forward vector
      const forward = new THREE.Vector3();
      model.getWorldDirection(forward);
      forward.negate();
      forward.multiplyScalar(0.1);

      // Add the forward vector to the model's position
      model.position.add(forward);
    }
    if (keyState['ArrowLeft'] || keyState['a']) {
      model.rotateY(0.05)
      camera.rotateY(0.05)
    }
    if (keyState['ArrowRight'] || keyState['d']) {
      model.rotateY(-0.05)
      camera.rotateY(-0.05)
    }

    if (keyState[' ']) {
      config.velocityY = 0.1  // Set an upward velocity when the space key is pressed
    }
  }

  // Apply the velocity and gravity
  config.velocityY -= config.gravity
  model.position.y += config.velocityY

  // Prevent the model from falling below the ground
  if (model.position.y < 0) {
    model.position.y = 0
    config.velocityY = 0
  }

  // Set the camera's position to be a certain offset from the model's position
  camera.position.x = model.position.x;
  camera.position.y = model.position.y + 5; // 5 units above the model
  camera.position.z = model.position.z + 10; // 10 units behind the model

  // Make the camera look at the model
  // camera.lookAt(model.position);
}

const loadGround = (scene: THREE.Scene, loader: THREE.TextureLoader) => {
  const groundGeometry = new THREE.PlaneGeometry(config.worldSize, config.worldSize);
  const groundTexture = loader.load(new URL('../assets/grass.jpg', import.meta.url) as unknown as string);
  const groundMaterial = new THREE.MeshBasicMaterial({ map: groundTexture });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;  // Rotate the ground to make it horizontal
  ground.position.y = -0.5;
  scene.add(ground);
}

const loadSky = (scene: THREE.Scene, loader: THREE.TextureLoader) => {
  const skyGeometry = new THREE.SphereGeometry(config.worldSize, 32, 32);
  const skyTexture = loader.load(new URL('../assets/sky.png', import.meta.url) as unknown as string);
  const skyMaterial = new THREE.MeshBasicMaterial({ map: skyTexture, side: THREE.BackSide });
  const sky = new THREE.Mesh(skyGeometry, skyMaterial);
  scene.add(sky);
}

const loadEnv = (scene: THREE.Scene) => {
  const loader = new THREE.TextureLoader();
  loadGround(scene, loader);
  loadSky(scene, loader);
}

const loadLight = (scene: THREE.Scene) => {
  const light = new THREE.PointLight(0xffffff, 50);  // Increase the intensity
  light.position.set(4, 4, 4);  // Adjust the position
  scene.add(light);
  const ambientLight = new THREE.AmbientLight(0xffffff, 2);  // Add an ambient light
  scene.add(ambientLight);
}

/**
 * Initialize ThreeJS scene and return used tools
 */
const loadScene = (canvas: HTMLCanvasElement) => {
  // Scene setup
  const renderer = new THREE.WebGLRenderer({ canvas: canvas });
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setClearColor(0x000000); // Set background color to black
  const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
  camera.position.z = 5;
  camera.position.y = 1;
  scene = new THREE.Scene();
  orbit = new OrbitControls(camera, renderer.domElement);

  return { scene, orbit, renderer, camera };
}
 
const init = async(canvas: HTMLCanvasElement) => {
  const setup = async () => {
    const { scene, orbit, renderer, camera } = loadScene(canvas);
    loadLight(scene);
    resetModels(scene)
    players = await setPlayers(scene);
    player = await setModel();
    // loadFonts();
    loadEnv(scene);
    
    function animate() {
      frame = requestAnimationFrame(animate);
      // Object.entries(players).forEach(([id, cube]) => {
      //   const user = userStore.users.find(user => user.id === id);
      //   if (cube && user) {
      //     updatePosition(cube, user, frame);
      //   }
      // });
      if (player) {
        movePlayer(player, frame, camera, orbit);
      }
      orbit.update();
      renderer.render( scene, camera );
    }
    animate();
  }
  setup();
}
</script>

<template>
  <Controls :config="config" @update="config => config" />
  <canvas ref="canvas"></canvas>
</template>
