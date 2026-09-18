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

type Props = {
  product: Product3D
}

type ArStatusEvent = CustomEvent<{
  status: ModelViewerArStatus
}>

export default function ProductViewer({
  product,
}: Props) {
  const viewerRef =
    useRef<ModelViewerElement | null>(null)

  const sourceKeyRef =
    useRef<string>('')

  const originalWidthRef =
    useRef<number | null>(null)

  const [ready, setReady] =
    useState(false)

  const [guideOpen, setGuideOpen] =
    useState(false)

  const [openingAr, setOpeningAr] =
    useState(false)

  const [status, setStatus] =
    useState(
      'Preparando visualização 3D…'
    )

  const applyScale =
    useCallback(() => {
      const viewer =
        viewerRef.current

      const originalWidth =
        originalWidthRef.current

      if (
        !viewer ||
        !originalWidth
      ) {
        return
      }

      const targetMeters =
        product.realWidthCm / 100

      const factor =
        targetMeters /
        originalWidth

      viewer.setAttribute(
        'scale',
        `${factor} ${factor} ${factor}`
      )

      viewer.updateFraming()

      console.info(
        '[Kivora AR] Produto preparado:',
        {
          id: product.id,
          targetWidthCm:
            product.realWidthCm,
          factor,
        }
      )
    }, [
      product.id,
      product.realWidthCm,
    ])

  useEffect(() => {
    const viewer =
      viewerRef.current

    if (!viewer) return

    setReady(false)
    setStatus(
      'Preparando visualização 3D…'
    )

    // Nova fonte = nova dimensão original.
    if (
      sourceKeyRef.current !==
      product.modelUrl
    ) {
      sourceKeyRef.current =
        product.modelUrl

      originalWidthRef.current =
        null
    }

    const prepare = () => {
      try {
        const dimensions =
          viewer.getDimensions()

        if (
          originalWidthRef.current ===
          null
        ) {
          const horizontal =
            Math.max(
              dimensions.x,
              dimensions.z
            )

          if (
            !Number.isFinite(
              horizontal
            ) ||
            horizontal <= 0
          ) {
            throw new Error(
              'Dimensões inválidas.'
            )
          }

          originalWidthRef.current =
            horizontal
        }

        applyScale()
        setReady(true)

        setStatus(
          `${product.shortName} pronto para visualizar em AR.`
        )
      } catch (error) {
        console.error(
          '[Kivora AR] Falha ao preparar modelo:',
          error
        )

        setStatus(
          'Não foi possível preparar este modelo 3D.'
        )
      }
    }

    const handleError = () => {
      setReady(false)

      setStatus(
        'Não foi possível carregar este modelo 3D.'
      )
    }

    const handleArStatus = (
      event: Event
    ) => {
      const arStatus =
        (event as ArStatusEvent)
          .detail
          .status

      if (
        arStatus ===
        'session-started'
      ) {
        setOpeningAr(false)
        setGuideOpen(false)
      }

      if (
        arStatus ===
        'object-placed'
      ) {
        setStatus(
          `${product.shortName} posicionado.`
        )
      }

      if (
        arStatus === 'failed'
      ) {
        setOpeningAr(false)

        setStatus(
          'Não foi possível abrir a câmera AR.'
        )
      }

      if (
        arStatus ===
        'not-presenting'
      ) {
        setOpeningAr(false)

        setStatus(
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

    // src muda dinamicamente entre produtos.
    viewer.setAttribute(
      'src',
      product.modelUrl
    )

    if (viewer.loaded) {
      // Pequeno delay permite que o novo src finalize
      // a atualização interna antes de medir.
      window.setTimeout(
        prepare,
        80
      )
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
    product,
    applyScale,
  ])

  const openCamera = () => {
    const viewer =
      viewerRef.current

    if (!viewer) return

    applyScale()

    if (
      !viewer.canActivateAR
    ) {
      setStatus(
        'Abra esta página no Chrome de um Android compatível com WebXR.'
      )

      return
    }

    setOpeningAr(true)

    void viewer
      .activateAR()
      .catch((error) => {
        console.error(
          '[Kivora AR] activateAR:',
          error
        )

        setOpeningAr(false)

        setStatus(
          'A câmera AR não pôde ser iniciada.'
        )
      })
  }

  return (
    <>
      <div className="viewer-frame">
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
          shadow-intensity="1.4"
          shadow-softness="0.9"
          environment-image="neutral"
          exposure="1.08"
          touch-action="pan-y"
          loading="eager"
          style={{
            width: '100%',
            height: '100%',
          }}
        />

        {!ready && (
          <div className="viewer-loading">
            <div className="loader-dot" />
            <span>
              Preparando {product.shortName}…
            </span>
          </div>
        )}

        <div className="viewer-topline">
          <span>
            Visualização 3D
          </span>

          <span className="measure-pill">
            ↔ {product.realWidthCm} cm
          </span>
        </div>

        <div className="viewer-bottom">
          <div className="viewer-hint">
            Arraste para girar
          </div>

          <button
            type="button"
            className="ar-button"
            onClick={() =>
              setGuideOpen(true)
            }
            disabled={!ready}
          >
            <span>⌖</span>
            Ver na minha mesa
          </button>
        </div>
      </div>

      <p className="status-line">
        {status}
      </p>

      {guideOpen && (
        <div
          className="modal-backdrop"
          onClick={() => {
            if (!openingAr) {
              setGuideOpen(false)
            }
          }}
        >
          <section
            className="ar-modal"
            role="dialog"
            aria-modal="true"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              className="modal-close"
              type="button"
              onClick={() =>
                setGuideOpen(false)
              }
              disabled={openingAr}
              aria-label="Fechar"
            >
              ×
            </button>

            <div className="modal-icon">
              {product.emoji}
            </div>

            <h2>
              Veja na sua mesa
            </h2>

            <p>
              Aponte para uma superfície bem iluminada e mova o celular
              lentamente. O produto será exibido em escala aproximada real.
            </p>

            <div className="modal-measure">
              <span>
                Tamanho configurado
              </span>

              <strong>
                {product.realWidthCm} cm
              </strong>
            </div>

            <button
              type="button"
              className="open-camera-button"
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
