<script setup lang="ts">
import * as THREE from 'three';
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { useUsersStore } from "@/stores/users";
const userStore = useUsersStore();

const isFocused = ref(true)
const canvas = ref(null)

let velocityY = 0
const gravity = 0.01
let scene: THREE.Scene;
let orbit: OrbitControls;
let cubes: Record<string, THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial, THREE.Object3DEventMap>> = {};

const keyState: Record<string, boolean> = {}
const keyUp = (event: KeyboardEvent) => (keyState[event.key] = true)
const keyDown = (event: KeyboardEvent) => (keyState[event.key] = false)

onMounted(() => {
  const handleFocusIn = () => (isFocused.value = false)
  const handleFocusOut = () => (isFocused.value = true)

  window.addEventListener('focusin', handleFocusIn)
  window.addEventListener('focusout', handleFocusOut)
  window.addEventListener('keydown', keyUp)
  window.addEventListener('keyup', keyDown)
  // window.addEventListener('keydown', console.log)

  onUnmounted(() => {
    window.removeEventListener('focusin', handleFocusIn)
    window.removeEventListener('focusout', handleFocusOut)
    window.removeEventListener('keydown', keyUp)
    window.removeEventListener('keyup', keyDown)
  })

  init(
    canvas.value as unknown as HTMLCanvasElement,
  );
})

watch(() => userStore.users, (newValue) => {
  const userIds = newValue.map(user => user.id)
  const cubesIds = Object.keys(cubes)
  if (userIds.length !== cubesIds.length || userIds.every((id, index) => id === cubesIds[index])) {
    cubes = setCubes(scene, orbit);
    loadFonts();
  }
  updatePosition();
})

const loadFonts = () => {
  // Load the font
  const loader = new FontLoader();
  const fontFile = new URL('../assets/Lato_Regular.json', import.meta.url) as unknown as string;

  userStore.users.forEach(user => {
    const cube = cubes[user.id];
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

const resetCubes = (scene: THREE.Scene) => {
  for (let i = scene.children.length - 1; i >= 0; i--) {
    const object = scene.children[i];
    if (object instanceof THREE.Mesh && object.geometry instanceof THREE.BoxGeometry) {
      scene.remove(object);
    }
  }
}

const setCubes = (scene: THREE.Scene, orbit: OrbitControls) => {
  resetCubes(scene)

  // Add cubes
  const geometry = new THREE.BoxGeometry( 1, 1, 1 );
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x3268F8),
    roughness: 0.2,
    metalness: 0.7,
  });

  const cubes = userStore.users.reduce((acc, user) => {
    const cube = new THREE.Mesh(geometry, material)
    scene.add(cube)
    if (user.position) {
      cube.position.x = user.position.x;
      cube.position.y = user.position.y;
      cube.position.z = user.position.z;
    }

    return {
      ...acc,
      [user.id]: cube
    };
  }, {});
  // orbit.target.copy(cubes[0].position);

  return cubes;
}

const updatePosition = () => {
  userStore.users.forEach(user => {
    const cube = cubes[user.id];
    if (user.position) {
      cube.position.x = user.position.x;
      cube.position.y = user.position.y;
      cube.position.z = user.position.z;
    }
  });
}

const loadGround = (scene: THREE.Scene, loader: THREE.TextureLoader) => {
  const groundGeometry = new THREE.PlaneGeometry(100, 100);
  const groundTexture = loader.load(new URL('../assets/grass.jpg', import.meta.url) as unknown as string);
  const groundMaterial = new THREE.MeshBasicMaterial({ map: groundTexture });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;  // Rotate the ground to make it horizontal
  ground.position.y = -0.5;
  scene.add(ground);
}

const loadSky = (scene: THREE.Scene, loader: THREE.TextureLoader) => {
  const skyGeometry = new THREE.SphereGeometry(50, 32, 32);
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

const moveCube = () => {
  const cube = cubes[userStore.user.id];
  if (cube) {
    if (isFocused.value) {
      if (keyState['ArrowUp'] || keyState['w']) cube.position.z -= 0.1
      if (keyState['ArrowDown'] || keyState['s']) cube.position.z += 0.1
      if (keyState['ArrowLeft'] || keyState['a']) cube.position.x -= 0.1
      if (keyState['ArrowRight'] || keyState['d']) cube.position.x += 0.1

      if (keyState[' ']) {
        velocityY = 0.1  // Set an upward velocity when the space key is pressed
      }
    }


    // Apply the velocity and gravity
    velocityY -= gravity
    cube.position.y += velocityY

    // Prevent the cube from falling below the ground
    if (cube.position.y < 0) {
      cube.position.y = 0
      velocityY = 0
    }
    
    userStore.updateUserPosition(cube.position);
  }
}
 
const init = (canvas: HTMLCanvasElement) => {
  const setup = () => {
    const { scene, orbit, renderer, camera } = loadScene(canvas);
    loadLight(scene);
    cubes = setCubes(scene, orbit);
    loadFonts();
    loadEnv(scene);
    
    function animate() {
      requestAnimationFrame(animate);
      moveCube();
      orbit.update();
      renderer.render( scene, camera );
    }
    animate();
  }
  setup();
}
</script>

<template>
  <canvas ref="canvas"></canvas>
</template>

