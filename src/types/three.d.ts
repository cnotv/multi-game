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

interface BidimensionalCoords {
  x: number
  y: number
}

type Model = THREE.Group<THREE.Object3DEventMap>
