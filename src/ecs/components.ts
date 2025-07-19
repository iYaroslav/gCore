import { Vector3, EntityComponent } from './units.ts'
import type { Entity } from './Entity.ts'

export class Position extends Vector3 {}

export class Velocity extends Vector3 {}

export class Force extends Vector3 {}

export class AngularVelocity extends Vector3 {}

export class Rotation extends Vector3 {
  get pitch() { return this.x }
  get yaw() { return this.y }
  get roll() { return this.z }

  set pitch(value: number) { this.x = value }
  set yaw(value: number) { this.y = value }
  set roll(value: number) { this.z = value }
}

export class Mass extends EntityComponent {
  kg = 1.0
  volume = 1.0

  get density() {
    return this.kg / this.volume
  }
}

export class Friction extends EntityComponent {
  mu = 0.4 // 0.1 — лёд, 0.8 — резина
}

export class Renderable extends EntityComponent {
  color = 'white'
  size = 20
  shape: 'square' | 'circle' | 'triangle' = 'square'
}

export type EnvironmentType = 'ground' | 'air' | 'water' | 'sand' | 'ice' | 'mud'
export type EnvironmentProperties = {
  friction: number   // трение (касательное сопротивление)
  density: number    // плотность среды (влияет на импульс, массу, сопротивление)
  drag: number       // сопротивление движению (например, как в воде/воздухе)
  bounciness: number // упругость (0 — не отскакивает, 1 — идеально упруго)
}

export class Substrate extends EntityComponent {
  env: 'ground' | 'air' | 'water' | 'sand' | 'ice' | 'mud' = 'ground'
}

export class Player extends EntityComponent {}

export class Collider extends EntityComponent {
  type: 'circle' | 'rect' = 'rect'
}

export class Spring extends EntityComponent {
  target: Position = new Position()
  k: number = 100 // spring stiffness
  restLength: number = 0
}

export class Bounce extends EntityComponent {
  restitution: number = 0.5 // 0 = no bounce, 1 = perfect elastic
}

export class Health extends EntityComponent {
  $hp: number = 1

  set hp(value: number) {
    this.$hp = Math.max(0, value)
  }

  get hp() {
    return this.$hp
  }
}

export class Bullet extends Mass {
  owner?: Entity
  damage: number = 3
  kg = 0.007

  // E = (1/2) * m * v^2,
}
