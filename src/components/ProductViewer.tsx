import { useCallback, useEffect, useRef, useState } from 'react'
import type { ModelViewerElement } from '../model-viewer'
import type { Product3D } from '../products'

type Props = {
  product: Product3D
}

export default function ProductViewer({ product }: Props) {
  const viewerRef = useRef<ModelViewerElement | null>(null)
  const originalWidthRef = useRef<number | null>(null)
  const sourceKeyRef = useRef('')

  const [ready, setReady] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [status, setStatus] = useState('Preparando visualização 3D…')

  const applyPreviewScale = useCallback(() => {
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

        applyPreviewScale()
        setReady(true)
        setStatus(`${product.shortName} pronto. A AR usa um cartão físico como referência.`)
      } catch (error) {
        console.error('[Kivora AR] Falha ao preparar modelo:', error)
        setReady(false)
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

    if (viewer.loaded) window.setTimeout(prepare, 80)

    return () => {
      viewer.removeEventListener('load', prepare)
      viewer.removeEventListener('error', handleError)
    }
  }, [product, applyPreviewScale])

  const openMarkerAR = () => {
    const url = `/marker-ar.html?product=${encodeURIComponent(product.id)}`
    window.location.assign(url)
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
          shadow-intensity="0.55"
          shadow-softness="0.7"
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

            <div className="modal-icon">▣</div>
            <h2>Use o cartão de referência</h2>
            <p>
              Nesta versão a câmera não tenta mais descobrir a mesa. Ela procura um marcador físico de tamanho conhecido,
              o que dá ao sistema uma régua real para posição, perspectiva e escala.
            </p>

            <div className="modal-measure">
              <span>Cartão completo</span>
              <strong>8 × 5 cm</strong>
            </div>
            <div className="modal-measure" style={{ marginTop: 8 }}>
              <span>Marcador usado na calibração</span>
              <strong>5 × 5 cm</strong>
            </div>
            <div className="modal-measure" style={{ marginTop: 8 }}>
              <span>Produto selecionado</span>
              <strong>{product.realWidthCm} cm</strong>
            </div>

            <p style={{ marginTop: 14 }}>
              Mantenha o quadrado preto do cartão visível enquanto aproxima, afasta ou contorna o alimento.
              O produto aparecerá ao lado do cartão para sua mão não esconder a referência com facilidade.
            </p>

            <button type="button" className="open-camera-button" onClick={openMarkerAR}>
              Abrir câmera com referência
            </button>

            <a
              href="/reference-card.html"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'block',
                marginTop: 12,
                textAlign: 'center',
                color: '#c8a8ff',
                fontSize: 12,
                fontWeight: 800,
                textDecoration: 'none',
              }}
            >
              Abrir cartão para impressão
            </a>
          </section>
        </div>
      )}
    </>
  )
}
