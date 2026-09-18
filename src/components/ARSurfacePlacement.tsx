import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const MODEL_URL =
  'https://modelviewer.dev/shared-assets/models/shishkebab.glb'

const TARGET_HORIZONTAL_SIZE_METERS = 0.28

export default function ARSurfacePlacement() {
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const reticleRef = useRef<THREE.Mesh | null>(null)
  const modelTemplateRef = useRef<THREE.Group | null>(null)
  const hitTestSourceRef = useRef<XRHitTestSource | null>(null)
  const referenceSpaceRef = useRef<XRReferenceSpace | null>(null)
  const sessionRef = useRef<XRSession | null>(null)
  const placedObjectRef = useRef<THREE.Object3D | null>(null)

  const [supported, setSupported] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(
    'Aponte para uma mesa e mova o celular lentamente.'
  )

  useEffect(() => {
    let active = true

    async function verifySupport() {
      if (!navigator.xr) {
        if (active) setSupported(false)
        return
      }

      try {
        const canUseAR =
          await navigator.xr.isSessionSupported('immersive-ar')

        if (active) {
          setSupported(canUseAR)
        }
      } catch {
        if (active) setSupported(false)
      }
    }

    void verifySupport()

    return () => {
      active = false
    }
  }, [])

  function createReticle() {
    const geometry = new THREE.RingGeometry(0.055, 0.075, 48)
    geometry.rotateX(-Math.PI / 2)

    const material = new THREE.MeshBasicMaterial({
      color: 0x3dff91,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
      depthTest: false,
    })

    const reticle = new THREE.Mesh(geometry, material)
    reticle.matrixAutoUpdate = false
    reticle.visible = false
    reticle.renderOrder = 999

    return reticle
  }

  async function loadModel() {
    if (modelTemplateRef.current) {
      return modelTemplateRef.current
    }

    const loader = new GLTFLoader()
    const gltf = await loader.loadAsync(MODEL_URL)
    const source = gltf.scene

    let box = new THREE.Box3().setFromObject(source)
    const size = new THREE.Vector3()
    box.getSize(size)

    const horizontalSize = Math.max(size.x, size.z)

    const factor =
      horizontalSize > 0
        ? TARGET_HORIZONTAL_SIZE_METERS / horizontalSize
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

    modelTemplateRef.current = wrapper

    return wrapper
  }

  function removePlacedObject() {
    const scene = sceneRef.current
    const placed = placedObjectRef.current

    if (scene && placed) {
      scene.remove(placed)
    }

    placedObjectRef.current = null
  }

  function placeObject() {
    const scene = sceneRef.current
    const reticle = reticleRef.current
    const template = modelTemplateRef.current

    if (!scene || !reticle || !template || !reticle.visible) {
      return
    }

    removePlacedObject()

    const placed = template.clone(true)

    const position = new THREE.Vector3()
    const quaternion = new THREE.Quaternion()
    const scale = new THREE.Vector3()

    reticle.matrix.decompose(position, quaternion, scale)

    placed.position.copy(position)
    placed.quaternion.copy(quaternion)

    scene.add(placed)
    placedObjectRef.current = placed

    setStatus(
      'Prato posicionado. Toque em outro ponto válido para movê-lo.'
    )
  }

  async function cleanUpSession() {
    hitTestSourceRef.current?.cancel()
    hitTestSourceRef.current = null
    referenceSpaceRef.current = null
    sessionRef.current = null

    removePlacedObject()

    const renderer = rendererRef.current

    if (renderer) {
      renderer.setAnimationLoop(null)

      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement)
      }

      renderer.dispose()
      rendererRef.current = null
    }

    sceneRef.current = null
    reticleRef.current = null

    setStatus(
      'Aponte para uma mesa e mova o celular lentamente.'
    )
  }

  async function startAR() {
    if (!navigator.xr) {
      setStatus('Este navegador não oferece suporte ao WebXR.')
      return
    }

    setLoading(true)

    try {
      await loadModel()

      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test'],
      })

      sessionRef.current = session

      const scene = new THREE.Scene()
      sceneRef.current = scene

      const camera = new THREE.PerspectiveCamera()
      camera.matrixAutoUpdate = false

      scene.add(
        new THREE.HemisphereLight(0xffffff, 0x444444, 2.4)
      )

      const directionalLight =
        new THREE.DirectionalLight(0xffffff, 2)

      directionalLight.position.set(1, 3, 2)
      scene.add(directionalLight)

      const reticle = createReticle()
      reticleRef.current = reticle
      scene.add(reticle)

      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
      })

      rendererRef.current = renderer

      renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, 2)
      )

      renderer.setSize(
        window.innerWidth,
        window.innerHeight
      )

      renderer.xr.enabled = true
      renderer.xr.setReferenceSpaceType('local')

      renderer.domElement.className = 'xr-canvas'
      document.body.appendChild(renderer.domElement)

      await renderer.xr.setSession(session)

      const referenceSpace =
        await session.requestReferenceSpace('local')

      referenceSpaceRef.current = referenceSpace

      const viewerSpace =
        await session.requestReferenceSpace('viewer')

      const requestHitTestSource =
        session.requestHitTestSource?.bind(session)

      if (!requestHitTestSource) {
        throw new Error(
          'O navegador não disponibilizou WebXR Hit Test.'
        )
      }

      const hitTestSource =
        await requestHitTestSource({
          space: viewerSpace,
        })

      if (!hitTestSource) {
        throw new Error(
          'Não foi possível iniciar a detecção de superfícies.'
        )
      }

      hitTestSourceRef.current = hitTestSource

      const controller = renderer.xr.getController(0)

      const handleSelect = () => {
        placeObject()
      }

      controller.addEventListener('select', handleSelect)
      scene.add(controller)

      session.addEventListener(
        'end',
        () => {
          controller.removeEventListener(
            'select',
            handleSelect
          )

          void cleanUpSession()
        },
        { once: true }
      )

      setStatus(
        'Procurando uma superfície horizontal…'
      )

      renderer.setAnimationLoop(
        (_time, frame) => {
          if (!frame) {
            renderer.render(scene, camera)
            return
          }

          const currentReferenceSpace =
            referenceSpaceRef.current

          const currentHitTestSource =
            hitTestSourceRef.current

          const currentReticle =
            reticleRef.current

          if (
            !currentReferenceSpace ||
            !currentHitTestSource ||
            !currentReticle
          ) {
            renderer.render(scene, camera)
            return
          }

          const hitResults =
            frame.getHitTestResults(
              currentHitTestSource
            )

          let horizontalPose: XRPose | null = null

          for (const hit of hitResults) {
            const pose =
              hit.getPose(currentReferenceSpace)

            if (!pose) continue

            const matrix =
              pose.transform.matrix

            const horizontalConfidence =
              Math.abs(matrix[5])

            if (horizontalConfidence >= 0.8) {
              horizontalPose = pose
              break
            }
          }

          if (horizontalPose) {
            currentReticle.visible = true

            currentReticle.matrix.fromArray(
              horizontalPose.transform.matrix
            )

            setStatus(
              'Superfície encontrada. Toque para colocar o prato.'
            )
          } else {
            currentReticle.visible = false

            setStatus(
              'Mova o celular devagar sobre a mesa…'
            )
          }

          renderer.render(scene, camera)
        }
      )
    } catch (error) {
      console.error(error)

      const activeSession = sessionRef.current

      if (activeSession) {
        try {
          await activeSession.end()
        } catch {
          await cleanUpSession()
        }
      } else {
        await cleanUpSession()
      }

      setStatus(
        'Não foi possível iniciar o AR. Use HTTPS, Chrome no Android e um aparelho compatível.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ar-panel">
      <button
        type="button"
        className="ar-launch-button"
        onClick={() => void startAR()}
        disabled={
          loading ||
          supported === false
        }
      >
        {loading
          ? 'Preparando AR…'
          : '📷 Ver na minha mesa'}
      </button>

      <p className="ar-status">
        {supported === false
          ? 'Este navegador/aparelho não oferece WebXR AR compatível.'
          : status}
      </p>
    </div>
  )
}
