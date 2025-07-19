import {
  Position,
  Velocity,
  Renderable,
  Collider,
  Friction,
  Mass,
  Force,
  Bounce,
  Spring,
  Substrate,
  Bullet,
  AngularVelocity,
  Rotation,
} from "./components"
import type { Entity } from "./Entity"
import { GROUND_FRICTION, AIR_FRICTION, GROUND_ANGULAR_FRICTION, AIR_ANGULAR_FRICTION } from './units.ts'
import { handleBulletHit } from './system/shoot.ts'

export function PhysicsSystem(entities: Entity[], delta: number) {
  for (const e of entities) {
    if (!e.has(Force) || !e.has(Velocity) || !e.has(Mass)) continue

    const force = e.get(Force)
    const vel = e.get(Velocity)
    const mass = e.get(Mass).kg

    const ax = force.x / mass
    const ay = force.y / mass

    vel.x += ax * delta
    vel.y += ay * delta

    force.x = 0
    force.y = 0
  }
}

export function RotationSystem(entities: Entity[], delta: number) {
  for (const e of entities) {
    if (!e.has(Rotation) || !e.has(AngularVelocity)) continue
    const r = e.get(Rotation)
    const av = e.get(AngularVelocity)
    r.angle += av.speed * delta
  }
}

// export function AngularFrictionSystem(entities: Entity[], delta: number) {
//   for (const e of entities) {
//     if (!e.has(AngularVelocity) || !e.has(Friction) || !e.has(Mass)) continue
//
//     const angVel = e.get(AngularVelocity)
//     const mu = e.get(Friction).mu
//     const mass = e.get(Mass).kg
//
//     const torqueFriction = mu * mass * 2.0 // увеличиваем затухание
//
//     if (angVel.speed > 0) {
//       angVel.speed = Math.max(0, angVel.speed - torqueFriction * delta)
//     } else if (angVel.speed < 0) {
//       angVel.speed = Math.min(0, angVel.speed + torqueFriction * delta)
//     }
//   }
// }
// export function AngularFrictionSystem(entities: Entity[], delta: number) {
//   for (const e of entities) {
//     if (!e.has(AngularVelocity) || !e.has(Friction)) continue;
//     const av = e.get(AngularVelocity);
//     const mu = e.get(Friction).mu;
//     const sign = Math.sign(av.speed);
//     av.speed -= sign * mu * 20 * delta;
//     if (Math.sign(av.speed) !== sign) av.speed = 0;
//   }
// }
export function AngularFrictionSystem(entities: Entity[], delta: number) {
  for (const e of entities) {
    if (!e.has(AngularVelocity) || !e.has(Friction) || !e.has(Mass)) continue

    const angVel = e.get(AngularVelocity)
    const mu = e.get(Friction).mu
    const mass = e.get(Mass).kg
    const grounded = e.get(Substrate)?.env !== 'air'

    const friction = mu * mass * (grounded ? GROUND_ANGULAR_FRICTION : AIR_ANGULAR_FRICTION)

    if (angVel.speed > 0) {
      angVel.speed = Math.max(0, angVel.speed - friction * delta)
    } else if (angVel.speed < 0) {
      angVel.speed = Math.min(0, angVel.speed + friction * delta)
    }
  }
}

export function FrictionSystem(entities: Entity[], delta: number) {
  for (const e of entities) {
    if (!e.has(Velocity) || !e.has(Mass) || !e.has(Force)) continue

    const vel = e.get(Velocity)
    const mass = e.get(Mass).kg
    const force = e.get(Force)

    const grounded = e.get(Substrate)?.env !== 'air'
    const mu = grounded ? GROUND_FRICTION : AIR_FRICTION

    const speed = Math.hypot(vel.x, vel.y)
    if (speed === 0) continue

    const nx = -vel.x / speed
    const ny = -vel.y / speed

    const friction = mu * mass * 60
    force.x += nx * friction
    force.y += ny * friction
  }
}

