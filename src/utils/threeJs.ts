import * as THREE from 'three'
import RAPIER, { RigidBody } from '@dimforge/rapier3d'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

export const config = {
  velocityY: 0,
  gravity: 25,
  worldSize: 500,
  fov: 60,
  aspect: window.innerWidth / window.innerHeight,
  near: 1.0,
  far: 1000.0,
  showHelpers: false,
  showBodyHelpers: true,
  speed: {
    move: 40,
    rotate: 5,
    jump: 45
  },
  offset: {
    x: 0,
    y: 4,
    z: -22
  },
  lookAt: {
    x: 0,
    y: 10,
    z: 50
  },
  light: {
    intensity: 50,
    distance: 0,
    decay: 2
  }
}

/**
 * Remove all the models types from the scene
 */
export const resetModels = (scene: THREE.Scene) => {
  for (let i = scene.children.length - 1; i >= 0; i--) {
    const object = scene.children[i]
    if (object instanceof THREE.Group && object.isObject3D) {
      scene.remove(object)
    }
  }
}

export const getGround = (
  scene: THREE.Scene,
  loader: THREE.TextureLoader,
  config: any,
  path: string,
  world: RAPIER.World,
  dynamicBodies: Record<BlockTypes, PhysicObject[]>
): THREE.Object3D => {
  const geometry = new THREE.PlaneGeometry(config.worldSize, config.worldSize)
  const groundTexture = loader.load(new URL(path, import.meta.url) as unknown as string)

  // Repeat the texture
  groundTexture.wrapS = THREE.RepeatWrapping
  groundTexture.wrapT = THREE.RepeatWrapping
  groundTexture.repeat.set(10, 10) // Repeat the texture 10 times in both directions

  const material = new THREE.MeshBasicMaterial({ map: groundTexture })
  const ground = new THREE.Mesh(geometry, material)
  ground.rotation.x = -Math.PI / 2 // Rotate the ground to make it horizontal
  ground.position.set(1, -1, 1)
  scene.add(ground)

  // PHYSIC: Create a static rigid body for the ground
  const rigidBodyDesc = RAPIER.RigidBodyDesc.fixed()
  const rigidBody = world.createRigidBody(rigidBodyDesc)
  const colliderDesc = RAPIER.ColliderDesc.cuboid(500, 1, 500)
  const collider = world.createCollider(colliderDesc, rigidBody)

  // HELPER: Create a mesh to visualize the collider
  const helper = new THREE.BoxHelper(ground, 0x000000)
  if (config.showBodyHelpers) {
    scene.add(helper)
  }

  dynamicBodies.ground.push({ model: ground, rigidBody, helper, collider })

  return ground
}

export const loadSky = (
  scene: THREE.Scene,
  loader: THREE.TextureLoader,
  config: any,
  path: string
) => {
  const skyGeometry = new THREE.SphereGeometry(config.worldSize, 32, 32)
  const skyTexture = loader.load(new URL(path, import.meta.url) as unknown as string)
  const skyMaterial = new THREE.MeshBasicMaterial({ map: skyTexture, side: THREE.BackSide })
  const sky = new THREE.Mesh(skyGeometry, skyMaterial)
  scene.add(sky)
}

export const getOffset = (model: Model, config: any) => {
  const { x, y, z } = config.offset
  const offset = new THREE.Vector3(x, y, z)
  offset.applyQuaternion(model.quaternion)
  offset.add(model.position)

  return offset
}

export const getLookAt = (model: Model, config: any) => {
  const { x, y, z } = config.lookAt
  const lookAt = new THREE.Vector3(x, y, z)
  lookAt.applyQuaternion(model.quaternion)
  lookAt.add(model.position)

  return lookAt
}

export const setThirdPersonCamera = (
  camera: THREE.PerspectiveCamera,
  config: any,
  player: UserModel | null
) => {
  if (player) {
    const offset = getOffset(player.model, config)
    const lookAt = getLookAt(player.model, config)

    camera.position.copy(offset)
    camera.lookAt(lookAt)
  }
}

export const loadLights = (scene: THREE.Scene) => {
  // const light = new THREE.PointLight(0xffffff, 50, config.light.distance, config.light.decay);  // Increase the intensity
  // light.position.set(4, 4, 4);  // Adjust the position
  // scene.add(light);
  // const ambientLight = new THREE.AmbientLight(0xffffff, config.light.intensity);  // Add an ambient light
  // scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0)
  directionalLight.position.set(-100, 100, 100)
  directionalLight.target.position.set(0, 0, 0)
  directionalLight.castShadow = true
  directionalLight.shadow.bias = -0.001
  directionalLight.shadow.mapSize.width = 4096
  directionalLight.shadow.mapSize.height = 4096
  directionalLight.shadow.camera.near = 0.1
  directionalLight.shadow.camera.far = 500.0
  directionalLight.shadow.camera.near = 0.5
  directionalLight.shadow.camera.far = 500.0
  directionalLight.shadow.camera.left = 50
  directionalLight.shadow.camera.right = -50
  directionalLight.shadow.camera.top = 50
  directionalLight.shadow.camera.bottom = -50
  scene.add(directionalLight)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.25)
  scene.add(ambientLight)
}

/**
 * Add fonts on top of the model
 */
