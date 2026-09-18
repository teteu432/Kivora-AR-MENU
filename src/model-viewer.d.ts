import type {
  CSSProperties,
  DetailedHTMLProps,
  HTMLAttributes,
} from 'react'

export type ModelDimensions = {
  x: number
  y: number
  z: number
}

export type ModelViewerElement = HTMLElement & {
  loaded: boolean
  getDimensions: () => ModelDimensions
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': DetailedHTMLProps<
        HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        src?: string
        alt?: string
        ar?: boolean
        'ar-modes'?: string
        'ar-placement'?: 'floor' | 'wall'
        'ar-scale'?: 'auto' | 'fixed'
        'camera-controls'?: boolean
        'auto-rotate'?: boolean
        'shadow-intensity'?: string
        'shadow-softness'?: string
        'environment-image'?: string
        exposure?: string
        scale?: string
        'touch-action'?: string
        loading?: 'auto' | 'lazy' | 'eager'
        style?: CSSProperties
      }
    }
  }
}

export {}
