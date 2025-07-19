import { Entity } from '../Entity.js'
import { type EnvironmentType, Substrate, Velocity } from '../components.js'
import type { EnvironmentProperties } from '../components.js'

// TODO добавить поддержку "перехода" между envs, например с песка в воду

export const environments: Record<EnvironmentType, EnvironmentProperties> = {
  air: {
    friction: 0.01,
    density: 0.0012,
    drag: 0.2,
    bounciness: 0.0,
  },
  ice: {
    friction: 0.05,
    density: 0.92,
    drag: 0.01,
    bounciness: 0.15,
  },
  mud: {
    friction: 0.75,
    density: 1.3,
    drag: 0.4,
    bounciness: 0.02,
  },
  sand: {
    friction: 0.6,
    density: 1.6,
    drag: 0.1,
    bounciness: 0.05,
  },
  water: {
    friction: 0.3,
    density: 1.0,
    drag: 0.8,
    bounciness: 0.0,
  },
  ground: {
    friction: 0.9,
    density: 1.0,
    drag: 0.05,
    bounciness: 0.1,
  },
}

export default function EnvironmentSystem(entities: Entity[], delta: number) {
  for (const e of entities) {
    if (!e.has(Substrate)) continue

    const substrate = e.get(Substrate)
    const env = environments[substrate.env]

    // ctx.friction = env.friction
    // ctx.density = env.density
    // ctx.drag = env.drag
    // ctx.bounciness = env.bounciness
    applyFriction(e, substrate.env)
  }
}

function applyFriction(entity: Entity, environment: EnvironmentType) {
  if (!entity.has(Velocity)) return
  const velocity = entity.get(Velocity)
  const env = environments[environment]

  velocity.x *= 1 - env.friction
  velocity.y *= 1 - env.friction

  velocity.x *= 1 - env.drag
  velocity.y *= 1 - env.drag
}

function applyDencsity() {

}

function applyDrag(entity: Entity, environment: EnvironmentType) {
  const env = ENVIRONMENT_DATA[environment]



}

function applyBounciness() {

}
