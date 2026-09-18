import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type {
  ModelViewerArStatus,
  ModelViewerArTracking,
  ModelViewerElement,
} from '../model-viewer'

const MODEL_URL =
  'https://cdn.jsdelivr.net/gh/mindset-code/burger-house-3d@c2bddc597efe4870326c843a6e056727752fc261/public/hamburger__food_big-hamburger.glb'

const STORAGE_KEY =
  'kivora-ar-burger-width-cm'

const DEFAULT_WIDTH_CM = 13

const PRESETS = [11, 13, 15, 17]

type ArStatusEvent =
  CustomEvent<{ status: ModelViewerArStatus }>

type ArTrackingEvent =
  CustomEvent<{ status: ModelViewerArTracking }>

function readSavedWidth() {
  try {
    const raw =
      window.localStorage.getItem(
        STORAGE_KEY
      )

    const value =
      Number(raw)

    if (
      Number.isFinite(value) &&
      value >= 8 &&
      value <= 22
    ) {
      return value
    }
  } catch {
    // localStorage pode estar bloqueado.
  }

  return DEFAULT_WIDTH_CM
}

export default function BurgerWebXR() {
  const viewerRef =
    useRef<ModelViewerElement | null>(null)

  const baseHorizontalSizeRef =
    useRef<number | null>(null)

  const [modelReady, setModelReady] =
    useState(false)

  const [canUseAr, setCanUseAr] =
    useState(false)

  const [guideOpen, setGuideOpen] =
    useState(false)

  const [openingAr, setOpeningAr] =
    useState(false)

  const [arActive, setArActive] =
    useState(false)

  const [widthCm, setWidthCm] =
    useState<number>(() =>
      readSavedWidth()
    )

  const [message, setMessage] =
    useState(
      'Carregando o hambúrguer 3D…'
    )

  const widthMeters =
    useMemo(
      () => widthCm / 100,
      [widthCm]
    )

  const applyPhysicalScale =
    useCallback(
      (targetMeters: number) => {
        const viewer =
          viewerRef.current

        const baseHorizontal =
          baseHorizontalSizeRef.current

        if (
          !viewer ||
          !baseHorizontal
        ) {
          return
        }

        const factor =
          targetMeters /
          baseHorizontal

        const scale =
          `${factor} ${factor} ${factor}`

        viewer.setAttribute(
          'scale',
          scale
        )

        console.info(
          '[Kivora AR] Escala atualizada:',
          {
            targetMeters,
            baseHorizontal,
            factor,
            scale,
          }
        )
      },
      []
    )

  const refreshArSupport =
    useCallback(() => {
      const viewer =
        viewerRef.current

      setCanUseAr(
        Boolean(
          viewer?.canActivateAR
        )
      )
    }, [])

  const saveWidth =
    useCallback(
      (next: number) => {
        setWidthCm(next)

        try {
          window.localStorage.setItem(
            STORAGE_KEY,
            String(next)
          )
        } catch {
          // Sem persistência.
        }
      },
      []
    )

  useEffect(() => {
    if (
      modelReady &&
      baseHorizontalSizeRef.current
    ) {
      applyPhysicalScale(
        widthMeters
      )
    }
  }, [
    widthMeters,
    modelReady,
    applyPhysicalScale,
  ])

  useEffect(() => {
    const viewer =
      viewerRef.current

    if (!viewer) return

    const handleLoad = () => {
      try {
        const dimensions =
          viewer.getDimensions()

        const baseHorizontal =
          Math.max(
            dimensions.x,
            dimensions.z
          )

        if (
          !Number.isFinite(
            baseHorizontal
          ) ||
          baseHorizontal <= 0
        ) {
          throw new Error(
            'Dimensões inválidas.'
          )
        }

        baseHorizontalSizeRef.current =
          baseHorizontal

        setModelReady(true)

        applyPhysicalScale(
          widthCm / 100
        )

        setMessage(
          `Modelo pronto. Tamanho configurado: ${widthCm.toFixed(1).replace('.', ',')} cm.`
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
      } catch (error) {
        console.error(
          '[Kivora AR] Falha ao preparar modelo:',
          error
        )

        setMessage(
          'O modelo carregou, mas não foi possível calcular o tamanho físico.'
        )
      }
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
        status ===
        'session-started'
      ) {
        setOpeningAr(false)
        setGuideOpen(false)
        setArActive(true)
      }

      if (
        status ===
        'object-placed'
      ) {
        setMessage(
          `Hambúrguer posicionado com largura calibrada em ${widthCm.toFixed(1).replace('.', ',')} cm.`
        )
      }

      if (
        status === 'failed'
      ) {
        setOpeningAr(false)
        setArActive(false)

        setMessage(
          'Não foi possível abrir o WebXR neste aparelho.'
        )
      }

      if (
        status ===
        'not-presenting'
      ) {
        setOpeningAr(false)
        setArActive(false)

        if (modelReady) {
          setMessage(
            `AR encerrado. Calibração atual: ${widthCm.toFixed(1).replace('.', ',')} cm.`
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
    widthCm,
    modelReady,
    applyPhysicalScale,
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
    const viewer =
      viewerRef.current

    if (!viewer) return

    if (
      !viewer.canActivateAR
    ) {
      setCanUseAr(false)

      setMessage(
        'WebXR AR não está disponível neste navegador/aparelho.'
      )

      return
    }

    setOpeningAr(true)

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

  const updateWidth = (
    next: number
  ) => {
    if (arActive) return

    const clamped =
      Math.min(
        22,
        Math.max(8, next)
      )

    const rounded =
      Math.round(
        clamped * 2
      ) / 2

    saveWidth(rounded)
  }

  return (
    <>
      <div className="viewer-shell">
        <model-viewer
          ref={(node) => {
            viewerRef.current =
              node as
                ModelViewerElement |
                null
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
          disabled={
            !modelReady
          }
        >
          📷 Ver na minha mesa
        </button>

        <p className="ar-message">
          {message}
        </p>

        {modelReady &&
          !canUseAr && (
            <p className="ar-device-note">
              No computador isso é esperado. Teste o AR em um Android
              compatível.
            </p>
          )}
      </div>

      <aside className="calibration-panel">
        <div className="calibration-heading">
          <div>
            <span className="calibration-kicker">
              CALIBRAÇÃO
            </span>

            <strong>
              Tamanho real
            </strong>
          </div>

          <output>
            {widthCm
              .toFixed(1)
              .replace('.', ',')} cm
          </output>
        </div>

        <div className="preset-row">
          {PRESETS.map(
            (preset) => (
              <button
                key={preset}
                type="button"
                className={
                  widthCm === preset
                    ? 'preset active'
                    : 'preset'
                }
                onClick={() =>
                  updateWidth(
                    preset
                  )
                }
                disabled={arActive}
              >
                {preset} cm
              </button>
            )
          )}
        </div>

        <label className="slider-row">
          <span>8 cm</span>

          <input
            type="range"
            min="8"
            max="22"
            step="0.5"
            value={widthCm}
            onChange={(event) =>
              updateWidth(
                Number(
                  event.target.value
                )
              )
            }
            disabled={arActive}
          />

          <span>22 cm</span>
        </label>

        <p className="calibration-help">
          Meça a maior largura do lanche real e use o mesmo valor aqui.
          O tamanho fica bloqueado durante o AR.
        </p>
      </aside>

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
              Tamanho calibrado em {widthCm.toFixed(1).replace('.', ',')} cm
            </h2>

            <p className="guide-intro">
              Agora abra a câmera e compare o lanche com objetos reais da
              mesa.
            </p>

            <div className="guide-step">
              <span>1</span>
              <div>
                <strong>Use uma referência real</strong>
                <p>
                  Uma régua ou fita métrica ajuda a confirmar se a largura
                  visual está correta.
                </p>
              </div>
            </div>

            <div className="guide-step">
              <span>2</span>
              <div>
                <strong>Posicione na mesa</strong>
                <p>
                  Aguarde o rastreamento ficar estável antes de avaliar o
                  tamanho.
                </p>
              </div>
            </div>

            <div className="guide-step">
              <span>3</span>
              <div>
                <strong>Ajuste depois de sair</strong>
                <p>
                  Se parecer pequeno ou grande, saia do AR e altere em passos
                  de 0,5 cm.
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