export const loadFonts = (model: Model, name: string) => {
  // Load the font
  const loader = new FontLoader()
  const fontFile = new URL('../assets/Lato_Regular.json', import.meta.url) as unknown as string

  loader.load(fontFile, function (font: any) {
    // Create a TextGeometry with the user name
    const geometry = new TextGeometry(name, {
      font: font,
      size: 0.2,
      depth: 0.1
    })

    // Add the TextGeometry to the model
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff })
    const text = new THREE.Mesh(geometry, material)
    // text.position.z = 0.5;
    text.position.y = 0.7
    text.position.x = -0.35
    model.add(text)
  })
}

/**
 * Return threeJS valid 3D model
 */
const loadModel = (): Promise<{ model: Model; gltf: any }> => {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader()
    loader.load(
      'goomba.glb',
      (gltf) => {
        resolve({ model: gltf.scene, gltf })
      },
      undefined,
      reject
    )
  })
}

const getAnimationsModel = (mixer: THREE.AnimationMixer, model: Model, gltf: any) => {
  // Flip the model
  model.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI)
  // action.play()
  return {
    run: mixer.clipAction(gltf.animations[0])
  }
}

/**
 * Generate model with predefined information (e.g. position) and add it to the scene
 */
export const getModel = async (
  scene: THREE.Scene,
  world: RAPIER.World,
  dynamicBodies: Record<BlockTypes, PhysicObject[]>
): Promise<UserModel> => {
  // MODEL: Load
  const { model, gltf } = await loadModel()

  // ANIMATION: Create an AnimationMixer and set the first animation to play
  const mixer = new THREE.AnimationMixer(model)
  model.scale.set(0.03, 0.03, 0.03)
  model.position.y = 1
  const actions = getAnimationsModel(mixer, model, gltf)
  scene.add(model)

  // PHYSIC: Create a dynamic rigid body for the model
  const modelPosition = [model.position.x, model.position.y, model.position.z] as CoordinateTuple
  const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(...modelPosition)
  const rigidBody = world.createRigidBody(rigidBodyDesc)
  rigidBody.setRotation(model.rotation, true)

  // PHYSIC: Create a cuboid collider attached to the dynamic rigidBody.
  const box = new THREE.Box3().setFromObject(model)
  const size = new THREE.Vector3()
  box.getSize(size)

  const helper = new THREE.BoxHelper(model, 0x000000)

  if (config.showBodyHelpers) {
    scene.add(helper)
  }

  const scaledSize = [size.x, size.y, size.z].map((x) => x * 0.6) as CoordinateTuple
  // const scaledSize = [model.with, model.innerHeight, model.deep].map((x) => x * 0.6) as CoordinateTuple
  const colliderDesc = RAPIER.ColliderDesc.cuboid(...(scaledSize as CoordinateTuple))
  const collider = world.createCollider(colliderDesc, rigidBody)

  // PHYSIC: Store the model and its rigid body for later use
  dynamicBodies.characters.push({ model, rigidBody, collider, helper })

  return { model, mixer, status: {}, actions }
}

export const setBrickBlock = (block: GameBlock, scene: THREE.Scene, world: RAPIER.World) => {
  const position: CoordinateTuple = [block.position.x, block.position.y, block.position.z]
  const loader = new THREE.TextureLoader()
  const size = [2.5, 2.5, 2.5]
  const texture = loader.load(new URL('../assets/brick.jpg', import.meta.url) as unknown as string)
  const material = new THREE.MeshBasicMaterial({ map: texture })
  const geometry = new THREE.BoxGeometry(...size)
  const cube = new THREE.Mesh(geometry, material)
  cube.position.set(...position)
  scene.add(cube)

  // Create a dynamic rigid-body.
  const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(...position)
  const rigidBody = world.createRigidBody(rigidBodyDesc)
  rigidBody.setRotation({ w: 1.0, x: 0.5, y: 0.5, z: 0.5 }, true)

  // Create a cuboid collider attached to the dynamic rigidBody.
  const colliderDesc = RAPIER.ColliderDesc.cuboid(...(size.map((x) => x * 0.6) as CoordinateTuple))
  const collider = world.createCollider(colliderDesc, rigidBody)

  return { model: cube, rigidBody, collider }
}

export const setCoinBlock = (block: GameBlock, scene: THREE.Scene, world: RAPIER.World) => {
  const material = new THREE.MeshBasicMaterial({ color: 0xffff00 })
  const geometry = new THREE.CylinderGeometry(1.25, 1.25, 0.1, 32)
  const coin = new THREE.Mesh(geometry, material)
  coin.position.set(block.position.x, block.position.y, block.position.z)
  coin.rotation.x = Math.PI / 2
  scene.add(coin)
}

export const setQuestionBlock = (block: GameBlock, scene: THREE.Scene, world: RAPIER.World) => {
  const loader = new THREE.TextureLoader()
  const question = loader.load(
    new URL('../assets/question_symbol.jpg', import.meta.url) as unknown as string
  )
  const empty = loader.load(
    new URL('../assets/question_empty.jpg', import.meta.url) as unknown as string
  )

  // Load the textures
  const textures = [question, question, empty, empty, question, question]
  const materials = textures.map((texture) => new THREE.MeshBasicMaterial({ map: texture }))
  const geometry = new THREE.BoxGeometry(2.5, 2.5, 2.5)
  const cube = new THREE.Mesh(geometry, materials)
  cube.position.set(block.position.x, block.position.y, block.position.z)
  scene.add(cube)
}
