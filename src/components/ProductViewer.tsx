import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import type {
  ModelViewerArStatus,
  ModelViewerElement,
} from '../model-viewer'
import type { Product3D } from '../products'
import type { PhysicalARSession } from '../ar/startPhysicalAR'

type Props = {
  product: Product3D
}

type ArStatusEvent = CustomEvent<{
  status: ModelViewerArStatus
}>

type DepthSupport = 'unknown' | 'yes' | 'no'

export default function ProductViewer({ product }: Props) {
  const viewerRef = useRef<ModelViewerElement | null>(null)
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const physicalSessionRef = useRef<PhysicalARSession | null>(null)
  const sourceKeyRef = useRef('')
  const originalWidthRef = useRef<number | null>(null)

  const [ready, setReady] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [openingAr, setOpeningAr] = useState(false)
  const [arActive, setArActive] = useState(false)
  const [webXRSupported, setWebXRSupported] = useState<boolean | null>(null)
  const [depthSupport, setDepthSupport] = useState<DepthSupport>('unknown')
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
    let active = true
    const xr = (navigator as Navigator & { xr?: any }).xr

    if (!xr) {
      setWebXRSupported(false)
      return
    }

    void xr
      .isSessionSupported('immersive-ar')
      .then((supported: boolean) => {
        if (active) setWebXRSupported(supported)
      })
      .catch(() => {
        if (active) setWebXRSupported(false)
      })

    return () => {
      active = false
    }
  }, [])

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
        setStatus(`${product.shortName} pronto para visualizar em AR.`)
      } catch (error) {
        console.error('[Kivora AR] Falha ao preparar modelo:', error)
        setStatus('Não foi possível preparar este modelo 3D.')
      }
    }

    const handleError = () => {
      setReady(false)
      setStatus('Não foi possível carregar este modelo 3D.')
    }

    const handleArStatus = (event: Event) => {
      const arStatus = (event as ArStatusEvent).detail.status

      if (arStatus === 'session-started') {
        setOpeningAr(false)
        setGuideOpen(false)
      }

      if (arStatus === 'object-placed') {
        setStatus(`${product.shortName} posicionado.`)
      }

      if (arStatus === 'failed') {
        setOpeningAr(false)
        setStatus('Não foi possível abrir a câmera AR.')
      }

      if (arStatus === 'not-presenting') {
        setOpeningAr(false)
        setStatus('AR encerrado.')
      }
    }

    viewer.addEventListener('load', prepare)
    viewer.addEventListener('error', handleError)
    viewer.addEventListener('ar-status', handleArStatus)
    viewer.setAttribute('src', product.modelUrl)

    if (viewer.loaded) {
      window.setTimeout(prepare, 80)
    }

    return () => {
      viewer.removeEventListener('load', prepare)
      viewer.removeEventListener('error', handleError)
      viewer.removeEventListener('ar-status', handleArStatus)
    }
  }, [product, applyScale])

  const openNativeFallback = async () => {
    const viewer = viewerRef.current
    if (!viewer) return

    applyScale()

    if (!viewer.canActivateAR) {
      setStatus('AR não está disponível neste aparelho. A visualização 3D continua disponível.')
      return
    }

    await viewer.activateAR()
  }

  const openCamera = async () => {
    if (openingAr) return

    setOpeningAr(true)
    setDepthSupport('unknown')
    applyScale()

    try {
      if (webXRSupported && overlayRef.current) {
        const { startPhysicalAR } = await import('../ar/startPhysicalAR')

        physicalSessionRef.current = await startPhysicalAR(
          product,
          overlayRef.current,
          {
            onStatus: setStatus,
            onSessionStart: () => {
              setGuideOpen(false)
              setOpeningAr(false)
              setArActive(true)
            },
            onSessionEnd: () => {
              physicalSessionRef.current = null
              setArActive(false)
              setOpeningAr(false)
              setStatus('AR encerrado. O tamanho físico permanece salvo para a próxima visualização.')
            },
            onDepthSupport: (enabled) => {
              setDepthSupport(enabled ? 'yes' : 'no')
            },
          }
        )
      } else {
        await openNativeFallback()
        setGuideOpen(false)
        setOpeningAr(false)
      }
    } catch (error) {
      console.error('[Kivora AR] Falha ao iniciar AR físico:', error)

      try {
        await openNativeFallback()
        setGuideOpen(false)
      } catch (fallbackError) {
        console.error('[Kivora AR] Fallback AR falhou:', fallbackError)
        setStatus('Não foi possível iniciar o AR neste aparelho.')
      } finally {
        setOpeningAr(false)
      }
    }
  }

  const closePhysicalAR = () => {
    void physicalSessionRef.current?.end()
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
          ar
          ar-modes="webxr scene-viewer quick-look"
          ar-placement="floor"
          ar-scale="fixed"
          camera-controls
          auto-rotate
          shadow-intensity="1.4"
          shadow-softness="0.9"
          environment-image="neutral"
          exposure="1.08"
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

      <div
        ref={overlayRef}
        className={`xr-dom-overlay ${arActive ? 'active' : ''}`}
      >
        <div className="xr-top-status">
          <strong>{product.realWidthCm} cm reais</strong>
          <span>{status}</span>
          {depthSupport === 'yes' && (
            <small>Oclusão de profundidade ativa</small>
          )}
          {depthSupport === 'no' && (
            <small>Oclusão de mão não suportada neste aparelho</small>
          )}
        </div>

        <button
          type="button"
          className="xr-close-button"
          onClick={closePhysicalAR}
          aria-label="Sair do AR"
        >
          ×
        </button>
      </div>

      {guideOpen && (
        <div
          className="modal-backdrop"
          onClick={() => {
            if (!openingAr) setGuideOpen(false)
          }}
        >
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
              disabled={openingAr}
              aria-label="Fechar"
            >
              ×
            </button>

            <div className="modal-icon">{product.emoji}</div>
            <h2>Posicionamento em tamanho real</h2>

            <p>
              Aponte para a mesa e mova o celular devagar. Um contorno físico de
              <strong> {product.realWidthCm} cm </strong>
              aparecerá sobre a superfície. Quando ele estabilizar, toque para colocar o produto.
            </p>

            <div className="ar-feature-list">
              <div>
                <span>01</span>
                <p><strong>Referência real</strong> — o contorno tem o mesmo diâmetro cadastrado do produto.</p>
              </div>
              <div>
                <span>02</span>
                <p><strong>Escala bloqueada</strong> — depois de colocado, o usuário não redimensiona o alimento.</p>
              </div>
              <div>
                <span>03</span>
                <p><strong>Profundidade</strong> — em aparelhos compatíveis, sua mão pode passar na frente e atrás do modelo.</p>
              </div>
            </div>

            <div className="modal-measure">
              <span>Referência física</span>
              <strong>Ø {product.realWidthCm} cm</strong>
            </div>

            <button
              type="button"
              className="open-camera-button"
              onClick={() => void openCamera()}
              disabled={openingAr}
            >
              {openingAr ? 'Preparando câmera…' : 'Abrir câmera AR'}
            </button>

            <small className="compatibility-note">
              WebXR é usado quando disponível. Em outros aparelhos, o sistema tenta o visualizador AR nativo.
            </small>
          </section>
        </div>
      )}
    </>
  )
}
