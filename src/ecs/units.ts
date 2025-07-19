export const GRAVITY = 9.8
export const BULLET_FORCE = 360 // Ньютонов (кратковременный импульс)
export const AIR_FRICTION = 0.2 // Ньютонов (кратковременный импульс)
export const GROUND_FRICTION = 5.0 // Ньютонов (кратковременный импульс)
export const GROUND_ANGULAR_FRICTION = 10
export const AIR_ANGULAR_FRICTION = 2

export class EntityComponent {}

export class Vector3 extends EntityComponent {
  x: number = 0
  y: number = 0
  z: number = 0
}
