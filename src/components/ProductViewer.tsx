import { useCallback, useEffect, useRef, useState } from 'react'
import type { ModelViewerElement } from '../model-viewer'
import type { Product3D } from '../products'

type Props = {
  product: Product3D
}

function isEmbeddedBrowser() {
  const ua = navigator.userAgent || ''
  return /Instagram|FBAN|FBAV|Line\/|wv\)/i.test(ua)
}

export default function ProductViewer({ product }: Props) {
  const viewerRef = useRef<ModelViewerElement | null>(null)
  const sourceKeyRef = useRef('')
  const originalWidthRef = useRef<number | null>(null)

  const [ready, setReady] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [arSupported, setArSupported] = useState<boolean | null>(null)
  const [launchError, setLaunchError] = useState<string | null>(null)
  const [status, setStatus] = useState('Preparando visualização 3D…')

  const applyScale = useCallback(() => {
    const viewer = viewerRef.current
    const originalWidth = originalWidthRef.current

    if (!viewer || !originalWidth) return

    const targetMeters = product.realWidthCm / 100
    const factor = (targetMeters / originalWidth) * product.scaleCalibration

    viewer.setAttribute('scale', `${factor} ${factor} ${factor}`)
    viewer.updateFraming()
  }, [product.realWidthCm, product.scaleCalibration])

  const refreshARSupport = useCallback(() => {
    const viewer = viewerRef.current
    if (!viewer) return
    setArSupported(Boolean(viewer.canActivateAR))
  }, [])

  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) return

    setReady(false)
    setArSupported(null)
    setLaunchError(null)
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

        // O model-viewer decide o modo AR de forma assíncrona.
        // Rechecamos após pequenos intervalos para capturar Scene Viewer/WebXR/Quick Look.
        window.setTimeout(refreshARSupport, 120)
        window.setTimeout(refreshARSupport, 700)
      } catch (error) {
        console.error('[Kivora AR] Falha ao preparar modelo:', error)
        setStatus('Não foi possível preparar este modelo 3D.')
      }
    }

    const handleError = () => {
      setReady(false)
      setArSupported(false)
      setStatus('Não foi possível carregar este modelo 3D.')
    }

    const handleARStatus = (event: Event) => {
      const detail = (event as CustomEvent<{ status?: string }>).detail
      if (detail?.status === 'failed') {
        setLaunchError('O modo AR não abriu neste aparelho. Você ainda pode visualizar o prato em 3D.')
      }
    }

    viewer.addEventListener('load', prepare)
    viewer.addEventListener('error', handleError)
    viewer.addEventListener('ar-status', handleARStatus)
    viewer.setAttribute('src', product.modelUrl)

    if (viewer.loaded) {
      window.setTimeout(prepare, 80)
    }

    return () => {
      viewer.removeEventListener('load', prepare)
      viewer.removeEventListener('error', handleError)
      viewer.removeEventListener('ar-status', handleARStatus)
    }
  }, [product, applyScale, refreshARSupport])

  const openGuide = () => {
    setLaunchError(null)
    refreshARSupport()
    setGuideOpen(true)
  }

  const launchAR = () => {
    const viewer = viewerRef.current
    if (!viewer) return

    setLaunchError(null)

    // Importante: activateAR() é chamado diretamente no clique do usuário.
    // Scene Viewer e Quick Look podem bloquear ativações disparadas depois de awaits/timeouts.
    const activation = viewer.activateAR()
    setGuideOpen(false)

    void activation.catch((error) => {
      console.error('[Kivora AR] Não foi possível abrir AR:', error)
      setLaunchError('O modo AR não abriu neste aparelho. Continue usando a visualização 3D.')
    })
  }

  const embedded = typeof navigator !== 'undefined' && isEmbeddedBrowser()

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
          ar-modes={product.nativeScaleReady
            ? 'scene-viewer webxr quick-look'
            : 'webxr quick-look'}
          ar-placement="floor"
          ar-scale="fixed"
          camera-controls
          auto-rotate
          shadow-intensity="0.9"
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
            onClick={openGuide}
            disabled={!ready}
          >
            <span>⌖</span>
            Ver na minha mesa
          </button>
        </div>
      </div>

      <p className="status-line">
        {status}
        {ready && arSupported === false && ' • AR indisponível neste aparelho; modo 3D continua disponível.'}
      </p>

      {launchError && (
        <div className="ar-fallback-message" role="status">
          <strong>AR indisponível</strong>
          <span>{launchError}</span>
        </div>
      )}

      {guideOpen && (
        <div className="modal-backdrop" onClick={() => setGuideOpen(false)}>
          <section
            className="ar-modal ar-preflight-modal"
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
            <span className="preflight-kicker">ANTES DE ABRIR A CÂMERA</span>
            <h2>Ajude o celular a encontrar a mesa</h2>
            <p>
              A experiência usa o recurso AR disponível no próprio aparelho. Não é necessário
              imprimir marcador nem instalar um aplicativo.
            </p>

            <div className="preflight-steps">
              <div>
                <span>1</span>
                <p><strong>Aponte para a mesa</strong><small>Mantenha o celular a cerca de 40–60 cm da superfície.</small></p>
              </div>
              <div>
                <span>2</span>
                <p><strong>Mova devagar para os lados</strong><small>Isso ajuda o aparelho a reconhecer o plano onde o prato será colocado.</small></p>
              </div>
              <div>
                <span>3</span>
                <p><strong>Prefira uma superfície com textura</strong><small>Vidro e mesas totalmente brancas podem dificultar o rastreamento.</small></p>
              </div>
            </div>

            <div className="modal-measure">
              <span>Tamanho cadastrado</span>
              <strong>{product.realWidthCm} cm</strong>
            </div>

            {embedded && (
              <div className="modal-warning">
                Você parece estar no navegador interno de outro aplicativo. Para a câmera AR,
                abra este link diretamente no Chrome ou Safari.
              </div>
            )}

            {arSupported === false ? (
              <div className="ar-not-supported-box">
                <strong>Este aparelho não ofereceu um modo AR compatível.</strong>
                <span>Você pode continuar girando e aproximando o prato em 3D normalmente.</span>
                <button type="button" onClick={() => setGuideOpen(false)}>
                  Continuar em 3D
                </button>
              </div>
            ) : (
              <button type="button" className="open-camera-button" onClick={launchAR}>
                📷 Abrir câmera
              </button>
            )}

            <small className="compatibility-note">
              Android: Scene Viewer/WebXR quando disponível • iPhone: AR Quick Look • fallback: 3D no navegador
            </small>
          </section>
        </div>
      )}
    </>
  )
}
