import { BULLET_FORCE } from '../units.ts'
import { Entity } from '../Entity.ts'
import {
  Position, Velocity, Force, Collider, Renderable, Bounce, Substrate, Health, Bullet,
} from '../components.ts'

export function handleBulletHit(bullet: Entity, target: Entity) {
  if (target.has(Health)) {
    const hp = target.get(Health)
    hp.hp--
    if (hp.hp <= 0) target.dead = true
  }

  if (bullet.has(Health)) {
    const hp = bullet.get(Health)
    hp.hp--
    if (hp.hp <= 0) bullet.dead = true
  } else {
    bullet.dead = true
  }

  const restitution = target.get(Bounce)?.restitution ?? 0.3
  if (restitution < 0.2) bullet.dead = true
}

export default function ShootSystem(entities: Entity[], x: number, y: number, dx: number, dy: number, isHeavy = false, owner?: Entity) {
  const len = Math.hypot(dx, dy)
  const dirX = dx / len
  const dirY = dy / len

  const mass = isHeavy ? 3 : 1
  const size = isHeavy ? 16 : 8
  const speed = BULLET_FORCE // в м/с, по сути

  const bullet = new Entity()
    .add(Position, { x, y })
    .add(Velocity, { x: dirX * speed, y: dirY * speed })
    .add(Force, { x: 0, y: 0 })
    .add(Collider)
    .add(Bounce, { restitution: 0.8 })
    .add(Substrate, { env: 'air' })
    .add(Renderable, {
      color: isHeavy ? "red" : "cyan", size, shape: "circle",
    })
    .add(Health, { hp: isHeavy ? 3 : 1 })
    .add(Bullet, { owner, kg: mass })

  entities.push(bullet)
}
