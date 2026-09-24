import { useEffect, useMemo, useRef, useState } from 'react'
import { CameraManager } from '../ar/camera/CameraManager'
import { CardDetector } from '../ar/tracking/CardDetector'
import { PoseSmoother } from '../ar/tracking/PoseSmoother'
import type { CardDetection, OrderedCorners, Point2D } from '../ar/types/ARTypes'

const PROCESS_WIDTH = 360
const PROCESS_HEIGHT = 270
const TRACK_INTERVAL_MS = 85
const HOLD_MS = 360

function cameraErrorMessage(error: unknown) {
  const name = error instanceof DOMException ? error.name : error instanceof Error ? error.message : String(error)
  if (name.includes('NotAllowed')) return 'Permissão da câmera negada. Libere a câmera nas permissões do site.'
  if (name.includes('NotFound')) return 'Nenhuma câmera disponível foi encontrada.'
  if (name.includes('NotReadable')) return 'A câmera está ocupada por outro aplicativo.'
  if (name.includes('CAMERA_TIMEOUT')) return 'A câmera demorou demais para iniciar.'
  if (name.includes('OPENCV')) return 'Não foi possível carregar o módulo de visão computacional.'
  return 'Não foi possível iniciar a câmera.'
}

function mapPoint(point: Point2D, video: HTMLVideoElement, canvas: HTMLCanvasElement): Point2D {
  const stageW = canvas.clientWidth
  const stageH = canvas.clientHeight
  const videoW = video.videoWidth || 1280
  const videoH = video.videoHeight || 720
  const scale = Math.max(stageW / videoW, stageH / videoH)
  const drawW = videoW * scale
  const drawH = videoH * scale
  const offsetX = (stageW - drawW) / 2
  const offsetY = (stageH - drawH) / 2

  const videoX = (point.x / PROCESS_WIDTH) * videoW
  const videoY = (point.y / PROCESS_HEIGHT) * videoH

  return {
    x: offsetX + videoX * scale,
    y: offsetY + videoY * scale,
  }
}

