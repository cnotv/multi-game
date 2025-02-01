import * as THREE from 'three'
import { updateAnimation } from '@/utils/threeJs'

export const moveForward = (
  player: UserModel,
  dynamicBodies: Record<BlockTypes, PhysicObject[]>,
  distance: number,
  backwards: boolean = false
) => {
  const collision = 2.5
  const oldPosition = player.model.position.clone() // Clone the current position

  // Calculate the forward vector
  const forward = new THREE.Vector3()
  player.model.getWorldDirection(forward)
  if (backwards) {
    forward.negate()
  }
  forward.multiplyScalar(distance)

  // Create a new position by adding the forward vector to the old position
  const newPosition = oldPosition.clone().add(forward)

  // Check for collisions with the new position
  const isColliding = dynamicBodies.blocks.some(({ model }) => {
    const difference = model.position.distanceTo(newPosition)
    return difference < collision // Adjust this value based on your collision detection needs
  })

  if (!isColliding) {
    // Update the model's position and the rigid body's translation if no collision is detected
    player.model.position.copy(newPosition)
    player.rigidBody.setTranslation(newPosition, true)
  }
}

/**
 * Move the player and emit new scene information
 */
export const movePlayer = (
  player: UserModel,
  config: any,
  delta: number,
  dynamicBodies: Record<BlockTypes, PhysicObject[]>,
  controls: any,
  updateUserData: (data: any) => void,
  isFocused: boolean
) => {
  const { model, mixer, actions } = player
  if (isFocused) {
    const coefficient = 0.01
    if (controls.up) {
      moveForward(player, dynamicBodies, config.speed.move * coefficient)
    }
    if (controls.down) {
      moveForward(player, dynamicBodies, config.speed.move * coefficient, true)
    }
    if (controls.left) {
      model.rotateY(config.speed.rotate * coefficient)
      player.rigidBody.setRotation(model.quaternion, true)
    }
    if (controls.right) {
      model.rotateY(-config.speed.rotate * coefficient)
      player.rigidBody.setRotation(model.quaternion, true)
    }

    // TODO: Model is updated only on `key press and not on movement, so jump animation is not completed
    if (controls.jump) {
      if (!player.status.jumping) {
        config.velocityY = config.speed.jump * coefficient // Set an upward velocity when the space key is pressed
        player.status.jumping = true
      }
    }

    if (mixer && actions) {
      if (['left', 'right', 'up', 'down', 'jump'].some((action) => controls[action])) {
        updateAnimation(mixer, actions, delta, config.speed.move)

        // For some reason the rotation is reported as Euler type but it's not
        updateUserData({ position: model.position, rotation: model.rotation })
      } else {
        updateAnimation(mixer, actions)
      }
    }
  }

  // // Apply the velocity and gravity
  // config.velocityY -= (config.gravity * 0.001)
  // model.position.y += config.velocityY

  // // Prevent the model from falling below the ground
  // if (model.position.y < 0) {
  //   model.position.y = 0
  //   config.velocityY = 0
  //   player.status.jumping = false
  // }
}
