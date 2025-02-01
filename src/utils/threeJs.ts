import * as THREE from 'three'
import RAPIER from '@dimforge/rapier3d'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

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

/**
 * Add physic to the model for a given world
 * @param world
 * @param position
 * @param size
 * @param boundary
 * @returns
 */
export const getPhysic = (
  world: RAPIER.World,
  position: CoordinateTuple,
  size: number | CoordinateTuple,
  {
    rotation,
    boundary = 0,
    restitution = 0,
    friction = 0,
    shape = 'cuboid',
    type = 'fixed'
  }: PhysicOptions
) => {
  // Create a fixed rigid body for the brick block
  const rigidBodyDesc = RAPIER.RigidBodyDesc[type]().setTranslation(...position)
  const rigidBody = world.createRigidBody(rigidBodyDesc)
  if (rotation) {
    rigidBody.setRotation(rotation, true)
  }
  const coliderShape =
    shape === 'cuboid'
      ? RAPIER.ColliderDesc.cuboid(
          ...((size as CoordinateTuple).map((x) => x * boundary) as CoordinateTuple)
        )
      : RAPIER.ColliderDesc.ball(size as number)
  // Create a cuboid collider attached to the fixed rigid body
  const colliderDesc = coliderShape.setRestitution(restitution).setFriction(friction)
  const collider = world.createCollider(colliderDesc, rigidBody)

  return { rigidBody, collider }
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
export const loadModel = (): Promise<{ model: Model; gltf: any }> => {
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

/**
 * Return threeJS valid 3D model
 */
export const loadGLTF = (
  fileName: string,
  { position, scale }: ModelOptions = {}
): Promise<{ model: Model; gltf: any }> => {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader()
    loader.load(
      `/${fileName}`,
      (gltf) => {
        const model = gltf.scene
        model.castShadow = true
        model.receiveShadow = false //default
        if (position) model.position.set(...position)
        if (scale) model.scale.set(...scale)
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true
            child.receiveShadow = true
          }
        })
        resolve({ model, gltf })
      },
      undefined,
      reject
    )
  })
}

export const getAnimationsModel = (mixer: THREE.AnimationMixer, model: Model, gltf: any) => {
  // Flip the model
  model.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI)
  // action.play()
  return {
    run: mixer.clipAction(gltf.animations[0])
  }
}

/**
 * Update the animation of the model based on given time
 */
export const updateAnimation = (
  mixer: THREE.AnimationMixer,
  actions: Record<string, THREE.AnimationAction>,
  delta: number = 0,
  speed: number = 0
) => {
  const coefficient = 0.1
  if (delta) {
    mixer.update(delta * speed * coefficient)
    actions.run.play()
  } else {
    actions.run.stop()
  }
}

/**
 * Get the size of a model
 */
export const getModelSize = (model: THREE.Object3D): THREE.Vector3 => {
  const box = new THREE.Box3().setFromObject(model)
  const size = new THREE.Vector3()
  box.getSize(size)
  return size
}

// https://threejs.org/docs/#api/en/objects/InstancedMesh
export const instanceMatrixMesh = (
  mesh: Model,
  scene: THREE.Scene,
  options: ModelOptions[]
): THREE.InstancedMesh<any, any, THREE.InstancedMeshEventMap>[] => {
  const count = options.length
  const geometry = mesh.geometry
  const material = mesh.material
  const instancedMesh = new THREE.InstancedMesh(geometry, material, count)
  instancedMesh.receiveShadow = true // Enable receiving shadows

  return options.map(({ position, rotation, scale }, index) => {
    const matrix = new THREE.Matrix4()
    const positionVector = new THREE.Vector3(...(position ?? [0, 0, 0]))
    const rotationEuler = new THREE.Euler(...(rotation ?? [0, 0, 0]))
    const scaleVector = new THREE.Vector3(...(scale ?? [1, 1, 1]))

    matrix.compose(positionVector, new THREE.Quaternion().setFromEuler(rotationEuler), scaleVector)
    instancedMesh.setMatrixAt(index, matrix)

    scene.add(instancedMesh)

    return instancedMesh
  })
}

export const instanceMatrixModel = (
  model: THREE.Group<THREE.Object3DEventMap>,
  scene: THREE.Scene,
  options: ModelOptions[]
): Model => {
  model.traverse((child) => {
    if (child.isMesh) {
      instanceMatrixMesh(child, scene, options)
    }
  })
}

export const cloneModel = (model: Model, scene: THREE.Scene, options: ModelOptions[]) => {
  return options.map(({ position, rotation = [0, 0, 0], scale = [1, 1, 1] }) => {
    const clone = model.clone()
    clone.position.set(...position!)
    clone.rotation.set(...rotation!)
    clone.scale.set(...scale!)
    scene.add(clone)

    return model
  })
}
