import * as THREE from 'three'

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
  path: string
) => {
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
