import type {
  CSSProperties,
  DetailedHTMLProps,
  HTMLAttributes,
} from 'react'

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
        'camera-controls'?: boolean
        'auto-rotate'?: boolean
        'shadow-intensity'?: string
        'ar-placement'?: 'floor' | 'wall'
        'ar-scale'?: 'auto' | 'fixed'
        'touch-action'?: string
        loading?: 'auto' | 'lazy' | 'eager'
        style?: CSSProperties
      }
    }
  }
}

export {}
