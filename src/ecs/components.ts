export class Position {
  x = 0
  y = 0
}

export class Velocity {
  x = 0
  y = 0
}

export class Renderable {
  color = "white"
  size = 20
  shape: "square" | "circle" | "triangle" = "square"
}

export class Rotation {
  angle = 0
}

export class Bullet {
  speed = 400
}

export class Player {}

export class Collider {
  solid = true
}
