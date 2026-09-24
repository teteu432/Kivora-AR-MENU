import { useCallback, useEffect, useRef, useState } from 'react'
import type { ModelViewerElement } from '../model-viewer'
import type { Product3D } from '../products'
import { startStableAR, type StableARSession } from '../ar/startStableAR'

type Props = {
  product: Product3D
}

function isEmbeddedBrowser() {
  const ua = navigator.userAgent || ''
  return /Instagram|FBAN|FBAV|Line\/|wv\)/i.test(ua)
}

async function browserSupportsImmersiveAR() {
  const xr = (navigator as Navigator & { xr?: any }).xr
  if (!xr?.isSessionSupported) return false

  try {
    return Boolean(await xr.isSessionSupported('immersive-ar'))
  } catch {
    return false
  }
}

export default function ProductViewer({ product }: Props) {
  const viewerRef = useRef<ModelViewerElement | null>(null)
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const stableSessionRef = useRef<StableARSession | null>(null)
  const sourceKeyRef = useRef('')
  const originalWidthRef = useRef<number | null>(null)

  const [ready, setReady] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [nativeARSupported, setNativeARSupported] = useState<boolean | null>(null)
  const [stableARSupported, setStableARSupported] = useState<boolean | null>(null)
  const [launchError, setLaunchError] = useState<string | null>(null)
  const [status, setStatus] = useState('Preparando visualização 3D…')
  const [xrActive, setXrActive] = useState(false)
  const [xrPlaced, setXrPlaced] = useState(false)
  const [anchorMode, setAnchorMode] = useState<'anchor' | 'fixed-pose' | null>(null)
  const [xrStatus, setXrStatus] = useState('Preparando AR estável…')

  const applyPreviewScale = useCallback(() => {
    const viewer = viewerRef.current
    const originalWidth = originalWidthRef.current

    if (!viewer || !originalWidth) return

    // Preview e Quick Look usam a medida física declarada, sem a antiga
    // compensação visual que tornava o hambúrguer grande demais.
    const targetMeters = product.realWidthCm / 100
    const factor = targetMeters / originalWidth

    viewer.setAttribute('scale', `${factor} ${factor} ${factor}`)
    viewer.updateFraming()
  }, [product.realWidthCm])

  const refreshNativeARSupport = useCallback(() => {
    const viewer = viewerRef.current
    if (!viewer) return
    setNativeARSupported(Boolean(viewer.canActivateAR))
  }, [])

  useEffect(() => {
    let alive = true

    void browserSupportsImmersiveAR().then((supported) => {
      if (alive) setStableARSupported(supported)
    })

    return () => {
      alive = false
    }
  }, [product.id])

  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) return

    setReady(false)
    setNativeARSupported(null)
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

        applyPreviewScale()
        setReady(true)
        setStatus(`${product.shortName} pronto para visualizar.`)

        window.setTimeout(refreshNativeARSupport, 120)
        window.setTimeout(refreshNativeARSupport, 700)
      } catch (error) {
        console.error('[Kivora AR] Falha ao preparar modelo:', error)
        setStatus('Não foi possível preparar este modelo 3D.')
      }
    }

    const handleError = () => {
      setReady(false)
      setNativeARSupported(false)
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
  }, [product, applyPreviewScale, refreshNativeARSupport])

  useEffect(() => {
    return () => {
      const session = stableSessionRef.current
      stableSessionRef.current = null
      if (session) void session.end().catch(() => undefined)
    }
  }, [])

  const openGuide = () => {
    setLaunchError(null)
    refreshNativeARSupport()
    setGuideOpen(true)
  }

  const launchNativeFallback = () => {
    const viewer = viewerRef.current
    if (!viewer) return

    setLaunchError(null)
    const activation = viewer.activateAR()
    setGuideOpen(false)

    void activation.catch((error) => {
      console.error('[Kivora AR] Não foi possível abrir AR nativo:', error)
      setLaunchError('O modo AR não abriu neste aparelho. Continue usando a visualização 3D.')
    })
  }

  const launchAR = () => {
    const overlay = overlayRef.current

    setLaunchError(null)

    if (stableARSupported && overlay) {
      // Deixa o DOM overlay visível imediatamente; requestSession é chamado
      // dentro do mesmo gesto do usuário em startStableAR().
      overlay.classList.add('active')
      setGuideOpen(false)
      setXrActive(true)
      setXrPlaced(false)
      setAnchorMode(null)
      setXrStatus('Abrindo câmera…')

      const startPromise = startStableAR(product, overlay, {
        onStatus: setXrStatus,
        onSessionStart: () => setXrActive(true),
        onPlaced: setXrPlaced,
        onAnchorMode: setAnchorMode,
        onSessionEnd: () => {
          stableSessionRef.current = null
          overlay.classList.remove('active')
          setXrActive(false)
          setXrPlaced(false)
          setAnchorMode(null)
        },
      })

      void startPromise
        .then((session) => {
          stableSessionRef.current = session
        })
        .catch((error) => {
          console.error('[Kivora AR] Falha no AR estável:', error)
          overlay.classList.remove('active')
          setXrActive(false)
          setLaunchError(
            'Não foi possível iniciar o AR estável. Se houver um modo AR nativo no aparelho, tente novamente pelo fallback.'
          )
        })

      return
    }

    launchNativeFallback()
  }

  const closeStableAR = () => {
    const session = stableSessionRef.current
    if (session) {
      void session.end().catch(() => undefined)
    }
  }

  const repositionStableAR = () => {
    stableSessionRef.current?.reposition()
  }

  const embedded = typeof navigator !== 'undefined' && isEmbeddedBrowser()
  const anyARSupported = stableARSupported === true || nativeARSupported === true

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
          // O WebXR do model-viewer foi removido daqui de propósito.
          // No Android usamos nosso AR ancorado; Scene Viewer só entra como fallback
          // para modelos cujo GLB já está em escala física nativa.
          ar-modes={product.nativeScaleReady ? 'scene-viewer quick-look' : 'quick-look'}
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
        {ready && stableARSupported === false && nativeARSupported === false &&
          ' • AR indisponível neste aparelho; modo 3D continua disponível.'}
      </p>

      {launchError && (
        <div className="ar-fallback-message" role="status">
          <strong>AR indisponível</strong>
          <span>{launchError}</span>
          {nativeARSupported && (
            <button type="button" className="fallback-ar-button" onClick={launchNativeFallback}>
              Tentar AR nativo
            </button>
          )}
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
            <span className="preflight-kicker">AR ESTÁVEL • V4</span>
            <h2>Fixe o prato na mesa antes de caminhar ao redor</h2>
            <p>
              Agora o alimento não acompanha a câmera. Primeiro encontramos a mesa, depois você
              toca para fixá-lo em uma coordenada do ambiente.
            </p>

            <div className="preflight-steps">
              <div>
                <span>1</span>
                <p><strong>Encontre a mesa</strong><small>Mova o celular devagar até o círculo ficar verde.</small></p>
              </div>
              <div>
                <span>2</span>
                <p><strong>Toque para fixar</strong><small>Depois desse toque, posição e tamanho deixam de seguir a câmera.</small></p>
              </div>
              <div>
                <span>3</span>
                <p><strong>Caminhe para os lados</strong><small>O ângulo muda pela sua posição física; o alimento deve permanecer no mesmo ponto.</small></p>
              </div>
            </div>

            <div className="modal-measure">
              <span>Largura física travada</span>
              <strong>{product.realWidthCm} cm</strong>
            </div>

            {embedded && (
              <div className="modal-warning">
                Abra este link diretamente no Chrome ou Safari. Navegadores internos de redes sociais
                costumam limitar WebXR.
              </div>
            )}

            {!anyARSupported && stableARSupported !== null && nativeARSupported !== null ? (
              <div className="ar-not-supported-box">
                <strong>Este aparelho não ofereceu um modo AR compatível.</strong>
                <span>Você pode continuar usando o modelo 3D normalmente.</span>
                <button type="button" onClick={() => setGuideOpen(false)}>
                  Continuar em 3D
                </button>
              </div>
            ) : (
              <button type="button" className="open-camera-button" onClick={launchAR}>
                📷 Abrir câmera e fixar na mesa
              </button>
            )}

            <small className="compatibility-note">
              Prioridade: WebXR ancorado • fallback: Scene Viewer/Quick Look quando disponível
            </small>
          </section>
        </div>
      )}

      <div ref={overlayRef} className={`xr-dom-overlay${xrActive ? ' active' : ''}`}>
        <div className="xr-top-status">
          <strong>{xrPlaced ? '✓ Produto fixado' : 'Localizando a mesa'}</strong>
          <span>{xrStatus}</span>
          <small>
            {xrPlaced
              ? anchorMode === 'anchor'
                ? 'Âncora espacial ativa • escala fixa'
                : 'Pose fixa ativa • escala fixa'
              : `Referência: ${product.realWidthCm} cm`}
          </small>
        </div>

        {xrPlaced && (
          <button type="button" className="xr-reposition-button" onClick={repositionStableAR}>
            ↺ Reposicionar
          </button>
        )}

        <button type="button" className="xr-close-button" onClick={closeStableAR} aria-label="Fechar AR">
          ×
        </button>
      </div>
    </>
  )
}
