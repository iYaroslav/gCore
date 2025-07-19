import type { EntityComponent } from './units.ts'
import { Bullet, Mass } from './components.ts'

const conflicts = [
  [Mass, Bullet]
]

export class Entity {
  components = new Map<any, EntityComponent>()
  dead = false

  add<T extends EntityComponent>(Cls: new () => T, data?: Partial<T>): this {
    for (const [a, b] of conflicts) {
      if ((Cls.name === a.name && this.has(b))|| (Cls.name === b.name && this.has(a))) {
        throw new Error(`Don't use "${ a.name }" and "${ b.name }" together in one entity!`)
      }
    }

    this.components.set(Cls, Object.assign(new Cls(), data))
    return this
  }

  get<T extends EntityComponent>(cls: new () => T): T {
    return this.components.get(cls) as T
  }

  has<T extends EntityComponent>(cls: new () => T): boolean {
    return this.components.has(cls)
  }
}
