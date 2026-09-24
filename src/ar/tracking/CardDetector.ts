import type { CardDetection, OrderedCorners, Point2D } from '../types/ARTypes'

const TARGET_RATIO = 8 / 5

function distance(a: Point2D, b: Point2D) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function orderCorners(points: Point2D[]): OrderedCorners {
  const sums = points.map((p) => p.x + p.y)
  const diffs = points.map((p) => p.x - p.y)

  const topLeft = points[sums.indexOf(Math.min(...sums))]
  const bottomRight = points[sums.indexOf(Math.max(...sums))]
  const topRight = points[diffs.indexOf(Math.max(...diffs))]
  const bottomLeft = points[diffs.indexOf(Math.min(...diffs))]

  return { topLeft, topRight, bottomRight, bottomLeft }
}

function ratioFromCorners(c: OrderedCorners) {
  const width = (distance(c.topLeft, c.topRight) + distance(c.bottomLeft, c.bottomRight)) / 2
  const height = (distance(c.topLeft, c.bottomLeft) + distance(c.topRight, c.bottomRight)) / 2
  const longSide = Math.max(width, height)
  const shortSide = Math.max(1, Math.min(width, height))
  return longSide / shortSide
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value))
}

export class CardDetector {
  private readonly width: number
  private readonly height: number
  private src: any
  private gray: any
  private blur: any
  private edges: any
  private hierarchy: any
  private contours: any
  private kernel: any

  constructor(private readonly cv: any, width = 360, height = 270) {
    this.width = width
    this.height = height
    this.src = new cv.Mat(height, width, cv.CV_8UC4)
    this.gray = new cv.Mat(height, width, cv.CV_8UC1)
    this.blur = new cv.Mat(height, width, cv.CV_8UC1)
    this.edges = new cv.Mat(height, width, cv.CV_8UC1)
    this.hierarchy = new cv.Mat()
    this.contours = new cv.MatVector()
    this.kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3))
  }

  detect(canvas: HTMLCanvasElement): CardDetection {
    const started = performance.now()
    const cv = this.cv
    const fresh = cv.imread(canvas)
    fresh.copyTo(this.src)
    fresh.delete()

    cv.cvtColor(this.src, this.gray, cv.COLOR_RGBA2GRAY)
    cv.GaussianBlur(this.gray, this.blur, new cv.Size(5, 5), 0)
    cv.Canny(this.blur, this.edges, 45, 135)
    cv.morphologyEx(this.edges, this.edges, cv.MORPH_CLOSE, this.kernel)

    this.contours.delete()
    this.hierarchy.delete()
    this.contours = new cv.MatVector()
    this.hierarchy = new cv.Mat()
    cv.findContours(this.edges, this.contours, this.hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE)

    const frameArea = this.width * this.height
    let best: CardDetection = {
      found: false,
      confidence: 0,
      areaRatio: 0,
      aspectRatio: 0,
      processingMs: 0,
    }

    for (let i = 0; i < this.contours.size(); i += 1) {
      const contour = this.contours.get(i)
      const area = Math.abs(cv.contourArea(contour))
      const areaRatio = area / frameArea

      if (areaRatio < 0.015 || areaRatio > 0.72) {
        contour.delete()
        continue
      }

      const perimeter = cv.arcLength(contour, true)
      const approx = new cv.Mat()
      cv.approxPolyDP(contour, approx, 0.025 * perimeter, true)

      if (approx.rows === 4 && cv.isContourConvex(approx)) {
        const points: Point2D[] = []
        const data = approx.data32S
        for (let p = 0; p < 4; p += 1) {
          points.push({ x: data[p * 2], y: data[p * 2 + 1] })
        }

        const corners = orderCorners(points)
        const aspectRatio = ratioFromCorners(corners)
        const ratioError = Math.abs(aspectRatio - TARGET_RATIO) / TARGET_RATIO
        const ratioScore = clamp01(1 - ratioError / 0.48)
        const areaScore = clamp01((areaRatio - 0.015) / 0.18)
        const confidence = ratioScore * 0.72 + areaScore * 0.28

        if (aspectRatio >= 1.12 && aspectRatio <= 2.25 && confidence > best.confidence) {
          best = {
            found: confidence >= 0.48,
            corners,
            confidence,
            areaRatio,
            aspectRatio,
            processingMs: 0,
          }
        }
      }

      approx.delete()
      contour.delete()
    }

    best.processingMs = performance.now() - started
    return best
  }

  dispose() {
    this.src.delete()
    this.gray.delete()
    this.blur.delete()
    this.edges.delete()
    this.hierarchy.delete()
    this.contours.delete()
    this.kernel.delete()
  }
}
