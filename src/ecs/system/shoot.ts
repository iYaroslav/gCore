import { BULLET_FORCE } from '../units.ts'
import { Entity } from '../Entity.ts'
import { Position, Velocity, Force, Mass, Collider, Renderable, Bounce } from '../components.ts'

export function shoot(entities: Entity[], x: number, y: number, dx: number, dy: number, isHeavy = false) {
  const len = Math.hypot(dx, dy)
  const dirX = dx / len
  const dirY = dy / len

  const mass = isHeavy ? 3 : 1
  const size = isHeavy ? 16 : 8
  const force = BULLET_FORCE * mass

  const bullet = new Entity()
    .add(Position, { x, y })
    .add(Velocity, { x: 0, y: 0 })
    .add(Force, { x: dirX * force, y: dirY * force })
    .add(Mass, { kg: mass })
    .add(Collider)
    .add(Bounce, { restitution: 0.6 })
    .add(Renderable, {
      color: isHeavy ? "red" : "cyan", size, shape: "circle",
    })

  entities.push(bullet)
}