export function MovementSystem(entities: Entity[], delta: number) {
  for (const e of entities) {
    if (!e.has(Position) || !e.has(Velocity)) continue
    const pos = e.get(Position)
    const vel = e.get(Velocity)

    pos.x += vel.x * delta
    pos.y += vel.y * delta
  }
}

export function CollisionSystem(entities: Entity[]) {
  for (let i = 0; i < entities.length; i++) {
    const a = entities[i]
    if (a.dead) continue
    if (!a.has(Collider) || !a.has(Position) || !a.has(Velocity)) continue

    for (let j = i + 1; j < entities.length; j++) {
      const b = entities[j]
      if (b.dead) continue
      if (!b.has(Collider) || !b.has(Position) || !b.has(Velocity)) continue

      // Игнорировать столкновение пули с владельцем
      if (a.has(Bullet) && a.get(Bullet).owner === b) continue
      if (b.has(Bullet) && b.get(Bullet).owner === a) continue

      const posA = a.get(Position)
      const posB = b.get(Position)
      const shapeA = a.get(Renderable)?.shape ?? "circle"
      const shapeB = b.get(Renderable)?.shape ?? "circle"

      // === CASE 1: Circle vs Circle ===
      if (shapeA === "circle" && shapeB === "circle") {
        const rA = (a.get(Renderable)?.size ?? 16) / 2
        const rB = (b.get(Renderable)?.size ?? 16) / 2
        const dx = posB.x - posA.x
        const dy = posB.y - posA.y
        const dist = Math.hypot(dx, dy)
        const minDist = rA + rB

        if (dist < minDist && dist > 0.001) {
          const nx = dx / dist
          const ny = dy / dist
          const overlap = minDist - dist

          posA.x -= nx * overlap / 2
          posA.y -= ny * overlap / 2
          posB.x += nx * overlap / 2
          posB.y += ny * overlap / 2

          const velA = a.get(Velocity)
          const velB = b.get(Velocity)
          const mA = a.get(Mass)?.kg ?? 1
          const mB = b.get(Mass)?.kg ?? 1

          const relVelX = velB.x - velA.x
          const relVelY = velB.y - velA.y
          const relVelAlongNormal = relVelX * nx + relVelY * ny
          if (relVelAlongNormal > 0) continue

          const restitution = Math.min(a.get(Bounce)?.restitution ?? 0.3, b.get(Bounce)?.restitution ?? 0.3)

          const j = -(1 + restitution) * relVelAlongNormal / (1 / mA + 1 / mB)
          const impulseX = j * nx
          const impulseY = j * ny

          velA.x -= impulseX / mA
          velA.y -= impulseY / mA
          velB.x += impulseX / mB
          velB.y += impulseY / mB

          // Урон / исчезновение пули
          if (a.has(Bullet)) handleBulletHit(a, b)
          if (b.has(Bullet)) handleBulletHit(b, a)
        }
      }

      // === CASE 2: Circle vs Square ===
      else if (shapeA === "circle" && shapeB === "square") {
        resolveCircleVsSquare(a, b)
      }

      // === CASE 3: Square vs Circle — инвертируем
      else if (shapeA === "square" && shapeB === "circle") {
        resolveCircleVsSquare(b, a)
      }

      // === CASE 4: Square vs Square ===
      else if (shapeA === "square" && shapeB === "square") {
        resolveSquareVsSquare(a, b)
      }
      // === CASE 5: Circle vs Triangle ===
      else if (shapeA === "circle" && shapeB === "triangle") {
        resolveCircleVsTriangle(a, b)
      }
      // === CASE 6: Triangle vs Circle ===
      else if (shapeA === "triangle" && shapeB === "circle") {
        resolveCircleVsTriangle(b, a)
      }
      // === CASE 7: Square vs Triangle ===
      else if (shapeA === "square" && shapeB === "triangle") {
        resolveSquareVsTriangle(a, b)
      }
      // === CASE 8: Triangle vs Square ===
      else if (shapeA === "triangle" && shapeB === "square") {
        resolveSquareVsTriangle(b, a)
      }
      // === CASE 9: Triangle vs Triangle ===
      else if (shapeA === "triangle" && shapeB === "triangle") {
        resolveTriangleVsTriangle(a, b)
      }
      // TODO: square vs square
    }
  }
}

