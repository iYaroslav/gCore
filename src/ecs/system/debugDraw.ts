import { Position, Renderable, Rotation, Velocity, Collider } from '../components.ts'
import type { Entity } from '../Entity.ts'

export default function DebugDrawSystem(ctx: CanvasRenderingContext2D, entities: Entity[]) {
  for (const e of entities) {
    if (!e.has(Renderable) || e.has(Position)) return

    const pos = e.get(Position)
    const vel = e.get(Velocity)
    const shape = e.get(Collider).type ?? "circle"
    const size = e.get(Renderable).size ?? 16
    const rot = e.get(Rotation)?.angle ?? 0

    ctx.save()
    ctx.translate(pos.x, pos.y)
    ctx.rotate(rot)

    ctx.strokeStyle = "#00F"
    ctx.lineWidth = 1

    if (shape === "circle") {
      ctx.beginPath()
      ctx.arc(0, 0, size / 2, 0, Math.PI * 2)
      ctx.stroke()
    } else {
      ctx.beginPath()
      ctx.rect(-size / 2, -size / 2, size, size)
      ctx.stroke()
    }

    // скорость
    if (vel) {
      ctx.strokeStyle = "#0A0"
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(vel.x * 0.2, vel.y * 0.2)
      ctx.stroke()
    }

    // направление
    ctx.strokeStyle = "#F00"
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(size / 2, 0)
    ctx.stroke()

    ctx.restore()
  }
}
