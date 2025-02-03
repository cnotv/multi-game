interface ThreeRotation {
  _x: number
  _y: number
  _z: number
}

interface ThreePosition {
  x: number
  y: number
  z: number
}
type CoordinateTuple = [number, number, number]

interface BidimensionalCoords {
  x: number
  y: number
}

type Model = THREE.Group<THREE.Object3DEventMap>
type BlockTypes = 'ground' | 'characters' | 'blocks'
type PhysicObject = {
  model: THREE.Object3D
  rigidBody: RAPIER.RigidBody
  helper?: THREE.Object3D
  collider: RAPIER.Collider
}

interface ModelOptions {
  position?: CoordinateTuple
  scale?: CoordinateTuple
  size?: number | CoordinateTuple
  rotation?: CoordinateTuple
  textures?: {
    random: boolean
    list: THREE.Texture[]
  }
}

interface PhysicOptions {
  boundary?: number
  restitution?: number
  friction?: number
  rotation?: Rotation
  weight?: number
  mass?: number
  density?: number
  dominance?: number
  type?: 'fixed' | 'dynamic'
  shape?: 'cuboid' | 'ball'
}