function resolveCircleVsSquare(circle: Entity, square: Entity) {
  const posA = circle.get(Position)
  const posB = square.get(Position)
  const renderA = circle.get(Renderable)
  const renderB = square.get(Renderable)

  const radius = renderA.size / 2
  const half = renderB.size / 2

  const closestX = Math.max(posB.x - half, Math.min(posA.x, posB.x + half))
  const closestY = Math.max(posB.y - half, Math.min(posA.y, posB.y + half))

  const dx = posA.x - closestX
  const dy = posA.y - closestY
  const dist = Math.hypot(dx, dy)

  if (dist < radius && dist > 0.001) {
    const nx = dx / dist
    const ny = dy / dist
    const overlap = radius - dist

    const velA = circle.get(Velocity)
    const velB = square.get(Velocity)
    const mA = circle.get(Mass)?.kg ?? 1
    const mB = square.get(Mass)?.kg ?? 1

    // posA.x += nx * overlap;
    // posA.y += ny * overlap;
    const totalMass = mA + mB
    posA.x -= nx * overlap * (mB / totalMass)
    posB.x += nx * overlap * (mA / totalMass)

    const relVelX = velA.x - velB.x
    const relVelY = velA.y - velB.y
    const relVelAlongNormal = relVelX * nx + relVelY * ny

    if (relVelAlongNormal > 0) return

    const restitution = Math.min(circle.get(Bounce)?.restitution ?? 0.3, square.get(Bounce)?.restitution ?? 0.3)

    const j = -(1 + restitution) * relVelAlongNormal / (1 / mA + 1 / mB)
    const impulseX = j * nx
    const impulseY = j * ny

    velA.x -= impulseX / mA
    velA.y -= impulseY / mA
    velB.x += impulseX / mB
    velB.y += impulseY / mB

    const contactX = closestX
    const contactY = closestY
    const rBX = contactX - posB.x
    const rBY = contactY - posB.y

    const torque = rBX * impulseY - rBY * impulseX

    if (!square.has(AngularVelocity)) square.add(AngularVelocity)
    if (!square.has(Rotation)) square.add(Rotation)

    square.get(AngularVelocity).speed += torque / mB

    if (circle.has(Bullet)) handleBulletHit(circle, square)
  }
}

function resolveSquareVsSquare(a: Entity, b: Entity) {
  const posA = a.get(Position)
  const posB = b.get(Position)
  const renderA = a.get(Renderable)
  const renderB = b.get(Renderable)
  const halfA = renderA.size / 2
  const halfB = renderB.size / 2

  // AABB overlap check
  const dx = posB.x - posA.x
  const dy = posB.y - posA.y
  const overlapX = halfA + halfB - Math.abs(dx)
  const overlapY = halfA + halfB - Math.abs(dy)

  if (overlapX > 0 && overlapY > 0) {
    // Разрешаем по минимальной оси
    if (overlapX < overlapY) {
      const nx = Math.sign(dx)
      posA.x -= nx * overlapX / 2
      posB.x += nx * overlapX / 2
    } else {
      const ny = Math.sign(dy)
      posA.y -= ny * overlapY / 2
      posB.y += ny * overlapY / 2
    }
    // Импульс
    const velA = a.get(Velocity)
    const velB = b.get(Velocity)
    const mA = a.get(Mass)?.kg ?? 1
    const mB = b.get(Mass)?.kg ?? 1
    const restitution = Math.min(a.get(Bounce)?.restitution ?? 0.3, b.get(Bounce)?.restitution ?? 0.3)
    // Нормаль столкновения
    let nx = 0, ny = 0
    if (overlapX < overlapY) nx = Math.sign(dx); else ny = Math.sign(dy)
    // Относительная скорость
    const relVelX = velB.x - velA.x
    const relVelY = velB.y - velA.y
    const relVelAlongNormal = relVelX * nx + relVelY * ny
    if (relVelAlongNormal > 0) return
    const j = -(1 + restitution) * relVelAlongNormal / (1 / mA + 1 / mB)
    const impulseX = j * nx
    const impulseY = j * ny
    velA.x -= impulseX / mA
    velA.y -= impulseY / mA
    velB.x += impulseX / mB
    velB.y += impulseY / mB
    // Угловой импульс (реалистично)
    applyTorque(a, impulseX, impulseY, posA, posB, mB)
    applyTorque(b, -impulseX, -impulseY, posB, posA, mA)
    // Пули
    if (a.has(Bullet)) handleBulletHit(a, b)
    if (b.has(Bullet)) handleBulletHit(b, a)
  }
}

