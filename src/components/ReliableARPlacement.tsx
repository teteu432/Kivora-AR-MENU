import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const MODEL_URL =
  'https://cdn.jsdelivr.net/gh/mindset-code/burger-house-3d@c2bddc597efe4870326c843a6e056727752fc261/public/hamburger__food_big-hamburger.glb'

const TARGET_BURGER_WIDTH_METERS = 0.15

export default function ReliableARPlacement() {
  const buttonHostRef = useRef<HTMLDivElement | null>(null)
  const [status, setStatus] = useState(
    'Abra pelo celular, inicie o AR e aponte o centro da câmera para a mesa.'
  )

  useEffect(() => {
    const host = buttonHostRef.current
    if (!host) return

    let disposed = false
    let hitTestSource: XRHitTestSource | null = null
    let hitTestSourceRequested = false
    let modelTemplate: THREE.Group | null = null
    let placedObject: THREE.Object3D | null = null
    let lastReticleVisible = false

    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      20
    )

    const light = new THREE.HemisphereLight(
      0xffffff,
      0xbbbbff,
      3
    )
    light.position.set(0.5, 1, 0.25)
    scene.add(light)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    })

    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.xr.enabled = true
    renderer.domElement.className = 'xr-render-canvas'

    document.body.appendChild(renderer.domElement)

    const reticle = new THREE.Mesh(
      new THREE.RingGeometry(
        0.07,
        0.095,
        48
      ).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({
        color: 0x32ff82,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 1,
        depthTest: false,
        depthWrite: false,
      })
    )

    reticle.matrixAutoUpdate = false
    reticle.visible = false
    reticle.renderOrder = 9999
    scene.add(reticle)

    const centerDot = new THREE.Mesh(
      new THREE.CircleGeometry(0.016, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        depthTest: false,
        depthWrite: false,
      })
    )
    centerDot.position.y = 0.001
    reticle.add(centerDot)

    const controller = renderer.xr.getController(0)
    scene.add(controller)

    function normalizeModel(source: THREE.Object3D) {
      let box = new THREE.Box3().setFromObject(source)
      const size = new THREE.Vector3()
      box.getSize(size)

      const horizontalSize = Math.max(size.x, size.z)
      const factor =
        horizontalSize > 0
          ? TARGET_BURGER_WIDTH_METERS / horizontalSize
          : 1

      source.scale.setScalar(factor)

      box = new THREE.Box3().setFromObject(source)

      const center = new THREE.Vector3()
      box.getCenter(center)

      source.position.x -= center.x
      source.position.z -= center.z
      source.position.y -= box.min.y

      const wrapper = new THREE.Group()
      wrapper.add(source)

      const shadow = new THREE.Mesh(
        new THREE.CircleGeometry(0.085, 64).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({
          color: 0x000000,
          transparent: true,
          opacity: 0.18,
          depthWrite: false,
        })
      )
      shadow.position.y = 0.001
      wrapper.add(shadow)

      return wrapper
    }

    const loader = new GLTFLoader()

    loader.load(
      MODEL_URL,
      (gltf) => {
        if (disposed) return

        modelTemplate = normalizeModel(
          gltf.scene.clone(true)
        )

        setStatus(
          'Modelo carregado. Inicie o AR e procure o círculo verde sobre a mesa.'
        )
      },
      undefined,
      (error) => {
        console.error('Falha ao carregar modelo 3D:', error)

        if (!disposed) {
          setStatus(
            'O modelo 3D não carregou. Recarregue a página antes de iniciar o AR.'
          )
        }
      }
    )

    function placeBurger() {
      if (!reticle.visible || !modelTemplate) {
        setStatus(
          'O círculo verde precisa estar visível antes de posicionar o lanche.'
        )
        return
      }

      if (placedObject) {
        scene.remove(placedObject)
        placedObject = null
      }

      const clone = modelTemplate.clone(true)

      reticle.matrix.decompose(
        clone.position,
        clone.quaternion,
        clone.scale
      )

      scene.add(clone)
      placedObject = clone

      setStatus(
        'Lanche posicionado. Toque em outro ponto para reposicionar.'
      )
    }

    controller.addEventListener('select', placeBurger)

    const arButton = ARButton.createButton(
      renderer,
      {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay'],
        domOverlay: {
          root: document.body,
        },
      }
    )

    arButton.textContent = '📷 Ver na minha mesa'
    arButton.setAttribute(
      'aria-label',
      'Ver o hambúrguer na minha mesa'
    )

    host.appendChild(arButton)

    renderer.xr.addEventListener('sessionstart', () => {
      setStatus(
        'AR iniciado. Mova o celular devagar apontando o centro da câmera para a mesa.'
      )
    })

    renderer.xr.addEventListener('sessionend', () => {
      arButton.textContent = '📷 Ver na minha mesa'
      setStatus(
        'AR encerrado. Toque no botão para iniciar novamente.'
      )
    })

    function requestHitTestIfNeeded(
      session: XRSession
    ) {
      if (hitTestSourceRequested) return

      hitTestSourceRequested = true

      void (async () => {
        try {
          const viewerReferenceSpace =
            await session.requestReferenceSpace('viewer')

          const requestHitTestSource =
            session.requestHitTestSource?.bind(session)

          if (!requestHitTestSource) {
            throw new Error(
              'requestHitTestSource indisponível.'
            )
          }

          const source =
            await requestHitTestSource({
              space: viewerReferenceSpace,
            })

          hitTestSource = source ?? null

          if (!hitTestSource) {
            throw new Error(
              'O navegador não criou a fonte de Hit Test.'
            )
          }
        } catch (error) {
          console.error('Erro ao iniciar Hit Test:', error)

          if (!disposed) {
            setStatus(
              'A sessão AR abriu, mas o Hit Test não pôde ser iniciado neste navegador.'
            )
          }
        }
      })()

      session.addEventListener(
        'end',
        () => {
          hitTestSource?.cancel()
          hitTestSource = null
          hitTestSourceRequested = false
          reticle.visible = false
          lastReticleVisible = false
        },
        { once: true }
      )
    }

    function render(
      _timestamp: number,
      frame?: XRFrame
    ) {
      if (frame) {
        const referenceSpace =
          renderer.xr.getReferenceSpace()

        const session =
          renderer.xr.getSession()

        if (referenceSpace && session) {
          requestHitTestIfNeeded(session)

          if (hitTestSource) {
            const hitTestResults =
              frame.getHitTestResults(
                hitTestSource
              )

            if (hitTestResults.length > 0) {
              const hit =
                hitTestResults[0]

              const pose =
                hit.getPose(referenceSpace)

              if (pose) {
                reticle.visible = true
                reticle.matrix.fromArray(
                  pose.transform.matrix
                )

                if (!lastReticleVisible) {
                  lastReticleVisible = true

                  setStatus(
                    'Superfície encontrada. Toque na tela para colocar o lanche.'
                  )
                }
              }
            } else {
              reticle.visible = false

              if (lastReticleVisible) {
                lastReticleVisible = false

                setStatus(
                  'Superfície perdida. Mova o celular lentamente sobre a mesa.'
                )
              }
            }
          }
        }
      }

      renderer.render(scene, camera)
    }

    renderer.setAnimationLoop(render)

    function handleResize() {
      camera.aspect =
        window.innerWidth /
        window.innerHeight

      camera.updateProjectionMatrix()

      renderer.setSize(
        window.innerWidth,
        window.innerHeight
      )
    }

    window.addEventListener(
      'resize',
      handleResize
    )

    return () => {
      disposed = true

      window.removeEventListener(
        'resize',
        handleResize
      )

      controller.removeEventListener(
        'select',
        placeBurger
      )

      hitTestSource?.cancel()
      hitTestSource = null

      renderer.setAnimationLoop(null)

      const session = renderer.xr.getSession()
      if (session) {
        void session.end()
      }

      renderer.dispose()

      if (
        renderer.domElement.parentNode
      ) {
        renderer.domElement.parentNode.removeChild(
          renderer.domElement
        )
      }

      if (arButton.parentNode) {
        arButton.parentNode.removeChild(
          arButton
        )
      }
    }
  }, [])

  return (
    <div className="ar-panel">
      <div
        ref={buttonHostRef}
        className="ar-button-host"
      />

      <p className="ar-status">
        {status}
      </p>
    </div>
  )
}
