import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js'
import { getBurgerModel } from '../lib/burgerModel'
import ARDiagnostics, { type DiagnosticState } from './ARDiagnostics'

const initialDiagnostic: DiagnosticState = {
  secureContext: window.isSecureContext,
  xrApi: Boolean(navigator.xr),
  immersiveAr: 'checking',
  model: 'loading',
  session: 'idle',
  hitTest: 'idle',
  hitEverDetected: false,
  lastError: null,
}

export default function ReliableARPlacement() {
  const buttonHostRef = useRef<HTMLDivElement | null>(null)
  const canvasHostRef = useRef<HTMLDivElement | null>(null)

  const [status, setStatus] = useState('Validando AR e carregando o modelo…')
  const [diagnostic, setDiagnostic] =
    useState<DiagnosticState>(initialDiagnostic)

  useEffect(() => {
    const buttonHost = buttonHostRef.current
    const canvasHost = canvasHostRef.current

    if (!buttonHost || !canvasHost) return

    let disposed = false
    let modelTemplate: THREE.Group | null = null
    let placedObject: THREE.Object3D | null = null
    let hitTestSource: XRHitTestSource | null = null
    let hitTestSourceRequested = false
    let hitVisible = false
    let arButton: HTMLElement | null = null
    let buttonObserver: MutationObserver | null = null
    let overlayRoot: HTMLDivElement | null = null
    let overlayCloseButton: HTMLButtonElement | null = null

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      20
    )

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    })

    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.xr.enabled = true

    canvasHost.appendChild(renderer.domElement)

    const hemisphere = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 3)
    hemisphere.position.set(0.5, 1, 0.25)
    scene.add(hemisphere)

    const directional = new THREE.DirectionalLight(0xffffff, 1.8)
    directional.position.set(1, 3, 2)
    scene.add(directional)

    const controller = renderer.xr.getController(0)
    scene.add(controller)

    const reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.07, 0.1, 48).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({
        color: 0x34ff85,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 1,
        depthTest: false,
        depthWrite: false,
      })
    )

    reticle.matrixAutoUpdate = false
    reticle.visible = false
    reticle.renderOrder = 999
    scene.add(reticle)

    const centerDot = new THREE.Mesh(
      new THREE.CircleGeometry(0.018, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        depthTest: false,
        depthWrite: false,
      })
    )
    centerDot.position.y = 0.001
    reticle.add(centerDot)

    const setError = (message: string, error?: unknown) => {
      console.error(`[Kivora AR] ${message}`, error ?? '')
      if (disposed) return

      setDiagnostic((current) => ({
        ...current,
        lastError: message,
      }))
      setStatus(message)
    }

    const removePlacedObject = () => {
      if (placedObject) {
        scene.remove(placedObject)
        placedObject = null
      }
    }

    const onSelect = () => {
      if (!reticle.visible || !modelTemplate) {
        return
      }

      removePlacedObject()

      const model = modelTemplate.clone(true)
      reticle.matrix.decompose(
        model.position,
        model.quaternion,
        model.scale
      )

      const shadow = new THREE.Mesh(
        new THREE.CircleGeometry(0.09, 64).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({
          color: 0x000000,
          transparent: true,
          opacity: 0.18,
          depthWrite: false,
        })
      )
      shadow.position.y = 0.001
      model.add(shadow)

      scene.add(model)
      placedObject = model
      console.info('[Kivora AR] Hambúrguer posicionado.')
    }

    controller.addEventListener('select', onSelect)

    const localizeButton = () => {
      if (!arButton) return

      const text = arButton.textContent?.trim().toUpperCase()

      if (text === 'START AR') {
        arButton.textContent = '📷 Ver na minha mesa'
      } else if (text === 'STOP AR') {
        arButton.textContent = '✕ Sair do AR'
      } else if (text === 'AR NOT SUPPORTED') {
        arButton.textContent = 'AR não suportado'
      }
    }

    const createArButton = () => {
      if (disposed || arButton) return

      // ARButton r172 adiciona DOM Overlay automaticamente quando nenhum
      // overlay é fornecido. Para evitar vazamentos no StrictMode e impedir
      // que o site inteiro apareça sobre a câmera, fornecemos um overlay
      // mínimo e controlado contendo apenas o botão de saída.
      overlayRoot = document.createElement('div')
      overlayRoot.className = 'xr-overlay-root'
      overlayRoot.style.display = 'none'

      overlayCloseButton = document.createElement('button')
      overlayCloseButton.type = 'button'
      overlayCloseButton.className = 'xr-exit-button'
      overlayCloseButton.textContent = '✕'
      overlayCloseButton.setAttribute('aria-label', 'Sair da realidade aumentada')
      overlayCloseButton.addEventListener('click', () => {
        void renderer.xr.getSession()?.end()
      })

      overlayRoot.appendChild(overlayCloseButton)
      document.body.appendChild(overlayRoot)

      arButton = ARButton.createButton(renderer, {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay'],
        domOverlay: { root: overlayRoot },
      })

      arButton.classList.add('kivora-ar-button')
      buttonHost.appendChild(arButton)

      buttonObserver = new MutationObserver(localizeButton)
      buttonObserver.observe(arButton, {
        childList: true,
        characterData: true,
        subtree: true,
      })

      localizeButton()
    }

    let modelReady = false
    let arSupported = false

    const maybeCreateArButton = () => {
      if (modelReady && arSupported) {
        setStatus(
          'Tudo pronto. Toque em "Ver na minha mesa" e aponte para a superfície.'
        )
        createArButton()
      }
    }

    void (async () => {
      try {
        modelTemplate = await getBurgerModel()

        if (disposed) return

        modelReady = true
        setDiagnostic((current) => ({
          ...current,
          model: 'ready',
        }))

        maybeCreateArButton()
      } catch (error) {
        if (disposed) return

        setDiagnostic((current) => ({
          ...current,
          model: 'error',
        }))
        setError('Não foi possível carregar o hambúrguer 3D.', error)
      }
    })()

    void (async () => {
      if (!window.isSecureContext) {
        setDiagnostic((current) => ({
          ...current,
          immersiveAr: 'no',
          lastError: 'A página não está em contexto seguro (HTTPS).',
        }))
        setStatus('AR exige HTTPS. Abra a versão publicada na Vercel.')
        return
      }

      if (!navigator.xr) {
        setDiagnostic((current) => ({
          ...current,
          immersiveAr: 'no',
          lastError: 'A API WebXR não está disponível.',
        }))
        setStatus('Este navegador não oferece WebXR.')
        return
      }

      try {
        const supported =
          await navigator.xr.isSessionSupported('immersive-ar')

        if (disposed) return

        arSupported = supported

        setDiagnostic((current) => ({
          ...current,
          immersiveAr: supported ? 'yes' : 'no',
        }))

        if (!supported) {
          setStatus('Use um Android/Chrome compatível com ARCore/WebXR.')
          return
        }

        maybeCreateArButton()
      } catch (error) {
        if (disposed) return

        setError('Falha ao verificar suporte a immersive-ar.', error)
        setDiagnostic((current) => ({
          ...current,
          immersiveAr: 'no',
        }))
      }
    })()

    const onSessionStart = () => {
      console.info('[Kivora AR] Sessão immersive-ar iniciada.')

      hitTestSource = null
      hitTestSourceRequested = false
      hitVisible = false
      reticle.visible = false

      if (!disposed) {
        setDiagnostic((current) => ({
          ...current,
          session: 'active',
          hitTest: 'requesting',
          lastError: null,
        }))
      }
    }

    const onSessionEnd = () => {
      console.info('[Kivora AR] Sessão encerrada.')

      hitTestSource?.cancel()
      hitTestSource = null
      hitTestSourceRequested = false
      hitVisible = false
      reticle.visible = false
      removePlacedObject()

      if (!disposed) {
        setDiagnostic((current) => ({
          ...current,
          session: 'idle',
          hitTest: 'idle',
        }))

        setStatus(
          'AR encerrado. Você pode abrir novamente para repetir o teste.'
        )
      }
    }

    renderer.xr.addEventListener('sessionstart', onSessionStart)
    renderer.xr.addEventListener('sessionend', onSessionEnd)

    renderer.setAnimationLoop((_timestamp, frame) => {
      if (frame) {
        const referenceSpace = renderer.xr.getReferenceSpace()
        const session = renderer.xr.getSession()

        if (referenceSpace && session) {
          if (!hitTestSourceRequested) {
            hitTestSourceRequested = true

            void (async () => {
              try {
                const viewerSpace =
                  await session.requestReferenceSpace('viewer')

                const requestHitTestSource =
                  session.requestHitTestSource?.bind(session)

                if (!requestHitTestSource) {
                  throw new Error(
                    'XRSession.requestHitTestSource não está disponível.'
                  )
                }

                const source = await requestHitTestSource({
                  space: viewerSpace,
                })

                if (!source) {
                  throw new Error('O navegador não retornou XRHitTestSource.')
                }

                hitTestSource = source

                if (!disposed) {
                  setDiagnostic((current) => ({
                    ...current,
                    hitTest: 'ready',
                  }))
                }

                console.info('[Kivora AR] Hit Test pronto.')
              } catch (error) {
                hitTestSource = null

                if (!disposed) {
                  setDiagnostic((current) => ({
                    ...current,
                    hitTest: 'error',
                  }))
                }

                setError('A sessão abriu, mas o Hit Test falhou.', error)
              }
            })()
          }

          if (hitTestSource) {
            const hitTestResults = frame.getHitTestResults(hitTestSource)

            if (hitTestResults.length > 0) {
              const pose = hitTestResults[0].getPose(referenceSpace)

              if (pose) {
                reticle.visible = true
                reticle.matrix.fromArray(pose.transform.matrix)

                if (!hitVisible) {
                  hitVisible = true
                  console.info('[Kivora AR] Primeiro hit detectado.')

                  if (!disposed) {
                    setDiagnostic((current) => ({
                      ...current,
                      hitEverDetected: true,
                    }))
                  }
                }
              }
            } else {
              reticle.visible = false
              hitVisible = false
            }
          }
        }
      }

      renderer.render(scene, camera)
    })

    const resize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', resize)

    return () => {
      disposed = true

      window.removeEventListener('resize', resize)
      buttonObserver?.disconnect()
      overlayCloseButton?.replaceWith()
      overlayCloseButton = null
      overlayRoot?.remove()
      overlayRoot = null

      controller.removeEventListener('select', onSelect)
      renderer.xr.removeEventListener('sessionstart', onSessionStart)
      renderer.xr.removeEventListener('sessionend', onSessionEnd)

      hitTestSource?.cancel()
      hitTestSource = null

      const session = renderer.xr.getSession()
      if (session) {
        void session.end()
      }

      renderer.setAnimationLoop(null)
      renderer.dispose()

      arButton?.remove()

      if (renderer.domElement.parentNode === canvasHost) {
        canvasHost.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div className="ar-panel">
      {diagnostic.model === 'loading' && (
        <button className="ar-placeholder-button" type="button" disabled>
          Carregando modelo 3D…
        </button>
      )}

      {diagnostic.model === 'ready' && diagnostic.immersiveAr === 'no' && (
        <button className="ar-placeholder-button" type="button" disabled>
          AR disponível apenas em aparelho compatível
        </button>
      )}

      <div ref={buttonHostRef} className="ar-button-host" />

      <p className="ar-status">{status}</p>

      <ARDiagnostics diagnostic={diagnostic} />

      <div ref={canvasHostRef} className="xr-canvas-host" aria-hidden="true" />
    </div>
  )
}
