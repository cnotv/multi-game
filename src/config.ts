export const gameConfig = {
  velocityY: 0,
  gravity: 25,
  worldSize: 500,
  fov: 60,
  aspect: window.innerWidth / window.innerHeight,
  near: 1.0,
  far: 1000.0,
  showHelpers: false,
  showBodyHelpers: true,
  jump: 20,
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
