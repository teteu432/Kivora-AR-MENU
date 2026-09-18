import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type {
  ModelViewerArStatus,
  ModelViewerElement,
} from '../model-viewer'
import type { Product3D } from '../products'

type Props = {
  product: Product3D
}

type ArStatusEvent = CustomEvent<{
  status: ModelViewerArStatus
}>

function isCalibrationMode() {
  return new URLSearchParams(
    window.location.search
  ).get('calibrate') === '1'
}

export default function ProductWebXR({
  product,
}: Props) {
  const viewerRef =
    useRef<ModelViewerElement | null>(
      null
    )

  const originalDimensionsRef =
    useRef<{
      x: number
      y: number
      z: number
    } | null>(null)

  const [modelReady, setModelReady] =
    useState(false)

  const [guideOpen, setGuideOpen] =
    useState(false)

  const [openingAr, setOpeningAr] =
    useState(false)

  const [message, setMessage] =
    useState(
      'Carregando o produto 3D…'
    )

  const [overrideWidthCm, setOverrideWidthCm] =
    useState<number | null>(null)

  const calibrationMode =
    useMemo(
      () => isCalibrationMode(),
      []
    )

  const effectiveWidthCm =
    overrideWidthCm ??
    product.realWidthCm

  const [predictedHeightCm, setPredictedHeightCm] =
    useState<number | null>(
      null
    )

  const applyAbsoluteScale =
    useCallback(
      (widthCm: number) => {
        const viewer =
          viewerRef.current

        const original =
          originalDimensionsRef.current

        if (!viewer || !original) {
          return
        }

        const horizontal =
          Math.max(
            original.x,
            original.z
          )

        if (
          !Number.isFinite(
            horizontal
          ) ||
          horizontal <= 0
        ) {
          return
        }

        const targetWidthM =
          widthCm / 100

        const factor =
          targetWidthM /
          horizontal

        viewer.setAttribute(
          'scale',
          `${factor} ${factor} ${factor}`
        )

        viewer.updateFraming()

        const predictedHeight =
          original.y *
          factor *
          100

        setPredictedHeightCm(
          predictedHeight
        )

        console.info(
          '[Kivora AR] Escala de produto:',
          {
            productId:
              product.id,
            originalDimensions:
              original,
            targetWidthCm:
              widthCm,
            predictedHeightCm:
              predictedHeight,
            factor,
          }
        )
      },
      [product.id]
    )

  useEffect(() => {
    const viewer =
      viewerRef.current

    if (!viewer) return

    const prepare = () => {
      try {
        if (
          originalDimensionsRef
            .current === null
        ) {
          const dimensions =
            viewer.getDimensions()

          originalDimensionsRef
            .current = {
              x: dimensions.x,
              y: dimensions.y,
              z: dimensions.z,
            }
        }

        setModelReady(true)

        applyAbsoluteScale(
          effectiveWidthCm
        )

        setMessage(
          `Produto configurado para ${effectiveWidthCm
            .toFixed(1)
            .replace('.', ',')} cm de largura.`
        )
      } catch (error) {
        console.error(
          '[Kivora AR] Erro ao preparar produto:',
          error
        )

        setMessage(
          'Não foi possível preparar o modelo 3D.'
        )
      }
    }

    const handleError = () => {
      setModelReady(false)

      setMessage(
        'Não foi possível carregar o modelo 3D.'
      )
    }

    const handleArStatus = (
      event: Event
    ) => {
      const status =
        (event as ArStatusEvent)
          .detail
          .status

      if (
        status ===
        'session-started'
      ) {
        setOpeningAr(false)
        setGuideOpen(false)
      }

      if (
        status ===
        'object-placed'
      ) {
        setMessage(
          'Produto posicionado.'
        )
      }

      if (
        status === 'failed'
      ) {
        setOpeningAr(false)

        setMessage(
          'Não foi possível iniciar a câmera AR.'
        )
      }

      if (
        status ===
        'not-presenting'
      ) {
        setOpeningAr(false)

        setMessage(
          'AR encerrado.'
        )
      }
    }

    viewer.addEventListener(
      'load',
      prepare
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
      prepare()
    }

    return () => {
      viewer.removeEventListener(
        'load',
        prepare
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
    applyAbsoluteScale,
    effectiveWidthCm,
  ])

  useEffect(() => {
    if (
      modelReady &&
      originalDimensionsRef.current
    ) {
      applyAbsoluteScale(
        effectiveWidthCm
      )
    }
  }, [
    effectiveWidthCm,
    modelReady,
    applyAbsoluteScale,
  ])

  const openCamera = () => {
    const viewer =
      viewerRef.current

    if (!viewer) return

    applyAbsoluteScale(
      effectiveWidthCm
    )

    if (
      !viewer.canActivateAR
    ) {
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

  const heightDifferencePercent =
    predictedHeightCm === null
      ? null
      : Math.abs(
          predictedHeightCm -
            product.realHeightCm
        ) /
        product.realHeightCm *
        100

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
          src={product.modelUrl}
          alt={`${product.name} em 3D`}
          ar
          ar-modes="webxr"
          ar-placement="floor"
          ar-scale="fixed"
          camera-controls
          auto-rotate
          shadow-intensity="1.45"
          shadow-softness="0.9"
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
            Carregando produto 3D…
          </div>
        )}
      </div>

      <div className="ar-controls">
        <button
          type="button"
          className="open-ar-button"
          onClick={() =>
            setGuideOpen(true)
          }
          disabled={!modelReady}
        >
          📷 Ver na minha mesa
        </button>

        <p className="ar-message">
          {message}
        </p>
      </div>

      {calibrationMode && (
        <aside className="developer-panel">
          <div className="developer-title">
            <div>
              <span>
                MODO DE CALIBRAÇÃO
              </span>

              <strong>
                Medidas do produto
              </strong>
            </div>

            <output>
              {effectiveWidthCm
                .toFixed(1)
                .replace('.', ',')} cm
            </output>
          </div>

          <label>
            Largura de teste
            <input
              type="range"
              min="8"
              max="22"
              step="0.5"
              value={
                effectiveWidthCm
              }
              onChange={(event) =>
                setOverrideWidthCm(
                  Number(
                    event.target
                      .value
                  )
                )
              }
            />
          </label>

          <div className="measurements">
            <span>
              Cadastro:
              <strong>
                {' '}
                {product.realWidthCm} ×{' '}
                {product.realHeightCm} cm
              </strong>
            </span>

            {predictedHeightCm !== null && (
              <span>
                Altura prevista do GLB:
                <strong>
                  {' '}
                  {predictedHeightCm
                    .toFixed(1)
                    .replace(
                      '.',
                      ','
                    )}{' '}
                  cm
                </strong>
              </span>
            )}
          </div>

          {heightDifferencePercent !== null &&
            heightDifferencePercent >
              20 && (
              <div className="proportion-warning">
                ⚠ A proporção do GLB não
                combina bem com as medidas
                reais. Ajustar apenas a escala
                não resolverá largura e altura
                ao mesmo tempo. O modelo 3D
                precisa ser corrigido.
              </div>
            )}

          <button
            type="button"
            className="reset-calibration"
            onClick={() =>
              setOverrideWidthCm(
                null
              )
            }
          >
            Usar medida cadastrada
          </button>
        </aside>
      )}

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
              Ver na minha mesa
            </h2>

            <p>
              O produto será aberto com
              aproximadamente{' '}
              <strong>
                {effectiveWidthCm
                  .toFixed(1)
                  .replace('.', ',')}{' '}
                cm
              </strong>{' '}
              de largura.
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
