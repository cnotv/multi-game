<script setup lang="ts">
import * as THREE from 'three';
import { ref, onMounted, onUnmounted } from 'vue';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import font from '@/assets/Lato_Regular.json';

const isFocused = ref(false)
const canvas = ref(null)
const props = defineProps<{
  users: User[]
}>()

let velocityY = 0
const gravity = 0.01

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

const init = (canvas: HTMLCanvasElement) => {
  const setup = () => {
    const renderer = new THREE.WebGLRenderer({ canvas: canvas });
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor(0x000000); // Set background color to black
    
    const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    const scene = new THREE.Scene();
    const orbit = new OrbitControls(camera, renderer.domElement);
    
    camera.position.z = 5;

    const geometry = new THREE.BoxGeometry( 1, 1, 1 );
    const material = new THREE.MeshBasicMaterial( { color: 0x333333 } );
    const cubes = props.users.map(() => new THREE.Mesh(geometry, material));
    
    if (cubes[0]) {
      orbit.target.copy(cubes[0].position);
    }

    // Load the font
    const loader = new FontLoader();
    loader.load('font', function (font) {
      // Create a TextGeometry with the user name
      const geometry = new THREE.TextGeometry(props.users[0].name, {
        font: font,
        size: 0.5,
        height: 0.1,
      });

      // Add the TextGeometry to the cube
      const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const text = new THREE.Mesh(geometry, material);
      cubes.forEach((cube) => cube.add(text));
    });
    
    cubes.forEach((cube) => scene.add(cube));
    
    function animate() {
      requestAnimationFrame(animate);

      if (isFocused.value) {
        if (keyState['ArrowUp'] || keyState['w']) cubes[0].position.z += 0.1
        if (keyState['ArrowDown'] || keyState['s']) cubes[0].position.z -= 0.1
        if (keyState['ArrowLeft'] || keyState['a']) cubes[0].position.x -= 0.1
        if (keyState['ArrowRight'] || keyState['d']) cubes[0].position.x += 0.1

        if (keyState[' ']) {
          velocityY = 0.1  // Set an upward velocity when the space key is pressed
        }
      }


      // Apply the velocity and gravity
      velocityY -= gravity
      cubes[0].position.y += velocityY

      // Prevent the cube from falling below the ground
      if (cubes[0].position.y < 0) {
        cubes[0].position.y = 0
        velocityY = 0
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
  <canvas ref="canvas"></canvas>
</template>

