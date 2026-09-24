import type { OrderedCorners, Point2D } from '../types/ARTypes'

function smoothPoint(previous: Point2D, next: Point2D, alpha: number): Point2D {
  return {
    x: previous.x + (next.x - previous.x) * alpha,
    y: previous.y + (next.y - previous.y) * alpha,
  }
}

export class PoseSmoother {
  private current: OrderedCorners | null = null
  constructor(private readonly alpha = 0.34) {}

  reset() {
    this.current = null
  }

  update(next: OrderedCorners): OrderedCorners {
    if (!this.current) {
      this.current = next
      return next
    }

    this.current = {
      topLeft: smoothPoint(this.current.topLeft, next.topLeft, this.alpha),
      topRight: smoothPoint(this.current.topRight, next.topRight, this.alpha),
      bottomRight: smoothPoint(this.current.bottomRight, next.bottomRight, this.alpha),
      bottomLeft: smoothPoint(this.current.bottomLeft, next.bottomLeft, this.alpha),
    }
    return this.current
  }
}