function drawOverlay(canvas: HTMLCanvasElement, video: HTMLVideoElement, corners: OrderedCorners | null, confidence = 0) {
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  const pixelW = Math.round(width * dpr)
  const pixelH = Math.round(height * dpr)
  if (canvas.width !== pixelW || canvas.height !== pixelH) {
    canvas.width = pixelW
    canvas.height = pixelH
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, width, height)

  if (!corners) return

  const mapped = {
    topLeft: mapPoint(corners.topLeft, video, canvas),
    topRight: mapPoint(corners.topRight, video, canvas),
    bottomRight: mapPoint(corners.bottomRight, video, canvas),
    bottomLeft: mapPoint(corners.bottomLeft, video, canvas),
  }

  ctx.lineWidth = 4
  ctx.strokeStyle = confidence >= 0.7 ? '#39e58c' : '#ffd166'
  ctx.beginPath()
  ctx.moveTo(mapped.topLeft.x, mapped.topLeft.y)
  ctx.lineTo(mapped.topRight.x, mapped.topRight.y)
  ctx.lineTo(mapped.bottomRight.x, mapped.bottomRight.y)
  ctx.lineTo(mapped.bottomLeft.x, mapped.bottomLeft.y)
  ctx.closePath()
  ctx.stroke()

  const points: Array<[Point2D, string, string]> = [
    [mapped.topLeft, '#ff4d4f', 'TL'],
    [mapped.topRight, '#35c759', 'TR'],
    [mapped.bottomRight, '#0a84ff', 'BR'],
    [mapped.bottomLeft, '#ffd60a', 'BL'],
  ]

  ctx.font = '700 12px system-ui'
  for (const [p, color, label] of points) {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(p.x, p.y, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.fillText(label, p.x + 11, p.y - 7)
  }
}

export default function ARCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const processRef = useRef<HTMLCanvasElement>(null)
  const camera = useMemo(() => new CameraManager(), [])
  const [started, setStarted] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detection, setDetection] = useState<CardDetection | null>(null)
  const [trackingFps, setTrackingFps] = useState(0)
  const debug = useMemo(() => new URLSearchParams(location.search).get('debug') === 'true', [])

  useEffect(() => () => camera.stop(), [camera])

  async function start() {
    if (!videoRef.current) return
    setStarting(true)
    setError(null)
    try {
      await camera.start(videoRef.current)
      setStarted(true)
    } catch (e) {
      setError(cameraErrorMessage(e))
      camera.stop()
      setStarted(false)
    } finally {
      setStarting(false)
    }
  }

  useEffect(() => {
    if (!started || !videoRef.current || !processRef.current || !overlayRef.current) return

    const video = videoRef.current
    const processCanvas = processRef.current
    const processCtx = processCanvas.getContext('2d', { willReadFrequently: true })
    if (!processCtx) return

    processCanvas.width = PROCESS_WIDTH
    processCanvas.height = PROCESS_HEIGHT

    let detector: CardDetector | null = null
    let cancelled = false
    let timer = 0
    let lastFoundAt = 0
    let heldCorners: OrderedCorners | null = null
    const smoother = new PoseSmoother(0.38)
    let frameCount = 0
    let fpsWindowStart = performance.now()

    const run = async () => {
      try {
        if (cancelled) return
        detector = new CardDetector(PROCESS_WIDTH, PROCESS_HEIGHT, processCanvas)

        const tick = () => {
          if (cancelled || !detector) return
          const before = performance.now()

          if (video.readyState >= 2 && video.videoWidth > 0) {
            processCtx.drawImage(video, 0, 0, PROCESS_WIDTH, PROCESS_HEIGHT)
            const next = detector.detect(processCanvas)

            if (next.found && next.corners) {
              heldCorners = smoother.update(next.corners)
              lastFoundAt = performance.now()
              setDetection({ ...next, corners: heldCorners })
            } else if (heldCorners && performance.now() - lastFoundAt < HOLD_MS) {
              setDetection({ ...next, found: true, corners: heldCorners, confidence: Math.max(next.confidence, 0.35) })
            } else {
              heldCorners = null
              smoother.reset()
              setDetection(next)
            }

            drawOverlay(overlayRef.current!, video, heldCorners, next.confidence)

            frameCount += 1
            const now = performance.now()
            if (now - fpsWindowStart >= 1000) {
              setTrackingFps(Math.round((frameCount * 1000) / (now - fpsWindowStart)))
              frameCount = 0
              fpsWindowStart = now
            }
          }

          const elapsed = performance.now() - before
          timer = window.setTimeout(tick, Math.max(18, TRACK_INTERVAL_MS - elapsed))
        }

        tick()
      } catch (e) {
        setError(cameraErrorMessage(e))
      }
    }

    void run()

    return () => {
      cancelled = true
      window.clearTimeout(timer)
      detector?.dispose()
      const canvas = overlayRef.current
      canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
    }
  }, [started])

  return (
    <main className="camera-page">
      <div className="camera-stage">
        <video ref={videoRef} className="camera-video" playsInline muted />
        <canvas ref={overlayRef} className="overlay-canvas" />
        <canvas ref={processRef} className="process-canvas" aria-hidden="true" />
        {started && !detection?.found && <div className="card-guide" aria-hidden="true"><span>8 × 5 cm</span></div>}

        {!started && (
          <section className="start-panel">
            <div className="brand-mark">K</div>
            <p className="eyebrow">Kivora AR Menu</p>
            <h1>Primeiro, vamos provar que o rastreamento funciona.</h1>
            <p>
              Nesta versão não existe 3D. O objetivo é detectar o seu cartão físico de <strong>8 × 5 cm</strong> com estabilidade.
            </p>
            <button className="primary" onClick={start} disabled={starting}>
              {starting ? 'Iniciando…' : 'Abrir câmera'}
            </button>
            {error && <div className="error-box">{error}</div>}
          </section>
        )}

        {started && (
          <>
            <header className="camera-header">
              <div className={`status-chip ${detection?.found ? 'found' : ''}`}>
                <span className="dot" />
                {detection?.found ? 'Cartão encontrado' : 'Procurando cartão'}
              </div>
              <button className="close-btn" onClick={() => location.reload()} aria-label="Fechar">×</button>
            </header>

            <section className="instruction-card">
              <strong>{detection?.found ? 'Ótimo. Mova o celular devagar.' : 'Mostre o cartão inteiro para a câmera.'}</strong>
              <span>
                {detection?.found
                  ? 'As quatro bolinhas devem continuar presas aos cantos enquanto você aproxima, afasta e inclina o celular.'
                  : 'Mantenha o cartão inteiro próximo ao centro da tela, com a borda preta e os quatro cantos visíveis.'}
              </span>
            </section>

            {debug && (
              <aside className="debug-panel">
                <b>DEBUG</b>
                <span>motor: TypeScript local</span>
                <span>tracking: {trackingFps} fps</span>
                <span>found: {String(Boolean(detection?.found))}</span>
                <span>confidence: {(detection?.confidence ?? 0).toFixed(2)}</span>
                <span>ratio: {(detection?.aspectRatio ?? 0).toFixed(2)}</span>
                <span>area: {((detection?.areaRatio ?? 0) * 100).toFixed(1)}%</span>
                <span>process: {(detection?.processingMs ?? 0).toFixed(1)} ms</span>
              </aside>
            )}
          </>
        )}
      </div>
    </main>
  )
}
