import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  ModelViewerArStatus,
  ModelViewerArTracking,
  ModelViewerElement,
} from '../model-viewer'

const MODEL_URL =
  'https://cdn.jsdelivr.net/gh/mindset-code/burger-house-3d@c2bddc597efe4870326c843a6e056727752fc261/public/hamburger__food_big-hamburger.glb'

const TARGET_WIDTH_METERS = 0.15

type ArStatusEvent =
  CustomEvent<{ status: ModelViewerArStatus }>

type ArTrackingEvent =
  CustomEvent<{ status: ModelViewerArTracking }>

export default function BurgerWebXR() {
  const viewerRef = useRef<ModelViewerElement | null>(null)
  const normalizedRef = useRef(false)

  const [modelReady, setModelReady] = useState(false)
  const [canUseAr, setCanUseAr] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [openingAr, setOpeningAr] = useState(false)
  const [message, setMessage] = useState(
    'Carregando o hambúrguer 3D…'
  )

  const normalizeScale = useCallback(() => {
    const viewer = viewerRef.current

    if (!viewer || normalizedRef.current) {
      return
    }

    try {
      const dimensions = viewer.getDimensions()

      const horizontalSize =
        Math.max(
          dimensions.x,
          dimensions.z
        )

      if (
        !Number.isFinite(horizontalSize) ||
        horizontalSize <= 0
      ) {
        throw new Error(
          'Dimensões inválidas.'
        )
      }

      const factor =
        TARGET_WIDTH_METERS /
        horizontalSize

      viewer.setAttribute(
        'scale',
        `${factor} ${factor} ${factor}`
      )

      normalizedRef.current = true

      console.info(
        '[Kivora AR] Tamanho físico configurado:',
        {
          originalDimensions: dimensions,
          targetWidthMeters:
            TARGET_WIDTH_METERS,
          factor,
        }
      )
    } catch (error) {
      console.error(
        '[Kivora AR] Falha ao normalizar escala:',
        error
      )
    }
  }, [])

  const refreshArSupport = useCallback(() => {
    const viewer = viewerRef.current

    if (!viewer) {
      setCanUseAr(false)
      return
    }

    setCanUseAr(
      Boolean(viewer.canActivateAR)
    )
  }, [])

  useEffect(() => {
    const viewer = viewerRef.current

    if (!viewer) return

    const handleLoad = () => {
      setModelReady(true)

      normalizeScale()

      setMessage(
        'Modelo pronto. No celular, toque em “Ver na minha mesa”.'
      )

      requestAnimationFrame(
        refreshArSupport
      )

      window.setTimeout(
        refreshArSupport,
        350
      )

      window.setTimeout(
        refreshArSupport,
        1000
      )
    }

    const handleModelError = () => {
      setModelReady(false)
      setCanUseAr(false)

      setMessage(
        'Não foi possível carregar o hambúrguer 3D.'
      )

      console.error(
        '[Kivora AR] Erro ao carregar GLB.'
      )
    }

    const handleArStatus = (
      event: Event
    ) => {
      const status =
        (event as ArStatusEvent)
          .detail
          .status

      console.info(
        '[Kivora AR] ar-status:',
        status
      )

      if (
        status === 'session-started'
      ) {
        setOpeningAr(false)
        setGuideOpen(false)
      }

      if (
        status === 'object-placed'
      ) {
        setMessage(
          'Objeto posicionado com sucesso.'
        )
      }

      if (status === 'failed') {
        setOpeningAr(false)

        setMessage(
          'Não foi possível abrir o WebXR neste aparelho.'
        )
      }

      if (
        status === 'not-presenting'
      ) {
        setOpeningAr(false)

        if (modelReady) {
          setMessage(
            'AR encerrado. Você pode abrir novamente.'
          )
        }
      }
    }

    const handleArTracking = (
      event: Event
    ) => {
      const status =
        (event as ArTrackingEvent)
          .detail
          .status

      console.info(
        '[Kivora AR] ar-tracking:',
        status
      )
    }

    viewer.addEventListener(
      'load',
      handleLoad
    )

    viewer.addEventListener(
      'error',
      handleModelError
    )

    viewer.addEventListener(
      'ar-status',
      handleArStatus
    )

    viewer.addEventListener(
      'ar-tracking',
      handleArTracking
    )

    if (viewer.loaded) {
      handleLoad()
    }

    return () => {
      viewer.removeEventListener(
        'load',
        handleLoad
      )

      viewer.removeEventListener(
        'error',
        handleModelError
      )

      viewer.removeEventListener(
        'ar-status',
        handleArStatus
      )

      viewer.removeEventListener(
        'ar-tracking',
        handleArTracking
      )
    }
  }, [
    modelReady,
    normalizeScale,
    refreshArSupport,
  ])

  const openGuide = () => {
    refreshArSupport()

    if (!modelReady) {
      setMessage(
        'Aguarde o modelo terminar de carregar.'
      )
      return
    }

    setGuideOpen(true)
  }

  const openCamera = () => {
    const viewer = viewerRef.current

    if (!viewer) return

    if (!viewer.canActivateAR) {
      setCanUseAr(false)

      setMessage(
        'WebXR AR não está disponível neste navegador/aparelho.'
      )

      return
    }

    setOpeningAr(true)

    // A chamada é iniciada diretamente no clique do usuário.
    void viewer
      .activateAR()
      .catch((error) => {
        console.error(
          '[Kivora AR] activateAR falhou:',
          error
        )

        setOpeningAr(false)

        setMessage(
          'A câmera AR não pôde ser iniciada.'
        )
      })
  }

  return (
    <>
      <div className="viewer-shell">
        <model-viewer
          ref={(node) => {
            viewerRef.current =
              node as ModelViewerElement | null
          }}
          src={MODEL_URL}
          alt="X-Burguer em 3D"
          ar
          ar-modes="webxr"
          ar-placement="floor"
          ar-scale="fixed"
          camera-controls
          auto-rotate
          shadow-intensity="1.15"
          shadow-softness="0.85"
          environment-image="neutral"
          exposure="1.05"
          touch-action="pan-y"
          loading="eager"
          style={{
            width: '100%',
            height: '100%',
          }}
        />

        {!modelReady && (
          <div className="viewer-loading">
            Carregando hambúrguer 3D…
          </div>
        )}
      </div>

      <div className="ar-controls">
        <button
          type="button"
          className="open-ar-button"
          onClick={openGuide}
          disabled={!modelReady}
        >
          📷 Ver na minha mesa
        </button>

        <p className="ar-message">
          {message}
        </p>

        {modelReady && !canUseAr && (
          <p className="ar-device-note">
            No computador isso é esperado. O WebXR deve ser testado no Chrome
            de um Android compatível.
          </p>
        )}
      </div>

      {guideOpen && (
        <div
          className="guide-backdrop"
          role="presentation"
          onClick={() => {
            if (!openingAr) {
              setGuideOpen(false)
            }
          }}
        >
          <section
            className="camera-guide"
            role="dialog"
            aria-modal="true"
            aria-labelledby="camera-guide-title"
            onClick={(event) => {
              event.stopPropagation()
            }}
          >
            <button
              type="button"
              className="guide-close"
              onClick={() => {
                setGuideOpen(false)
              }}
              disabled={openingAr}
              aria-label="Fechar"
            >
              ×
            </button>

            <h2 id="camera-guide-title">
              Antes de abrir a câmera
            </h2>

            <p className="guide-intro">
              Para o AR reconhecer a superfície com mais facilidade:
            </p>

            <div className="guide-step">
              <span>1</span>
              <div>
                <strong>Aponte para a superfície</strong>
                <p>
                  Mantenha o aparelho a uma distância confortável da mesa.
                </p>
              </div>
            </div>

            <div className="guide-step">
              <span>2</span>
              <div>
                <strong>Mova o celular lentamente</strong>
                <p>
                  Faça pequenos movimentos laterais para o aparelho mapear o
                  ambiente.
                </p>
              </div>
            </div>

            <div className="guide-step">
              <span>3</span>
              <div>
                <strong>Prefira boa iluminação</strong>
                <p>
                  Superfícies com textura e contraste costumam ser reconhecidas
                  com mais facilidade.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="launch-camera-button"
              onClick={openCamera}
              disabled={openingAr}
            >
              {openingAr
                ? 'Abrindo câmera…'
                : 'Abrir câmera'}
            </button>
          </section>
        </div>
      )}
    </>
  )
}
