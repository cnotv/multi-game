import * as THREE from 'three'
import { updateAnimation } from '@/utils/threeJs'

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
    const isColliding = dynamicBodies.blocks.some(({ model }) => {
      const distance = model.position.distanceTo(player.model.position)
      return distance < 2.5
    })
    if (controls.up) {
      if (!isColliding) {
        // Calculate the forward vector
        const forward = new THREE.Vector3()
        model.getWorldDirection(forward)
        forward.multiplyScalar(config.speed.move * coefficient)

        // Add the forward vector to the model's position
        model.position.add(forward)
      }
    }
    if (controls.down) {
      if (!isColliding) {
        // Calculate the forward vector
        const forward = new THREE.Vector3()
        model.getWorldDirection(forward)
        forward.negate()
        forward.multiplyScalar(config.speed.move * coefficient)

        // Add the forward vector to the model's position
        model.position.add(forward)
      }
    }
    if (controls.left) {
      model.rotateY(config.speed.rotate * coefficient)
    }
    if (controls.right) {
      model.rotateY(-config.speed.rotate * coefficient)
    }

    // TODO: Model is updated only on key press and not on movement, so jump animation is not completed
    if (controls.jump) {
      if (!player.status.jumping) {
        config.velocityY = config.speed.jump * coefficient // Set an upward velocity when the space key is pressed
        player.status.jumping = true
      }
    }

    if (mixer && actions) {
      if (['left', 'right', 'up', 'down', 'jump'].some((action) => controls[action])) {
        updateAnimation(mixer, actions, delta, config.speed.move)

        // Update the rigid body position and rotation
        player.rigidBody.setTranslation(model.position, true)
        player.rigidBody.setRotation(model.quaternion, true)

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
