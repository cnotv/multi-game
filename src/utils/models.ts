import * as THREE from 'three'
import RAPIER from '@dimforge/rapier3d'
import { loadModel, getAnimationsModel, getModelSize, getPhysic } from './threeJs'

export const getSky = (
  scene: THREE.Scene,
  loader: THREE.TextureLoader,
  config: any,
  path: string,
) => {
  const skyGeometry = new THREE.SphereGeometry(config.worldSize, 32, 32)
  const skyTexture = loader.load(new URL(path, import.meta.url) as unknown as string)
  const skyMaterial = new THREE.MeshBasicMaterial({ map: skyTexture, side: THREE.BackSide })
  const model = new THREE.Mesh(skyGeometry, skyMaterial)
  scene.add(model)

  return { model }
}

export const getGround = (
  scene: THREE.Scene,
  loader: THREE.TextureLoader,
  config: any,
  path: string,
  world: RAPIER.World,
  dynamicBodies: Record<BlockTypes, PhysicObject[]>,
) => {
  const geometry = new THREE.PlaneGeometry(config.worldSize, config.worldSize)
  const groundTexture = loader.load(new URL(path, import.meta.url) as unknown as string)

  // Repeat the texture
  groundTexture.wrapS = THREE.RepeatWrapping
  groundTexture.wrapT = THREE.RepeatWrapping
  groundTexture.repeat.set(10, 10) // Repeat the texture 10 times in both directions

  const material = new THREE.MeshBasicMaterial({ map: groundTexture })
  const model = new THREE.Mesh(geometry, material)
  model.rotation.x = -Math.PI / 2 // Rotate the ground to make it horizontal
  model.position.set(1, -1, 1)
  scene.add(model)

  const size: CoordinateTuple = [500, 0, 500]
  const { rigidBody, collider } = getPhysic(world, model.position.toArray(), size, {
    boundary: 0.8,
  })

  // HELPER: Create a mesh to visualize the collider
  const helper = new THREE.BoxHelper(model, 0x000000)
  if (config.showBodyHelpers) {
    scene.add(helper)
  }

  dynamicBodies.ground.push({ model: model, rigidBody, helper, collider })

  return { model, rigidBody, helper, collider }
}

/**
 * Create a ball with physics, texture, and shadow
 * Friction and bounciness is size based
 * @param size
 * @param position
 * @param scene
 * @param orbit
 * @param world
 */
export const getBall = (
  size: number,
  position: CoordinateTuple,
  scene: THREE.Scene,
  world: RAPIER.World,
) => {
  // Create and add model
  const geometry = new THREE.SphereGeometry(size)
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x222222,
    // envMap: reflection,
    reflectivity: 0.2,
    roughness: 0.3,
    metalness: 0.5,
    transmission: 1,
  })
  const model = new THREE.Mesh(geometry, material)
  model.position.set(...position)
  model.rotation.set(0.5, 0.5, 0.5)
  model.castShadow = true
  model.receiveShadow = false //default
  scene.add(model)

  const { rigidBody, collider } = getPhysic(world, position, size, {
    boundary: 0.8,
    rotation: { w: 1.0, x: 0.5, y: 0.5, z: 0.5 },
    restitution: 1 / size / 3,
    friction: 5 * size,
    weight: 5,
    mass: 100,
    shape: 'ball',
    type: 'dynamic',
  })

  return { model, rigidBody, collider }
}

/**
 * Generate model with predefined information (e.g. position) and add it to the scene
 */
export const getPlayer = async (
  scene: THREE.Scene,
  world: RAPIER.World,
  dynamicBodies: Record<BlockTypes, PhysicObject[]>,
  config: any,
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
  const size = getModelSize(model).toArray()
  const { rigidBody, collider } = getPhysic(world, model.position, size, {
    boundary: 0.8,
    friction: 0.5,
    weight: 10,
    dominance: 10,
    restitution: 0,
    type: 'dynamic',
  })

  const helper = new THREE.BoxHelper(model, 0x000000)
  if (config.showBodyHelpers) {
    scene.add(helper)
  }

  // PHYSIC: Store the model and its rigid body for later use
  dynamicBodies.characters.push({ model, rigidBody, collider, helper })

  return { model, mixer, status: {}, actions, rigidBody, collider, helper }
}

export const getBrickBlock = (block: GameBlock, scene: THREE.Scene, world: RAPIER.World) => {
  const position: CoordinateTuple = [block.position.x, block.position.y, block.position.z]
  const size: CoordinateTuple = [2.5, 2.5, 2.5]
  const loader = new THREE.TextureLoader()
  const texture = loader.load(new URL('../assets/brick.jpg', import.meta.url) as unknown as string)
  const material = new THREE.MeshBasicMaterial({ map: texture })
  const geometry = new THREE.BoxGeometry(...size)
  const model = new THREE.Mesh(geometry, material)
  model.position.set(...position)
  scene.add(model)

  const { rigidBody, collider } = getPhysic(world, position, size, { boundary: 0.8 })

  return { model, rigidBody, collider }
}

export const getCoinBlock = (block: GameBlock, scene: THREE.Scene, world: RAPIER.World) => {
  const position: CoordinateTuple = [block.position.x, block.position.y, block.position.z]
  const size: CoordinateTuple = [1.25, 1.25, 1.25]
  const material = new THREE.MeshBasicMaterial({ color: 0xffff00 })
  const geometry = new THREE.CylinderGeometry(1.25, 1.25, 0.1, 32)
  const model = new THREE.Mesh(geometry, material)
  model.position.set(...position)
  model.rotation.x = Math.PI / 2
  scene.add(model)

  const { rigidBody, collider } = getPhysic(world, position, size, { boundary: 0.8 })

  return { model, rigidBody, collider }
}

export const getQuestionBlock = (block: GameBlock, scene: THREE.Scene, world: RAPIER.World) => {
  const position: CoordinateTuple = [block.position.x, block.position.y, block.position.z]
  const size: CoordinateTuple = [2.5, 2.5, 2.5]
  const loader = new THREE.TextureLoader()
  const question = loader.load(
    new URL('../assets/question_symbol.jpg', import.meta.url) as unknown as string,
  )
  const empty = loader.load(
    new URL('../assets/question_empty.jpg', import.meta.url) as unknown as string,
  )

  // Load the textures
  const textures = [question, question, empty, empty, question, question]
  const materials = textures.map((texture) => new THREE.MeshBasicMaterial({ map: texture }))
  const geometry = new THREE.BoxGeometry(...size)
  const model = new THREE.Mesh(geometry, materials)
  model.position.set(...position)
  scene.add(model)

  const { rigidBody, collider } = getPhysic(world, position, size, { boundary: 0.8 })

  return { model, rigidBody, collider }
}
