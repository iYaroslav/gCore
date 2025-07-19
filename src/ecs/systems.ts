import {
  Position, Velocity, Renderable, Rotation, Bullet, Player, Collider,
} from "./components"
import type { Entity } from "./Entity"

export function MovementSystem(entities: Entity[], delta: number) {
  for (const e of entities) {
    if (e.has(Position) && e.has(Velocity)) {
      const pos = e.get(Position)
      const vel = e.get(Velocity)
      pos.x += vel.x * delta
      pos.y += vel.y * delta
    }
  }
}

export function RenderSystem(entities: Entity[], ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  for (const e of entities) {
    if (e.has(Position) && e.has(Renderable)) {
      const { x, y } = e.get(Position)
      const { color, size, shape } = e.get(Renderable)
      const rotation = e.has(Rotation) ? e.get(Rotation).angle : 0

      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rotation)
      ctx.fillStyle = color

      if (shape === "circle") {
        ctx.beginPath()
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2)
        ctx.fill()
      } else if (shape === "triangle") {
        ctx.beginPath()
        ctx.moveTo(0, -size)
        ctx.lineTo(size / 2, size / 1.5)
        ctx.lineTo(-size / 2, size / 1.5)
        ctx.closePath()
        ctx.fill()
      } else {
        ctx.fillRect(-size / 2, -size / 2, size, size)
      }

      ctx.restore()
    }
  }
}

export function BulletSystem(entities: Entity[], delta: number, bounds: { width: number; height: number }) {
  for (const e of entities) {
    if (e.has(Bullet) && e.has(Position)) {
      const pos = e.get(Position)
      if (pos.x < 0 || pos.y < 0 || pos.x > bounds.width || pos.y > bounds.height) {
        e.dead = true
      }
    }
  }
}

export function CollisionSystem(entities: Entity[]) {
  const bullets = entities.filter(e => e.has(Bullet) && e.has(Position))
  const obstacles = entities.filter(e => e.has(Collider) && e.has(Position))

  for (const bullet of bullets) {
    const bPos = bullet.get(Position)
    const bSize = bullet.get(Renderable)?.size || 8

    for (const block of obstacles) {
      const oPos = block.get(Position)
      const oSize = block.get(Renderable)?.size || 32

      if (Math.abs(bPos.x - oPos.x) < (bSize + oSize) / 2 && Math.abs(bPos.y - oPos.y) < (bSize + oSize) / 2) {
        bullet.dead = true
      }
    }
  }
}
