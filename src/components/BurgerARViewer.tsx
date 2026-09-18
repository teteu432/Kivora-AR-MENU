import { useCallback, useEffect, useRef, useState } from 'react'
import type { ModelViewerElement } from '../model-viewer'

const MODEL_URL =
  'https://cdn.jsdelivr.net/gh/mindset-code/burger-house-3d@c2bddc597efe4870326c843a6e056727752fc261/public/hamburger__food_big-hamburger.glb'

const TARGET_WIDTH_METERS = 0.15

export default function BurgerARViewer() {
  const modelRef = useRef<ModelViewerElement | null>(null)

  const [modelReady, setModelReady] = useState(false)
  const [scaleReady, setScaleReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const normalizePhysicalScale = useCallback(() => {
    const element = modelRef.current
    if (!element) return

    try {
      const dimensions = element.getDimensions()

      const horizontalSize =
        Math.max(dimensions.x, dimensions.z)

      if (
        !Number.isFinite(horizontalSize) ||
        horizontalSize <= 0
      ) {
        throw new Error(
          'O modelo retornou dimensões inválidas.'
        )
      }

      const factor =
        TARGET_WIDTH_METERS / horizontalSize

      const scale =
        `${factor} ${factor} ${factor}`

      element.setAttribute('scale', scale)

      setScaleReady(true)

      console.info(
        '[Kivora AR] Dimensões originais:',
        dimensions,
        'Escala aplicada:',
        scale
      )
    } catch (cause) {
      console.error(
        '[Kivora AR] Falha ao normalizar escala:',
        cause
      )

      setError(
        'O modelo carregou, mas não foi possível ajustar o tamanho físico.'
      )
    }
  }, [])

  useEffect(() => {
    const element = modelRef.current
    if (!element) return

    const handleLoad = () => {
      setModelReady(true)
      setError(null)
      normalizePhysicalScale()
    }

    const handleError = () => {
      console.error(
        '[Kivora AR] Falha ao carregar o GLB.'
      )

      setModelReady(false)
      setError(
        'Não foi possível carregar o hambúrguer 3D.'
      )
    }

    element.addEventListener('load', handleLoad)
    element.addEventListener('error', handleError)

    if (element.loaded) {
      handleLoad()
    }

    return () => {
      element.removeEventListener(
        'load',
        handleLoad
      )

      element.removeEventListener(
        'error',
        handleError
      )
    }
  }, [normalizePhysicalScale])

  return (
    <div className="viewer-shell">
      <model-viewer
        ref={(node) => {
          modelRef.current =
            node as ModelViewerElement | null
        }}
        src={MODEL_URL}
        alt="X-Burguer em 3D"
        ar
        ar-modes="scene-viewer webxr quick-look"
        ar-placement="floor"
        ar-scale="fixed"
        camera-controls
        auto-rotate
        shadow-intensity="1.2"
        shadow-softness="0.8"
        environment-image="neutral"
        exposure="1.05"
        touch-action="pan-y"
        loading="eager"
        style={{
          width: '100%',
          height: '100%',
        }}
      >
        <button
          slot="ar-button"
          className="native-ar-button"
          type="button"
          disabled={!modelReady || !scaleReady}
        >
          📷 Ver na minha mesa
        </button>
      </model-viewer>

      {!modelReady && !error && (
        <div className="viewer-state">
          Carregando hambúrguer 3D…
        </div>
      )}

      {error && (
        <div className="viewer-state viewer-error">
          {error}
        </div>
      )}

      {modelReady && !scaleReady && !error && (
        <div className="viewer-state">
          Ajustando tamanho real…
        </div>
      )}
    </div>
  )
}
