interface GameBlock {
  position: ThreePosition
  type: 'brick' | 'coin' | 'question'
}

type UserModel = {
  model: Model
  mixer: THREE.AnimationMixer
  status: {
    jumping?: boolean
  }
}
