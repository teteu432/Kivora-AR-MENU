import type { CardDetection, OrderedCorners, Point2D } from '../types/ARTypes'

const TARGET_RATIO = 8 / 5
const SAMPLE_STEP = 2

type Component = {
  count: number
  minX: number
  minY: number
  maxX: number
  maxY: number
  topLeft: Point2D
  topRight: Point2D
  bottomRight: Point2D
  bottomLeft: Point2D
}

function distance(a: Point2D, b: Point2D) {
  return Math.hypot(a.x - b.x, a.y - b.y)
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

function pointSum(p: Point2D) {
  return p.x + p.y
}

function pointDiff(p: Point2D) {
  return p.x - p.y
}

function mergeComponents(a: Component, b: Component): Component {
  const points = [
    a.topLeft, a.topRight, a.bottomRight, a.bottomLeft,
    b.topLeft, b.topRight, b.bottomRight, b.bottomLeft,
  ]
  return {
    count: a.count + b.count,
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
    topLeft: points.reduce((best, p) => pointSum(p) < pointSum(best) ? p : best),
    topRight: points.reduce((best, p) => pointDiff(p) > pointDiff(best) ? p : best),
    bottomRight: points.reduce((best, p) => pointSum(p) > pointSum(best) ? p : best),
    bottomLeft: points.reduce((best, p) => pointDiff(p) < pointDiff(best) ? p : best),
  }
}

function overlapRatio(a0: number, a1: number, b0: number, b1: number) {
  const overlap = Math.max(0, Math.min(a1, b1) - Math.max(a0, b0))
  const smallest = Math.max(1, Math.min(a1 - a0, b1 - b0))
  return overlap / smallest
}

export class CardDetector {
  private readonly width: number
  private readonly height: number
  private readonly gridW: number
  private readonly gridH: number
  private readonly mask: Uint8Array
  private readonly visited: Uint8Array
  private readonly queue: Int32Array
  private readonly context: CanvasRenderingContext2D | null

  constructor(width = 360, height = 270, canvas?: HTMLCanvasElement) {
    this.width = width
    this.height = height
    this.gridW = Math.ceil(width / SAMPLE_STEP)
    this.gridH = Math.ceil(height / SAMPLE_STEP)
    const cells = this.gridW * this.gridH
    this.mask = new Uint8Array(cells)
    this.visited = new Uint8Array(cells)
    this.queue = new Int32Array(cells)
    this.context = canvas?.getContext('2d', { willReadFrequently: true }) ?? null
  }

  detect(canvas: HTMLCanvasElement): CardDetection {
    const started = performance.now()
    const ctx = this.context ?? canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) {
      return { found: false, confidence: 0, areaRatio: 0, aspectRatio: 0, processingMs: performance.now() - started }
    }

    const image = ctx.getImageData(0, 0, this.width, this.height)
    const data = image.data

    // Estima o brilho médio para adaptar o limiar ao ambiente.
    let lumSum = 0
    let lumCount = 0
    for (let y = 0; y < this.height; y += 8) {
      for (let x = 0; x < this.width; x += 8) {
        const i = (y * this.width + x) * 4
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        lumSum += r * 0.299 + g * 0.587 + b * 0.114
        lumCount += 1
      }
    }
    const meanLum = lumCount ? lumSum / lumCount : 90
    const whiteThreshold = Math.max(145, Math.min(215, meanLum + 48))

    this.mask.fill(0)
    this.visited.fill(0)

    // Máscara de regiões claras e relativamente neutras. O cartão é branco,
    // enquanto a mesa do teste é escura. Não dependemos do desenho interno.
    for (let gy = 0; gy < this.gridH; gy += 1) {
      const y = Math.min(this.height - 1, gy * SAMPLE_STEP)
      for (let gx = 0; gx < this.gridW; gx += 1) {
        const x = Math.min(this.width - 1, gx * SAMPLE_STEP)
        const i = (y * this.width + x) * 4
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const max = Math.max(r, g, b)
        const min = Math.min(r, g, b)
        const lum = r * 0.299 + g * 0.587 + b * 0.114
        const chroma = max - min
        if (lum >= whiteThreshold && chroma <= 72) {
          this.mask[gy * this.gridW + gx] = 1
        }
      }
    }

    const components: Component[] = []
    const minCells = Math.max(26, Math.floor(this.gridW * this.gridH * 0.0025))

    for (let start = 0; start < this.mask.length; start += 1) {
      if (!this.mask[start] || this.visited[start]) continue

      let head = 0
      let tail = 0
      this.queue[tail++] = start
      this.visited[start] = 1

      let count = 0
      let minX = this.gridW
      let minY = this.gridH
      let maxX = 0
      let maxY = 0
      let tl: Point2D = { x: this.gridW, y: this.gridH }
      let tr: Point2D = { x: 0, y: this.gridH }
      let br: Point2D = { x: 0, y: 0 }
      let bl: Point2D = { x: this.gridW, y: 0 }

      while (head < tail) {
        const idx = this.queue[head++]
        const x = idx % this.gridW
        const y = Math.floor(idx / this.gridW)
        count += 1
        minX = Math.min(minX, x)
        maxX = Math.max(maxX, x)
        minY = Math.min(minY, y)
        maxY = Math.max(maxY, y)

        const p = { x, y }
        if (pointSum(p) < pointSum(tl)) tl = p
        if (pointDiff(p) > pointDiff(tr)) tr = p
        if (pointSum(p) > pointSum(br)) br = p
        if (pointDiff(p) < pointDiff(bl)) bl = p

        const left = idx - 1
        const right = idx + 1
        const up = idx - this.gridW
        const down = idx + this.gridW

        if (x > 0 && this.mask[left] && !this.visited[left]) {
          this.visited[left] = 1; this.queue[tail++] = left
        }
        if (x + 1 < this.gridW && this.mask[right] && !this.visited[right]) {
          this.visited[right] = 1; this.queue[tail++] = right
        }
        if (y > 0 && this.mask[up] && !this.visited[up]) {
          this.visited[up] = 1; this.queue[tail++] = up
        }
        if (y + 1 < this.gridH && this.mask[down] && !this.visited[down]) {
          this.visited[down] = 1; this.queue[tail++] = down
        }
      }

      if (count >= minCells) {
        const scale = SAMPLE_STEP
        components.push({
          count,
          minX: minX * scale,
          minY: minY * scale,
          maxX: maxX * scale,
          maxY: maxY * scale,
          topLeft: { x: tl.x * scale, y: tl.y * scale },
          topRight: { x: tr.x * scale, y: tr.y * scale },
          bottomRight: { x: br.x * scale, y: br.y * scale },
          bottomLeft: { x: bl.x * scale, y: bl.y * scale },
        })
      }
    }

    // O risco preto central pode dividir o papel em duas regiões brancas.
    // Por isso, além de regiões isoladas, testamos pares alinhados e próximos.
    const candidates = components.slice()
    const topComponents = components
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)

    for (let i = 0; i < topComponents.length; i += 1) {
      for (let j = i + 1; j < topComponents.length; j += 1) {
        const a = topComponents[i]
        const b = topComponents[j]
        const xOverlap = overlapRatio(a.minX, a.maxX, b.minX, b.maxX)
        const verticalGap = Math.max(0, Math.max(a.minY, b.minY) - Math.min(a.maxY, b.maxY))
        const avgHeight = ((a.maxY - a.minY) + (b.maxY - b.minY)) / 2
        if (xOverlap >= 0.58 && verticalGap <= Math.max(18, avgHeight * 0.4)) {
          candidates.push(mergeComponents(a, b))
        }
      }
    }

    const frameArea = this.width * this.height
    let best: CardDetection = {
      found: false,
      confidence: 0,
      areaRatio: 0,
      aspectRatio: 0,
      processingMs: 0,
    }

    for (const c of candidates) {
      const corners: OrderedCorners = {
        topLeft: c.topLeft,
        topRight: c.topRight,
        bottomRight: c.bottomRight,
        bottomLeft: c.bottomLeft,
      }
      const aspectRatio = ratioFromCorners(corners)
      const bboxArea = Math.max(1, (c.maxX - c.minX) * (c.maxY - c.minY))
      const brightArea = c.count * SAMPLE_STEP * SAMPLE_STEP
      const areaRatio = bboxArea / frameArea
      const fillRatio = clamp01(brightArea / bboxArea)

      if (areaRatio < 0.012 || areaRatio > 0.72) continue
      if (aspectRatio < 1.08 || aspectRatio > 2.35) continue

      const ratioError = Math.abs(aspectRatio - TARGET_RATIO) / TARGET_RATIO
      const ratioScore = clamp01(1 - ratioError / 0.52)
      const areaScore = clamp01((areaRatio - 0.012) / 0.16)
      // Um cartão com linhas pretas ainda mantém bastante área branca.
      const fillScore = clamp01((fillRatio - 0.28) / 0.5)
      const confidence = ratioScore * 0.55 + areaScore * 0.22 + fillScore * 0.23

      if (confidence > best.confidence) {
        best = {
          found: confidence >= 0.47,
          corners,
          confidence,
          areaRatio,
          aspectRatio,
          processingMs: 0,
        }
      }
    }

    best.processingMs = performance.now() - started
    return best
  }

  dispose() {
    // Sem WASM e sem memória nativa para liberar.
  }
}