function applyTorque(
  entity: Entity,
  impulseX: number,
  impulseY: number,
  center: Position,
  contact: Position,
  mass: number
) {
  if (!entity.has(Collider)) return

  const colliderType = entity.get(Collider).type // 'circle' | 'square'
  if (!entity.has(AngularVelocity)) entity.add(AngularVelocity)
  if (!entity.has(Rotation)) entity.add(Rotation)

  const av = entity.get(AngularVelocity)
  const size = entity.get(Renderable)?.size ?? 16

  let I = 1
  if (colliderType === 'rect') {
    I = (1 / 6) * mass * size * size
  } else if (colliderType === 'circle') {
    I = 0.5 * mass * (size / 2) ** 2
  }

  const rX = contact.x - center.x
  const rY = contact.y - center.y

  let torque = rX * impulseY - rY * impulseX

  if (entity.has(Bullet)) torque *= 0.1

  const MAX_TORQUE = 1500
  torque = Math.max(-MAX_TORQUE, Math.min(MAX_TORQUE, torque))

  av.speed += torque / I

  const MAX_ANGULAR = 10
  av.speed = Math.max(-MAX_ANGULAR, Math.min(MAX_ANGULAR, av.speed))
}


export function BotSystem(botAI: { entity: Entity; angle: number; radius: number }[], delta: number) {
  for (const bot of botAI) {
    if (!bot.entity.has(Force) || !bot.entity.has(Position)) continue
    const force = bot.entity.get(Force)
    // const pos = bot.entity.get(Position);

    bot.angle += 1 * delta

    const dirX = Math.cos(bot.angle)
    const dirY = Math.sin(bot.angle)
    const speed = 400

    force.x += dirX * speed
    force.y += dirY * speed
  }
}

export function SpringSystem(entities: Entity[]) {
  for (const e of entities) {
    if (!e.has(Spring) || !e.has(Position) || !e.has(Force)) continue
    const spring = e.get(Spring)
    const pos = e.get(Position)
    const force = e.get(Force)

    const dx = spring.target.x - pos.x
    const dy = spring.target.y - pos.y
    const dist = Math.hypot(dx, dy)
    const delta = dist - spring.restLength

    const nx = dx / dist
    const ny = dy / dist

    const springForce = spring.k * delta
    force.x += nx * springForce
    force.y += ny * springForce
  }
}

// ====== Треугольники ======
// Вспомогательная функция: получить вершины равностороннего треугольника
function getTriangleVertices(pos: any, size: number, angle: number) {
  const h = size * Math.sqrt(3) / 2
  const a = angle || 0
  // Центр — центр масс, вершины по часовой стрелке
  return [{
    x: pos.x + Math.cos(a) * h * 2 / 3, y: pos.y + Math.sin(a) * h * 2 / 3,
  }, {
    x: pos.x + Math.cos(a + 2 * Math.PI / 3) * h * 2 / 3, y: pos.y + Math.sin(a + 2 * Math.PI / 3) * h * 2 / 3,
  }, {
    x: pos.x + Math.cos(a - 2 * Math.PI / 3) * h * 2 / 3, y: pos.y + Math.sin(a - 2 * Math.PI / 3) * h * 2 / 3,
  }]
}

