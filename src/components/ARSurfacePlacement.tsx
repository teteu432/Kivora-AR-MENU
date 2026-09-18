import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const MODEL_URL =
  'https://modelviewer.dev/shared-assets/models/shishkebab.glb'

// Aproximadamente 28 cm no maior eixo horizontal.
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
  const [message, setMessage] = useState(
    'Aponte para uma mesa e mova o celular devagar.'
  )

  useEffect(() => {
    let mounted = true

    async function checkSupport() {
      if (!navigator.xr) {
        if (mounted) setSupported(false)
        return
      }

      try {
        const ok = await navigator.xr.isSessionSupported('immersive-ar')
        if (mounted) setSupported(ok)
      } catch {
        if (mounted) setSupported(false)
      }
    }

    void checkSupport()

    return () => {
      mounted = false
      rendererRef.current?.dispose()
    }
  }, [])

  function createReticle() {
    const geometry = new THREE.RingGeometry(0.055, 0.075, 48)
    geometry.rotateX(-Math.PI / 2)

    const material = new THREE.MeshBasicMaterial({
      color: 0x33ff88,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
    })

    const reticle = new THREE.Mesh(geometry, material)
    reticle.matrixAutoUpdate = false
    reticle.visible = false

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

    // Centraliza o objeto no marcador.
    source.position.x -= center.x
    source.position.z -= center.z

    // Coloca a base do objeto em Y = 0.
    source.position.y -= box.min.y

    const wrapper = new THREE.Group()
    wrapper.add(source)

    modelTemplateRef.current = wrapper
    return wrapper
  }

  async function startAR() {
    if (!navigator.xr) {
      setMessage('Este navegador não oferece WebXR.')
      return
    }

    setLoading(true)

    try {
      await loadModel()

      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay'],
        domOverlay: { root: document.body },
      })

      sessionRef.current = session

      const scene = new THREE.Scene()
      sceneRef.current = scene

      const camera = new THREE.PerspectiveCamera()
      camera.matrixAutoUpdate = false

      scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 2.5))

      const directional = new THREE.DirectionalLight(0xffffff, 2)
      directional.position.set(1, 3, 2)
      scene.add(directional)

      const reticle = createReticle()
      reticleRef.current = reticle
      scene.add(reticle)

      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
      })

      rendererRef.current = renderer
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.xr.enabled = true
      renderer.xr.setReferenceSpaceType('local')

      renderer.domElement.className = 'xr-canvas'
      document.body.appendChild(renderer.domElement)

      await renderer.xr.setSession(session)

      const referenceSpace = await session.requestReferenceSpace('local')
      referenceSpaceRef.current = referenceSpace

      const viewerSpace = await session.requestReferenceSpace('viewer')

      const requestHitTestSource =
        session.requestHitTestSource?.bind(session)

      if (!requestHitTestSource) {
        throw new Error(
          'Este navegador não oferece suporte ao WebXR Hit Test.'
        )
      }

      const hitTestSource = await requestHitTestSource({
        space: viewerSpace,
        entityTypes: ['plane'],
      })

      if (!hitTestSource) {
        throw new Error(
          'Não foi possível iniciar a detecção de superfícies.'
        )
      }

      hitTestSourceRef.current = hitTestSource

      setMessage('Procurando uma superfície horizontal…')

      const controller = renderer.xr.getController(0)

      const handleSelect = () => {
        placeObject()
      }

      controller.addEventListener('select', handleSelect)
      scene.add(controller)

      session.addEventListener('end', () => {
        controller.removeEventListener('select', handleSelect)

        hitTestSourceRef.current?.cancel()
        hitTestSourceRef.current = null
        referenceSpaceRef.current = null
        sessionRef.current = null

        if (renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement)
        }

        renderer.setAnimationLoop(null)
        renderer.dispose()
        rendererRef.current = null

        setMessage('Aponte para uma mesa e mova o celular devagar.')
      })

      renderer.setAnimationLoop((_time, frame) => {
        if (!frame) {
          renderer.render(scene, camera)
          return
        }

        const currentReferenceSpace = referenceSpaceRef.current
        const currentHitTestSource = hitTestSourceRef.current
        const currentReticle = reticleRef.current

        if (
          !currentReferenceSpace ||
          !currentHitTestSource ||
          !currentReticle
        ) {
          renderer.render(scene, camera)
          return
        }

        const hits = frame.getHitTestResults(currentHitTestSource)

        let validPose: XRPose | null = null

        for (const hit of hits) {
          const pose = hit.getPose(currentReferenceSpace)

          if (!pose) continue

          const matrix = pose.transform.matrix

          // O eixo Y da pose representa a normal da superfície.
          // Quanto mais próximo de 1, mais horizontal está a superfície.
          const horizontalConfidence = Math.abs(matrix[5])

          if (horizontalConfidence >= 0.82) {
            validPose = pose
            break
          }
        }

        if (validPose) {
          currentReticle.visible = true
          currentReticle.matrix.fromArray(validPose.transform.matrix)

          setMessage(
            'Superfície encontrada. Toque para colocar o prato.'
          )
        } else {
          currentReticle.visible = false
          setMessage('Mova o celular devagar sobre a mesa…')
        }

        renderer.render(scene, camera)
      })
    } catch (error) {
      console.error(error)

      const renderer = rendererRef.current

      if (renderer?.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement)
      }

      renderer?.setAnimationLoop(null)
      renderer?.dispose()
      rendererRef.current = null

      const session = sessionRef.current
      if (session) {
        try {
          await session.end()
        } catch {
          // A sessão pode já ter sido encerrada.
        }
      }

      setMessage(
        'Não foi possível iniciar o AR. Use HTTPS, Chrome no Android e um aparelho compatível.'
      )
    } finally {
      setLoading(false)
    }
  }

  function placeObject() {
    const scene = sceneRef.current
    const reticle = reticleRef.current
    const template = modelTemplateRef.current

    if (!scene || !reticle || !template || !reticle.visible) {
      return
    }

    if (placedObjectRef.current) {
      scene.remove(placedObjectRef.current)
      placedObjectRef.current = null
    }

    const placed = template.clone(true)

    const position = new THREE.Vector3()
    const quaternion = new THREE.Quaternion()
    const scale = new THREE.Vector3()

    reticle.matrix.decompose(position, quaternion, scale)

    placed.position.copy(position)
    placed.quaternion.copy(quaternion)

    scene.add(placed)
    placedObjectRef.current = placed

    setMessage(
      'Prato posicionado. Toque em outro ponto válido para mover.'
    )
  }

  return (
    <div className="ar-action-area">
      <button
        className="ar-launch-button"
        onClick={() => void startAR()}
        disabled={loading || supported === false}
      >
        {loading ? 'Preparando AR…' : '📷 Ver na minha mesa'}
      </button>

      <p className="ar-status">
        {supported === false
          ? 'AR por WebXR não é suportado neste navegador/aparelho.'
          : message}
      </p>
    </div>
  )
}
