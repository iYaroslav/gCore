export class Entity {
  static nextId = 0
  id: number
  components = new Map<string, any>()
  dead = false

  constructor() {
    this.id = Entity.nextId++
  }

  add<T>(component: new (...args: any[]) => T, data?: Partial<T>): this {
    this.components.set(component.name, Object.assign(new component(), data))
    return this
  }

  get<T>(component: new (...args: any[]) => T): T {
    return this.components.get(component.name)
  }

  has<T>(component: new (...args: any[]) => T): boolean {
    return this.components.has(component.name)
  }
}
