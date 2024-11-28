import * as THREE from 'three'
import RAPIER, { RigidBody } from '@dimforge/rapier3d'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'

export const config = {
  velocityY: 0,
  gravity: 25,
  worldSize: 500,
  fov: 60,
  aspect: window.innerWidth / window.innerHeight,
  near: 1.0,
  far: 1000.0,
  showHelpers: false,
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

export const loadGround = (
  scene: THREE.Scene,
  loader: THREE.TextureLoader,
  config: any,
  path: string,
  world: RAPIER.World
): [THREE.Object3D, RAPIER.RigidBody] => {
  const groundGeometry = new THREE.PlaneGeometry(config.worldSize, config.worldSize)
  const groundTexture = loader.load(new URL(path, import.meta.url) as unknown as string)

  // Repeat the texture
  groundTexture.wrapS = THREE.RepeatWrapping
  groundTexture.wrapT = THREE.RepeatWrapping
  groundTexture.repeat.set(10, 10) // Repeat the texture 10 times in both directions

  const groundMaterial = new THREE.MeshBasicMaterial({ map: groundTexture })
  const ground = new THREE.Mesh(groundGeometry, groundMaterial)
  ground.rotation.x = -Math.PI / 2 // Rotate the ground to make it horizontal
  ground.position.y = -0.5
  scene.add(ground)

  // Create a static rigid body for the ground
  const groundBodyDesc = RAPIER.RigidBodyDesc.newStatic()
  const groundBody = world.createRigidBody(groundBodyDesc)
  const groundBodyHandle = world.createRigidBody(groundBodyDesc)

  // Create a collider for the ground
  // const groundColliderDesc = RAPIER.ColliderDesc.cuboid(500, 1, 500)

  // Create a collider for the ground
  const groundColliderDesc = RAPIER.ColliderDesc.cuboid(500, 1, 500)
  const groundColliderHandle = world.createCollider(groundColliderDesc, groundBodyHandle)

  // Create a mesh to visualize the collider
  const groundColliderGeometry = new THREE.BoxGeometry(500, 1, 500)
  const groundColliderMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
  const groundColliderMesh = new THREE.Mesh(groundColliderGeometry, groundColliderMaterial)
  scene.add(groundColliderMesh)
  world.createCollider(groundColliderDesc, groundBodyHandle)

  // Return the ground and its rigid body for later use
  return [ground, groundBody]
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
  let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(...position)
  let rigidBody = world.createRigidBody(rigidBodyDesc)
  rigidBody.setRotation({ w: 1.0, x: 0.5, y: 0.5, z: 0.5 }, true)

  // Create a cuboid collider attached to the dynamic rigidBody.
  let colliderDesc = RAPIER.ColliderDesc.cuboid(...(size.map((x) => x * 0.6) as CoordinateTuple))
  let collider = world.createCollider(colliderDesc, rigidBody)

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
