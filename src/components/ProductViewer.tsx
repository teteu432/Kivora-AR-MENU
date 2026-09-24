import { useCallback, useEffect, useRef, useState } from 'react'
import type { ModelViewerElement } from '../model-viewer'
import type { Product3D } from '../products'

type Props = {
  product: Product3D
}

const MARKER_SIZE_CM = 8

export default function ProductViewer({ product }: Props) {
  const viewerRef = useRef<ModelViewerElement | null>(null)
  const sourceKeyRef = useRef('')
  const originalWidthRef = useRef<number | null>(null)

  const [ready, setReady] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [status, setStatus] = useState('Preparando visualização 3D…')

  const applyScale = useCallback(() => {
    const viewer = viewerRef.current
    const originalWidth = originalWidthRef.current

    if (!viewer || !originalWidth) return

    const targetMeters = product.realWidthCm / 100
    const factor = targetMeters / originalWidth

    viewer.setAttribute('scale', `${factor} ${factor} ${factor}`)
    viewer.updateFraming()
  }, [product.realWidthCm])

  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) return

    setReady(false)
    setStatus('Preparando visualização 3D…')

    if (sourceKeyRef.current !== product.modelUrl) {
      sourceKeyRef.current = product.modelUrl
      originalWidthRef.current = null
    }

    const prepare = () => {
      try {
        const dimensions = viewer.getDimensions()

        if (originalWidthRef.current === null) {
          const horizontal = Math.max(dimensions.x, dimensions.z)
          if (!Number.isFinite(horizontal) || horizontal <= 0) {
            throw new Error('Dimensões inválidas.')
          }
          originalWidthRef.current = horizontal
        }

        applyScale()
        setReady(true)
        setStatus(`${product.shortName} pronto para visualizar.`)
      } catch (error) {
        console.error('[Kivora AR] Falha ao preparar modelo:', error)
        setStatus('Não foi possível preparar este modelo 3D.')
      }
    }

    const handleError = () => {
      setReady(false)
      setStatus('Não foi possível carregar este modelo 3D.')
    }

    viewer.addEventListener('load', prepare)
    viewer.addEventListener('error', handleError)
    viewer.setAttribute('src', product.modelUrl)

    if (viewer.loaded) {
      window.setTimeout(prepare, 80)
    }

    return () => {
      viewer.removeEventListener('load', prepare)
      viewer.removeEventListener('error', handleError)
    }
  }, [product, applyScale])

  const openCompatibleAR = () => {
    const params = new URLSearchParams({
      model: product.modelUrl,
      widthCm: String(product.realWidthCm),
      heightCm: String(product.realHeightCm),
      name: product.name,
      emoji: product.emoji,
      markerCm: String(MARKER_SIZE_CM),
    })

    window.location.href = `/ar-marker.html?${params.toString()}`
  }

  const openMarker = () => {
    window.open('/marker-print.html', '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      <div className="viewer-frame">
        <model-viewer
          ref={(node) => {
            viewerRef.current = node as ModelViewerElement | null
          }}
          src={product.modelUrl}
          alt={`${product.name} em 3D`}
          camera-controls
          auto-rotate
          shadow-intensity="1"
          shadow-softness="0.8"
          environment-image="neutral"
          exposure="1.05"
          touch-action="pan-y"
          loading="eager"
          style={{ width: '100%', height: '100%' }}
        />

        {!ready && (
          <div className="viewer-loading">
            <div className="loader-dot" />
            <span>Preparando {product.shortName}…</span>
          </div>
        )}

        <div className="viewer-topline">
          <span>Visualização 3D</span>
          <span className="measure-pill">↔ {product.realWidthCm} cm</span>
        </div>

        <div className="viewer-bottom">
          <div className="viewer-hint">Arraste para girar</div>
          <button
            type="button"
            className="ar-button"
            onClick={() => setGuideOpen(true)}
            disabled={!ready}
          >
            <span>⌖</span>
            Ver na minha mesa
          </button>
        </div>
      </div>

      <p className="status-line">{status}</p>

      {guideOpen && (
        <div className="modal-backdrop" onClick={() => setGuideOpen(false)}>
          <section
            className="ar-modal"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              type="button"
              onClick={() => setGuideOpen(false)}
              aria-label="Fechar"
            >
              ×
            </button>

            <div className="modal-icon">{product.emoji}</div>
            <h2>AR compatível e com escala fixa</h2>

            <p>
              Esta versão não depende de ARCore ou WebXR. Coloque o marcador de
              <strong> {MARKER_SIZE_CM} cm </strong>
              sobre a mesa e mantenha-o visível. Ele funciona como uma régua física para
              calcular o tamanho e a posição do alimento.
            </p>

            <div className="ar-feature-list">
              <div>
                <span>01</span>
                <p><strong>Escala consistente</strong> — o marcador define uma medida conhecida no mundo real.</p>
              </div>
              <div>
                <span>02</span>
                <p><strong>Mais aparelhos</strong> — usa câmera + WebGL, sem exigir suporte a ARCore.</p>
              </div>
              <div>
                <span>03</span>
                <p><strong>Mais leve</strong> — rastreamento por marcador substitui detecção de superfície e profundidade.</p>
              </div>
            </div>

            <div className="modal-measure">
              <span>Produto / marcador</span>
              <strong>{product.realWidthCm} cm / {MARKER_SIZE_CM} cm</strong>
            </div>

            <div className="modal-warning">
              A oclusão real da mão (passar na frente e atrás do alimento) depende de sensor/profundidade e não é confiável em todos os celulares. Nesta versão priorizamos estabilidade, tamanho real e compatibilidade.
            </div>

            <button type="button" className="open-camera-button" onClick={openCompatibleAR}>
              📷 Abrir câmera — modo compatível
            </button>

            <button type="button" className="marker-button" onClick={openMarker}>
              ⬚ Abrir marcador de referência
            </button>
          </section>
        </div>
      )}
    </>
  )
}
