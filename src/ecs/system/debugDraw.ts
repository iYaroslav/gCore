import { Position, Renderable, Rotation, Velocity, AngularVelocity } from '../ecs/components.ts'
import type { Entity } from '../ecs/Entity.ts'

export function debugDraw(ctx: CanvasRenderingContext2D, entities: Entity[]) {
  for (const e of entities) {
    if (!e.has(Position) || !e.has(Renderable)) continue;

    const pos = e.get(Position);
    const render = e.get(Renderable);
    const angle = e.get(Rotation)?.angle ?? 0;
    const size = render.size;

    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(angle);

    // Отладочная рамка
    ctx.strokeStyle = 'lime';
    ctx.lineWidth = 1;

    if (render.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
      ctx.stroke();
    } else if (render.shape === 'square') {
      ctx.strokeRect(-size / 2, -size / 2, size, size);
    } else if (render.shape === 'triangle') {
      const h = size * Math.sqrt(3) / 2;
      ctx.beginPath();
      ctx.moveTo(0, -h / 1.5);
      ctx.lineTo(size / 2, h / 3);
      ctx.lineTo(-size / 2, h / 3);
      ctx.closePath();
      ctx.stroke();
    }

    // Визуализация вектора скорости
    if (e.has(Velocity)) {
      const vel = e.get(Velocity);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.strokeStyle = 'cyan';
      ctx.lineTo(vel.x * 0.1, vel.y * 0.1);
      ctx.stroke();
    }

    // Визуализация вращения
    if (e.has(AngularVelocity)) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -10);
      ctx.strokeStyle = 'orange';
      ctx.stroke();
    }

    ctx.restore();
  }
}
