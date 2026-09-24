declare global {
  interface Window {
    cv?: any
  }
}

const OPENCV_URL = 'https://docs.opencv.org/4.10.0/opencv.js'
let loadingPromise: Promise<any> | null = null

export function loadOpenCv(): Promise<any> {
  if (window.cv?.Mat) return Promise.resolve(window.cv)
  if (loadingPromise) return loadingPromise

  loadingPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-kivora-opencv]')
    const script = existing ?? document.createElement('script')

    const finish = () => {
      const started = performance.now()
      const poll = () => {
        if (window.cv?.Mat) {
          resolve(window.cv)
          return
        }
        if (performance.now() - started > 15000) {
          reject(new Error('OPENCV_TIMEOUT'))
          return
        }
        window.setTimeout(poll, 80)
      }
      poll()
    }

    if (!existing) {
      script.src = OPENCV_URL
      script.async = true
      script.dataset.kivoraOpencv = 'true'
      script.onload = finish
      script.onerror = () => reject(new Error('OPENCV_LOAD_FAILED'))
      document.head.appendChild(script)
    } else {
      finish()
    }
  })

  return loadingPromise
}
