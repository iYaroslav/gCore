import { Entity } from '../Entity.ts'
import { Force, Position } from '../components.ts'
import { shoot } from './shoot.ts'

export function handleInput(entities: Entity[], player: Entity, mouse: any, keys: Record<string, boolean>, delta: number) {
  if (!player.has(Force)) return;
  const force = player.get(Force);
  const moveForce = 500;

  if (keys['KeyW']) force.y -= moveForce;
  if (keys['KeyS']) force.y += moveForce;
  if (keys['KeyA']) force.x -= moveForce;
  if (keys['KeyD']) force.x += moveForce;

  if (mouse.pressed || mouse.rightPressed) {
    const pos = player.get(Position);
    const dx = mouse.x - pos.x;
    const dy = mouse.y - pos.y;
    const isHeavy = mouse.rightPressed;
    shoot(entities, pos.x, pos.y, dx, dy, isHeavy);
    mouse.pressed = false;
    mouse.rightPressed = false;
  }
}
