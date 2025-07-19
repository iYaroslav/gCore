import { Entity } from './ecs/Entity'
import {
  Position,
  Velocity,
  Renderable,
  Player,
  Collider,
  Friction,
  Mass,
  Force,
  Bounce,
  Substrate,
  Health,
  Bullet,
  Rotation,
  AngularVelocity,
} from './ecs/components'
import {
  MovementSystem, CollisionSystem, PhysicsSystem, FrictionSystem, SpringSystem, BotSystem, RotationSystem,
  AngularFrictionSystem,
} from './ecs/systems'
import InputSystem, { handleIO, IO } from './ecs/system/input.ts'
import DebugDrawSystem from './ecs/system/debugDraw.ts'
import './style.css'
import EnvironmentSystem from './ecs/system/environment.ts'

const canvas = document.getElementById("game") as HTMLCanvasElement
const ctx = canvas.getContext("2d")!
canvas.width = innerWidth
canvas.height = innerHeight

function resizeCanvas() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}
window.addEventListener("resize", resizeCanvas)
resizeCanvas()

let lastTime = performance.now()
const entities: Entity[] = []

handleIO()

// == Setup ==
const player = new Entity()
  .add(Position, { x: canvas.width / 2, y: canvas.height / 2 })
  .add(Velocity)
  .add(Force)
  .add(Substrate)
  .add(Mass, { kg: 80 })
  .add(Friction, { mu: 0.2 })
  .add(Collider, { type: 'circle' })
  .add(Bounce, { restitution: 0.3 })
  .add(Renderable, { color: 'yellow', size: 24, shape: 'triangle' })
  .add(Player)
  .add(Health, { hp: 5 })

entities.push(player)

const botAI: { entity: Entity; angle: number; radius: number }[] = []

function spawnBot(x: number, y: number) {
  const bot = new Entity()
    .add(Position, { x, y })
    .add(Velocity)
    .add(Force)
    .add(Mass, { kg: 80 })
    .add(Collider, { type: 'circle' })
    .add(Rotation)
    .add(AngularVelocity)
    .add(Bounce, { restitution: 0.2 })
    .add(Substrate)
    .add(Renderable, {
      shape: "triangle", size: 24, color: "orange",
    })
    .add(Health, { hp: 5 })

  botAI.push({ entity: bot, angle: Math.random() * Math.PI * 2, radius: 40 })
  entities.push(bot)
}

spawnBot(300, 200)
spawnBot(400, 300)

for (let i = 0; i < 6; i++) {
  const mass = 100 + Math.random() * 100
  // const mass = 1 + Math.random() * 5
  const color = `hsl(${ Math.round(mass / 2) }, 80%, 60%)`
  const box = new Entity()
    .add(Position, {
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
    })
    .add(Velocity)
    .add(Force)
    .add(Substrate)
    .add(Mass, { kg: mass })
    .add(Friction, { mu: 0.6 })
    .add(Collider, { type: 'rect' })
    .add(Rotation)
    .add(AngularVelocity)
    .add(Bounce, { restitution: 0.9 })
    .add(Renderable, {
      size: 32, shape: 'square', color,
    })

  entities.push(box)
}

function drawCrosshair(ctx: CanvasRenderingContext2D) {
  const { x, y } = IO.mouse

  ctx.save()
  ctx.strokeStyle = "white"
  ctx.lineWidth = 2

  const size = 10

  ctx.beginPath()
  ctx.moveTo(x - size, y)
  ctx.lineTo(x + size, y)
  ctx.moveTo(x, y - size)
  ctx.lineTo(x, y + size)
  ctx.stroke()

  ctx.restore()
}

function drawHealthBar(ctx: CanvasRenderingContext2D, e: Entity) {
  if (e.has(Bullet) || !e.has(Health) || !e.has(Position) || !e.has(Renderable)) return

  const hp = Math.max(0, e.get(Health).hp)
  const maxHp = 5
  const { x, y } = e.get(Position)
  const size = e.get(Renderable).size

  const barWidth = size
  const barHeight = 4
  const offsetY = size / 2 + 6

  ctx.fillStyle = "#444"
  ctx.fillRect(x - barWidth / 2, y - offsetY, barWidth, barHeight)

  ctx.fillStyle = "lime"
  ctx.fillRect(x - barWidth / 2, y - offsetY, (hp / maxHp) * barWidth, barHeight)
}

function updateSystems(entities: Entity[], delta: number) {
  InputSystem(entities, player, delta)
  BotSystem(botAI, delta)
  EnvironmentSystem(entities, delta)
  PhysicsSystem(entities, delta)
  FrictionSystem(entities, delta)
  AngularFrictionSystem(entities, delta)
  RotationSystem(entities, delta)
  MovementSystem(entities, delta)
  CollisionSystem(entities)
  SpringSystem(entities)
}

// == Main Loop ==
function loop(time: number) {
  const delta = (time - lastTime) / 1000
  lastTime = time

  updateSystems(entities, delta)

  // Render
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  for (const e of entities) {
    if (!e.has(Position) || !e.has(Renderable)) continue
    const pos = e.get(Position)
    const rend = e.get(Renderable)

    ctx.save()
    ctx.translate(pos.x, pos.y)

    if (e.has(Rotation)) {
      const rot = e.get(Rotation)
      ctx.rotate(rot.angle)
    }

    // Rotate to face mouse if player
    if (e.has(Player)) {
      const dx = IO.mouse.x - pos.x
      const dy = IO.mouse.y - pos.y
      ctx.rotate(Math.atan2(dy, dx))
    }

    ctx.fillStyle = rend.color
    const size = rend.size
    switch (rend.shape) {
      case 'circle':
        ctx.beginPath()
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2)
        ctx.fill()
        break
      case 'square':
        ctx.fillRect(-size / 2, -size / 2, size, size)
        break
      case 'triangle':
        ctx.beginPath()
        ctx.moveTo(size / 2, 0)
        ctx.lineTo(-size / 2, size / 2)
        ctx.lineTo(-size / 2, -size / 2)
        ctx.closePath()
        ctx.fill()
        break
    }

    ctx.restore()

    drawHealthBar(ctx, e)
    drawCrosshair(ctx)
  }

  DebugDrawSystem(ctx, entities)
  requestAnimationFrame(loop)
}

requestAnimationFrame(loop)