// Проверка пересечения круга и треугольника (SAT)
function resolveCircleVsTriangle(circle: Entity, triangle: Entity) {
  const posC = circle.get(Position)
  const renderC = circle.get(Renderable)
  const radius = renderC.size / 2
  const posT = triangle.get(Position)
  const renderT = triangle.get(Renderable)
  const angleT = triangle.get(Rotation)?.angle ?? 0
  const verts = getTriangleVertices(posT, renderT.size, angleT)
  // SAT: ищем минимальное проникновение
  let minOverlap = Infinity, minAxis = { x: 0, y: 0 }
  for (let i = 0; i < 3; i++) {
    const v1 = verts[i], v2 = verts[(i + 1) % 3]
    const edge = { x: v2.x - v1.x, y: v2.y - v1.y }
    const axis = { x: -edge.y, y: edge.x }
    const len = Math.hypot(axis.x, axis.y)
    axis.x /= len
    axis.y /= len
    // Проекция треугольника
    let minT = Infinity, maxT = -Infinity
    for (const v of verts) {
      const proj = v.x * axis.x + v.y * axis.y
      minT = Math.min(minT, proj)
      maxT = Math.max(maxT, proj)
    }
    // Проекция круга
    const cProj = posC.x * axis.x + posC.y * axis.y
    const minC = cProj - radius, maxC = cProj + radius
    // Проверка перекрытия
    const overlap = Math.min(maxT, maxC) - Math.max(minT, minC)
    if (overlap < 0) return // нет столкновения
    if (overlap < minOverlap) {
      minOverlap = overlap
      minAxis = { ...axis }
    }
  }
  // Проверка по направлению к центру круга
  for (const v of verts) {
    const axis = { x: posC.x - v.x, y: posC.y - v.y }
    const len = Math.hypot(axis.x, axis.y)
    if (len < 1e-6) continue
    axis.x /= len
    axis.y /= len
    // Проекция треугольника
    let minT = Infinity, maxT = -Infinity
    for (const vv of verts) {
      const proj = vv.x * axis.x + vv.y * axis.y
      minT = Math.min(minT, proj)
      maxT = Math.max(maxT, proj)
    }
    // Проекция круга
    const cProj = posC.x * axis.x + posC.y * axis.y
    const minC = cProj - radius, maxC = cProj + radius
    // Проверка перекрытия
    const overlap = Math.min(maxT, maxC) - Math.max(minT, minC)
    if (overlap < 0) return
    if (overlap < minOverlap) {
      minOverlap = overlap
      minAxis = { ...axis }
    }
  }
  // Раздвигаем объекты
  const mC = circle.get(Mass)?.kg ?? 1
  const mT = triangle.get(Mass)?.kg ?? 1
  const totalMass = mC + mT
  posC.x += minAxis.x * minOverlap * (mT / totalMass)
  posC.y += minAxis.y * minOverlap * (mT / totalMass)
  posT.x -= minAxis.x * minOverlap * (mC / totalMass)
  posT.y -= minAxis.y * minOverlap * (mC / totalMass)
  // Импульс
  const velC = circle.get(Velocity)
  const velT = triangle.get(Velocity)
  const relVelX = velC.x - velT.x
  const relVelY = velC.y - velT.y
  const relVelAlongNormal = relVelX * minAxis.x + relVelY * minAxis.y
  if (relVelAlongNormal > 0) return
  const restitution = Math.min(circle.get(Bounce)?.restitution ?? 0.3, triangle.get(Bounce)?.restitution ?? 0.3)
  const j = -(1 + restitution) * relVelAlongNormal / (1 / mC + 1 / mT)
  const impulseX = j * minAxis.x
  const impulseY = j * minAxis.y
  velC.x -= impulseX / mC
  velC.y -= impulseY / mC
  velT.x += impulseX / mT
  velT.y += impulseY / mT
  // Угловой импульс
  applyTorque(triangle, impulseX, impulseY, posT, posC, mT, 'triangle')
  // Пули
  if (circle.has(Bullet)) handleBulletHit(circle, triangle)
  if (triangle.has(Bullet)) handleBulletHit(triangle, circle)
}

