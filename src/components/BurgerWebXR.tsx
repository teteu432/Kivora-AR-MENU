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

const MODEL_URL =
  'https://cdn.jsdelivr.net/gh/mindset-code/burger-house-3d@c2bddc597efe4870326c843a6e056727752fc261/public/hamburger__food_big-hamburger.glb'

const STORAGE_KEY =
  'kivora-ar-burger-width-cm-v082'

const DEFAULT_WIDTH_CM = 13

const PRESETS = [11, 13, 15, 17]

type ArStatusEvent =
  CustomEvent<{
    status: ModelViewerArStatus
  }>

function readSavedWidth() {
  try {
    const value = Number(
      window.localStorage.getItem(
        STORAGE_KEY
      )
    )

    if (
      Number.isFinite(value) &&
      value >= 8 &&
      value <= 22
    ) {
      return value
    }
  } catch {
    // localStorage indisponível.
  }

  return DEFAULT_WIDTH_CM
}

export default function BurgerWebXR() {
  const viewerRef =
    useRef<ModelViewerElement | null>(
      null
    )

  // CRÍTICO:
  // esta medida é capturada UMA ÚNICA VEZ,
  // antes de qualquer scale ser aplicado.
  const originalHorizontalSizeRef =
    useRef<number | null>(null)

  const widthCmRef =
    useRef(readSavedWidth())

  const [widthCm, setWidthCm] =
    useState(widthCmRef.current)

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

  const [rawWidthMeters, setRawWidthMeters] =
    useState<number | null>(null)

  const [message, setMessage] =
    useState(
      'Carregando o hambúrguer 3D…'
    )

  const applyScale =
    useCallback(
      (targetWidthCm: number) => {
        const viewer =
          viewerRef.current

        const originalWidth =
          originalHorizontalSizeRef.current

        if (
          !viewer ||
          !originalWidth
        ) {
          return
        }

        const targetMeters =
          targetWidthCm / 100

        const factor =
          targetMeters /
          originalWidth

        const scale =
          `${factor} ${factor} ${factor}`

        viewer.setAttribute(
          'scale',
          scale
        )

        // Quando scale muda após o load, atualizamos
        // o enquadramento do preview 3D.
        viewer.updateFraming()

        console.info(
          '[Kivora AR] Escala absoluta aplicada:',
          {
            originalWidthMeters:
              originalWidth,
            targetWidthCm,
            targetMeters,
            factor,
          }
        )
      },
      []
    )

  const refreshArSupport =
    useCallback(() => {
      setCanUseAr(
        Boolean(
          viewerRef.current
            ?.canActivateAR
        )
      )
    }, [])

  // Registra listeners UMA ÚNICA VEZ.
  // Não depende de widthCm/modelReady.
  useEffect(() => {
    const viewer =
      viewerRef.current

    if (!viewer) return

    const prepareModel = () => {
      try {
        // Captura a referência original apenas uma vez.
        if (
          originalHorizontalSizeRef
            .current === null
        ) {
          const dimensions =
            viewer.getDimensions()

          const originalWidth =
            Math.max(
              dimensions.x,
              dimensions.z
            )

          if (
            !Number.isFinite(
              originalWidth
            ) ||
            originalWidth <= 0
          ) {
            throw new Error(
              'Dimensões originais inválidas.'
            )
          }

          originalHorizontalSizeRef
            .current =
            originalWidth

          setRawWidthMeters(
            originalWidth
          )

          console.info(
            '[Kivora AR] Dimensão original congelada:',
            {
              dimensions,
              originalWidth,
            }
          )
        }

        setModelReady(true)

        applyScale(
          widthCmRef.current
        )

        setMessage(
          `Modelo pronto. Largura alvo: ${widthCmRef.current.toFixed(1).replace('.', ',')} cm.`
        )

        requestAnimationFrame(
          refreshArSupport
        )

        window.setTimeout(
          refreshArSupport,
          400
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
          'Não foi possível preparar a escala física do modelo.'
        )
      }
    }

    const handleError = () => {
      setModelReady(false)

      setMessage(
        'Não foi possível carregar o hambúrguer 3D.'
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
          `Objeto posicionado com largura alvo de ${widthCmRef.current.toFixed(1).replace('.', ',')} cm.`
        )
      }

      if (
        status === 'failed'
      ) {
        setOpeningAr(false)
        setArActive(false)

        setMessage(
          'Não foi possível iniciar o WebXR.'
        )
      }

      if (
        status ===
        'not-presenting'
      ) {
        setOpeningAr(false)
        setArActive(false)

        setMessage(
          `AR encerrado. Calibração atual: ${widthCmRef.current.toFixed(1).replace('.', ',')} cm.`
        )
      }
    }

    viewer.addEventListener(
      'load',
      prepareModel
    )

    viewer.addEventListener(
      'error',
      handleError
    )

    viewer.addEventListener(
      'ar-status',
      handleArStatus
    )

    if (viewer.loaded) {
      prepareModel()
    }

    return () => {
      viewer.removeEventListener(
        'load',
        prepareModel
      )

      viewer.removeEventListener(
        'error',
        handleError
      )

      viewer.removeEventListener(
        'ar-status',
        handleArStatus
      )
    }
  }, [
    applyScale,
    refreshArSupport,
  ])

  const setCalibration = (
    value: number
  ) => {
    if (arActive) {
      return
    }

    const normalized =
      Math.round(
        Math.min(
          22,
          Math.max(8, value)
        ) * 2
      ) / 2

    widthCmRef.current =
      normalized

    setWidthCm(
      normalized
    )

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        String(normalized)
      )
    } catch {
      // Sem persistência.
    }

    if (modelReady) {
      applyScale(
        normalized
      )

      setMessage(
        `Largura atualizada para ${normalized.toFixed(1).replace('.', ',')} cm.`
      )
    }
  }

  const openGuide = () => {
    refreshArSupport()

    if (!modelReady) {
      return
    }

    setGuideOpen(true)
  }

  const openCamera = () => {
    const viewer =
      viewerRef.current

    if (!viewer) return

    // Reaplica a escala absoluta imediatamente
    // antes de iniciar a sessão.
    applyScale(
      widthCmRef.current
    )

    if (
      !viewer.canActivateAR
    ) {
      setCanUseAr(false)

      setMessage(
        'WebXR AR não está disponível neste aparelho.'
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
          disabled={!modelReady}
        >
          📷 Ver na minha mesa
        </button>

        <p className="ar-message">
          {message}
        </p>
      </div>

      <aside className="calibration-panel">
        <div className="calibration-heading">
          <div>
            <span className="calibration-kicker">
              CALIBRAÇÃO ESTÁVEL
            </span>

            <strong>
              Largura real
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
                  setCalibration(
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
          <span>8</span>

          <input
            type="range"
            min="8"
            max="22"
            step="0.5"
            value={widthCm}
            disabled={arActive}
            onChange={(event) =>
              setCalibration(
                Number(
                  event.target.value
                )
              )
            }
          />

          <span>22 cm</span>
        </label>

        {rawWidthMeters !== null && (
          <p className="technical-size">
            Referência original congelada: {rawWidthMeters.toFixed(4)} m
          </p>
        )}
      </aside>

      {guideOpen && (
        <div
          className="guide-backdrop"
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
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              className="guide-close"
              onClick={() =>
                setGuideOpen(false)
              }
              disabled={openingAr}
            >
              ×
            </button>

            <h2>
              Calibração: {widthCm.toFixed(1).replace('.', ',')} cm
            </h2>

            <p className="guide-intro">
              Esta versão usa sempre a dimensão original do GLB como referência.
              Alterar o valor não acumula escala.
            </p>

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
