<script setup lang="ts">
import * as THREE from 'three';
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useUsersStore } from "@/stores/users";
import { useUiStore } from "@/stores/ui";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import Controls from '@/components/Controls.vue'
import TouchControl from '@/components/TouchControl.vue'
import { resetModels, loadGround, loadSky, setThirdPersonCamera, loadLights, config, setBrickBlock, setQuestionBlock, setCoinBlock } from '@/utils/threeJs';
import RAPIER from '@dimforge/rapier3d'

const gravity = new RAPIER.Vector3(0.0, -9.81, 0.0)
const world = new RAPIER.World(gravity)
const dynamicBodies: Record<'ground' | 'characters' | 'blocks', [THREE.Object3D, RAPIER.RigidBody][]> = {
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
let frame: number = 0;
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

  // Create a dynamic rigid body for the model
  const modelBodyDesc = RAPIER.RigidBodyDesc.newDynamic().setTranslation(model.position.x, model.position.y, model.position.z);
  const modelBody = world.createRigidBody(modelBodyDesc);
  const modelBodyHandle = world.createRigidBody(modelBodyDesc);

  // Create a collider for the model
  const modelColliderDesc = RAPIER.ColliderDesc.cuboid(0.03, 0.03, 0.03);
  world.createCollider(modelColliderDesc, modelBodyHandle);

  // Store the model and its rigid body for later use
  dynamicBodies.characters.push([model, modelBody]);

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
  userStore.blocks.forEach((block) => {
    switch (block.type) {
      case 'brick': setBrickBlock(block, scene); break;
      case 'question': setQuestionBlock(block, scene); break;
      case 'coin': setCoinBlock(block, scene); break;
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

    if (mixer) {
      if ([
        'left',
        'right',
        'up',
        'down',
        'jump',
      ].some(action => uiStore.controls[action])) {
        playAnimationModel(mixer, frame)
        
        // For some reason the rotation is reported as Euler type but it's not
        userStore.updateUserData({ position: model.position, rotation: model.rotation });
      } else {
        resetAnimationModel(mixer)
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
  dynamicBodies.ground.push(groundData)
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

      // Step the physics simulation forward
      world.step();

      // Update the position and rotation of your objects based on the physics simulation
      dynamicBodies.characters.forEach(([object, body]) => {
        // const translation = body.translation();
        // object.position.set(translation.x, translation.y, translation.z);
        // const rotation = body.rotation();
        // object.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
      });

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