// Проверка пересечения квадрата и треугольника (SAT)
function resolveSquareVsTriangle(square: Entity, triangle: Entity) {
  const posS = square.get(Position)
  const renderS = square.get(Renderable)
  const half = renderS.size / 2
  const posT = triangle.get(Position)
  const renderT = triangle.get(Renderable)
  const angleT = triangle.get(Rotation)?.angle ?? 0
  const vertsT = getTriangleVertices(posT, renderT.size, angleT)
  // Вершины квадрата
  const angleS = square.get(Rotation)?.angle ?? 0
  const vertsS = []
  for (let i = 0; i < 4; i++) {
    const a = angleS + Math.PI / 4 + i * Math.PI / 2
    vertsS.push({
      x: posS.x + Math.cos(a) * half * Math.SQRT2, y: posS.y + Math.sin(a) * half * Math.SQRT2,
    })
  }
  // SAT по всем осям
  const axes = []
  for (let i = 0; i < 4; i++) {
    const v1 = vertsS[i], v2 = vertsS[(i + 1) % 4]
    axes.push({ x: v2.y - v1.y, y: v1.x - v2.x })
  }
  for (let i = 0; i < 3; i++) {
    const v1 = vertsT[i], v2 = vertsT[(i + 1) % 3]
    axes.push({ x: v2.y - v1.y, y: v1.x - v2.x })
  }
  let minOverlap = Infinity, minAxis = { x: 0, y: 0 }
  for (const axis of axes) {
    const len = Math.hypot(axis.x, axis.y)
    const ax = { x: axis.x / len, y: axis.y / len }
    // Проекции
    let minS = Infinity, maxS = -Infinity
    for (const v of vertsS) {
      const proj = v.x * ax.x + v.y * ax.y
      minS = Math.min(minS, proj)
      maxS = Math.max(maxS, proj)
    }
    let minT = Infinity, maxT = -Infinity
    for (const v of vertsT) {
      const proj = v.x * ax.x + v.y * ax.y
      minT = Math.min(minT, proj)
      maxT = Math.max(maxT, proj)
    }
    const overlap = Math.min(maxS, maxT) - Math.max(minS, minT)
    if (overlap < 0) return
    if (overlap < minOverlap) {
      minOverlap = overlap
      minAxis = { ...ax }
    }
  }
  // Раздвигаем
  const mS = square.get(Mass)?.kg ?? 1
  const mT = triangle.get(Mass)?.kg ?? 1
  const totalMass = mS + mT
  posS.x += minAxis.x * minOverlap * (mT / totalMass)
  posS.y += minAxis.y * minOverlap * (mT / totalMass)
  posT.x -= minAxis.x * minOverlap * (mS / totalMass)
  posT.y -= minAxis.y * minOverlap * (mS / totalMass)
  // Импульс
  const velS = square.get(Velocity)
  const velT = triangle.get(Velocity)
  const relVelX = velS.x - velT.x
  const relVelY = velS.y - velT.y
  const relVelAlongNormal = relVelX * minAxis.x + relVelY * minAxis.y
  if (relVelAlongNormal > 0) return
  const restitution = Math.min(square.get(Bounce)?.restitution ?? 0.3, triangle.get(Bounce)?.restitution ?? 0.3)
  const j = -(1 + restitution) * relVelAlongNormal / (1 / mS + 1 / mT)
  const impulseX = j * minAxis.x
  const impulseY = j * minAxis.y
  velS.x -= impulseX / mS
  velS.y -= impulseY / mS
  velT.x += impulseX / mT
  velT.y += impulseY / mT
  // Угловой импульс
  applyTorque(square, impulseX, impulseY, posS, posT, mS, 'square')
  applyTorque(triangle, -impulseX, -impulseY, posT, posS, mT, 'triangle')
  // Пули
  if (square.has(Bullet)) handleBulletHit(square, triangle)
  if (triangle.has(Bullet)) handleBulletHit(triangle, square)
}

