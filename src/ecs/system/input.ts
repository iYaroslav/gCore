import { Entity } from '../Entity.ts'
import { Force, Position } from '../components.ts'
import ShootSystem from './shoot.ts'

export class IOState {
  changedAt: number = 0
  lastValue: number = 0 // -1..1
  key?: string

  get pressed() {
    if (this.lastValue < 0) {
      return this.lastValue < -0.5
    }

    return this.lastValue > 0.5
  }

  set pressed(value: boolean) {
    this.lastValue = value ? 1 : 0
    this.changedAt = performance.now()
  }

  set deflect(value: number) { // -1..1
    this.lastValue = value
    this.changedAt = performance.now()
  }
}

export class IO {
  static keys: Record<string, IOState> = {}
  static joystick: Record<string, IOState> = {}

  static mouse = {
    x: 0,
    y: 0,
    left: new IOState(),
    right: new IOState(),
    middle: new IOState(),
  }

  static pressed(key: string) {
    return IO.keys[key]?.pressed || false
  }
}

export function handleIO() {
  function toggleKey(current: IOState | undefined, pressed: boolean, key?: string): IOState {
    if (!current) current = new IOState()
    current.pressed = pressed
    current.key = key

    // setTimeout(console.log, 5, 'IO', JSON.stringify(IO.keys), JSON.stringify(IO.mouse))
    // console.log('IO', current, current.pressed)
    return current
  }

  window.addEventListener('keyup', (e) => IO.keys[e.code] = toggleKey(IO.keys[e.code], false, e.key), true)
  window.addEventListener('keydown', (e) => IO.keys[e.code] = toggleKey(IO.keys[e.code], true, e.key), true)

  window.addEventListener('mousemove', (e) => {
    IO.mouse.x = e.clientX
    IO.mouse.y = e.clientY
  }, true)

  window.addEventListener('mousedown', (e) => {
    e.stopPropagation()
    if (e.button === 0) IO.mouse.left = toggleKey(IO.mouse.left, true)
    if (e.button === 1) IO.mouse.middle = toggleKey(IO.mouse.middle, true)
    if (e.button === 2) IO.mouse.right = toggleKey(IO.mouse.right, true)
  }, true)

  window.addEventListener('mouseup', (e) => {
    e.stopPropagation()
    if (e.button === 0) IO.mouse.left = toggleKey(IO.mouse.left, false)
    if (e.button === 1) IO.mouse.middle = toggleKey(IO.mouse.middle, false)
    if (e.button === 2) IO.mouse.right = toggleKey(IO.mouse.right, false)
  }, true)

  window.addEventListener('contextmenu', e => e.preventDefault(), true)
}

let lastFireAt = 0
function handleFire(key: IOState | undefined, entities: Entity[], player: Entity, isHeavy: boolean) {
  if (!key?.pressed) return
  if (lastFireAt + (60 * 1000 / 1200) > performance.now()) return // УЗИ
  // if (lastFireAt + (60 * 1000 / 600) > performance.now()) return // Калаш
  // if (lastFireAt + (60 * 1000 / 300) > performance.now()) return // Автоматический пистолет
  lastFireAt = performance.now() // Shoot once in 150ms

  const pos = player.get(Position)
  const dx = IO.mouse.x - pos.x
  const dy = IO.mouse.y - pos.y

  ShootSystem(entities, pos.x, pos.y, dx, dy, isHeavy, player)
}

export default function InputSystem(entities: Entity[], player: Entity, delta: number) {
  if (!player.has(Force)) return
  const force = player.get(Force)
  const moveForce = 500 * 80

  // if (IO.pressed('KeyW')) force.y -= moveForce
  // if (IO.pressed('KeyS')) force.y += moveForce
  // if (IO.pressed('KeyA')) force.x -= moveForce
  // if (IO.pressed('KeyD')) force.x += moveForce
  if (IO.pressed('KeyW')) force.y = -moveForce
  if (IO.pressed('KeyS')) force.y = +moveForce
  if (IO.pressed('KeyA')) force.x = -moveForce
  if (IO.pressed('KeyD')) force.x = +moveForce

  handleFire(IO.mouse.left, entities, player, false)
  handleFire(IO.mouse.right, entities, player, false)
  handleFire(IO.joystick['RT'], entities, player, false)
}
