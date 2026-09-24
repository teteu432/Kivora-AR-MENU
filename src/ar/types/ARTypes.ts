export type Point2D = { x: number; y: number }

export type OrderedCorners = {
  topLeft: Point2D
  topRight: Point2D
  bottomRight: Point2D
  bottomLeft: Point2D
}

export type CardDetection = {
  found: boolean
  corners?: OrderedCorners
  confidence: number
  areaRatio: number
  aspectRatio: number
  processingMs: number
}