// Треугольник vs треугольник (SAT)
function resolveTriangleVsTriangle(a: Entity, b: Entity) {
  const posA = a.get(Position)
  const renderA = a.get(Renderable)
  const angleA = a.get(Rotation)?.angle ?? 0
  const vertsA = getTriangleVertices(posA, renderA.size, angleA)
  const posB = b.get(Position)
  const renderB = b.get(Renderable)
  const angleB = b.get(Rotation)?.angle ?? 0
  const vertsB = getTriangleVertices(posB, renderB.size, angleB)
  // SAT по всем осям
  const axes = []
  for (let i = 0; i < 3; i++) {
    const v1 = vertsA[i], v2 = vertsA[(i + 1) % 3]
    axes.push({ x: v2.y - v1.y, y: v1.x - v2.x })
  }
  for (let i = 0; i < 3; i++) {
    const v1 = vertsB[i], v2 = vertsB[(i + 1) % 3]
    axes.push({ x: v2.y - v1.y, y: v1.x - v2.x })
  }
  let minOverlap = Infinity, minAxis = { x: 0, y: 0 }
  for (const axis of axes) {
    const len = Math.hypot(axis.x, axis.y)
    const ax = { x: axis.x / len, y: axis.y / len }
    // Проекции
    let minA = Infinity, maxA = -Infinity
    for (const v of vertsA) {
      const proj = v.x * ax.x + v.y * ax.y
      minA = Math.min(minA, proj)
      maxA = Math.max(maxA, proj)
    }
    let minB = Infinity, maxB = -Infinity
    for (const v of vertsB) {
      const proj = v.x * ax.x + v.y * ax.y
      minB = Math.min(minB, proj)
      maxB = Math.max(maxB, proj)
    }
    const overlap = Math.min(maxA, maxB) - Math.max(minA, minB)
    if (overlap < 0) return
    if (overlap < minOverlap) {
      minOverlap = overlap
      minAxis = { ...ax }
    }
  }
  // Раздвигаем
  const mA = a.get(Mass)?.kg ?? 1
  const mB = b.get(Mass)?.kg ?? 1
  const totalMass = mA + mB
  posA.x += minAxis.x * minOverlap * (mB / totalMass)
  posA.y += minAxis.y * minOverlap * (mB / totalMass)
  posB.x -= minAxis.x * minOverlap * (mA / totalMass)
  posB.y -= minAxis.y * minOverlap * (mA / totalMass)
  // Импульс
  const velA = a.get(Velocity)
  const velB = b.get(Velocity)
  const relVelX = velA.x - velB.x
  const relVelY = velA.y - velB.y
  const relVelAlongNormal = relVelX * minAxis.x + relVelY * minAxis.y
  if (relVelAlongNormal > 0) return
  const restitution = Math.min(a.get(Bounce)?.restitution ?? 0.3, b.get(Bounce)?.restitution ?? 0.3)
  const j = -(1 + restitution) * relVelAlongNormal / (1 / mA + 1 / mB)
  const impulseX = j * minAxis.x
  const impulseY = j * minAxis.y
  velA.x -= impulseX / mA
  velA.y -= impulseY / mA
  velB.x += impulseX / mB
  velB.y += impulseY / mB
  // Угловой импульс
  applyTorque(a, impulseX, impulseY, posA, posB, mA, 'triangle')
  applyTorque(b, -impulseX, -impulseY, posB, posA, mB, 'triangle')
  // Пули
  if (a.has(Bullet)) handleBulletHit(a, b)
  if (b.has(Bullet)) handleBulletHit(b, a)
}
