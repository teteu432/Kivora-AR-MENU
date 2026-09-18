import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const PRIMARY_MODEL_URL =
  'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Hamburger/glTF-Binary/Hamburger.glb'

const FALLBACK_MODEL_URL =
  'https://modelviewer.dev/shared-assets/models/shishkebab.glb'

const TARGET_HORIZONTAL_SIZE_METERS = 0.16
const HORIZONTAL_THRESHOLD = 0.58
const STABLE_FRAMES_REQUIRED = 7
const MAX_POSITION_DELTA = 0.05
const SMOOTHING_FACTOR = 0.35

type ReticleStage = 'searching' | 'candidate' | 'ready'

export default function ARSurfacePlacement() {
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const reticleRef = useRef<THREE.Mesh | null>(null)
  const reticleMaterialRef = useRef<THREE.MeshBasicMaterial | null>(null)
  const modelTemplateRef = useRef<THREE.Group | null>(null)
  const hitTestSourceRef = useRef<XRHitTestSource | null>(null)
  const referenceSpaceRef = useRef<XRReferenceSpace | null>(null)
  const sessionRef = useRef<XRSession | null>(null)
  const placedObjectRef = useRef<THREE.Object3D | null>(null)

  const smoothedPositionRef = useRef<THREE.Vector3 | null>(null)
  const smoothedQuaternionRef = useRef<THREE.Quaternion | null>(null)
  const lastStableRawPositionRef = useRef<THREE.Vector3 | null>(null)
  const stableFramesRef = useRef(0)
  const reticleStageRef = useRef<ReticleStage>('searching')

  const [supported, setSupported] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(
    'Aponte para a mesa e mova o celular lentamente.'
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

  function setReticleStage(stage: ReticleStage) {
    reticleStageRef.current = stage

    const material = reticleMaterialRef.current
    if (!material) return

    if (stage === 'ready') {
      material.color.setHex(0x3dff91)
    } else if (stage === 'candidate') {
      material.color.setHex(0xffd44d)
    } else {
      material.color.setHex(0x3dff91)
    }
  }

  function createReticle() {
    const geometry = new THREE.RingGeometry(0.05, 0.07, 48)
    geometry.rotateX(-Math.PI / 2)

    const material = new THREE.MeshBasicMaterial({
      color: 0x3dff91,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
      depthTest: false,
    })

    reticleMaterialRef.current = material

    const reticle = new THREE.Mesh(geometry, material)
    reticle.matrixAutoUpdate = false
    reticle.visible = false
    reticle.renderOrder = 999

    return reticle
  }

  async function loadModelFromUrl(url: string) {
    const loader = new GLTFLoader()
    return loader.loadAsync(url)
  }

  async function loadModel() {
    if (modelTemplateRef.current) {
      return modelTemplateRef.current
    }

    let gltf

    try {
      gltf = await loadModelFromUrl(PRIMARY_MODEL_URL)
    } catch {
      gltf = await loadModelFromUrl(FALLBACK_MODEL_URL)
    }

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

    if (
      !scene ||
      !reticle ||
      !template ||
      !reticle.visible ||
      reticleStageRef.current !== 'ready'
    ) {
      setStatus('Continue escaneando até o marcador ficar verde.')
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
      'X-burguer posicionado. Toque em outro ponto verde para movê-lo.'
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
    reticleMaterialRef.current = null
    smoothedPositionRef.current = null
    smoothedQuaternionRef.current = null
    lastStableRawPositionRef.current = null
    stableFramesRef.current = 0
    reticleStageRef.current = 'searching'

    setStatus('Aponte para a mesa e mova o celular lentamente.')
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

      setStatus('Escaneando a superfície…')

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

          if (hitResults.length === 0) {
            currentReticle.visible = false
            stableFramesRef.current = 0
            lastStableRawPositionRef.current = null
            setReticleStage('searching')
            setStatus('Mova o celular lentamente sobre a mesa…')
            renderer.render(scene, camera)
            return
          }

          const chosenHit = hitResults[0]
          const pose = chosenHit.getPose(currentReferenceSpace)

          if (!pose) {
            currentReticle.visible = false
            stableFramesRef.current = 0
            lastStableRawPositionRef.current = null
            setReticleStage('searching')
            renderer.render(scene, camera)
            return
          }

          const matrix = pose.transform.matrix
          const horizontalConfidence = Math.abs(matrix[5])

          const rawPosition = new THREE.Vector3(
            matrix[12],
            matrix[13],
            matrix[14]
          )

          const rawMatrix = new THREE.Matrix4().fromArray(matrix)
          const rawQuaternion = new THREE.Quaternion()
          const throwawayScale = new THREE.Vector3()
          rawMatrix.decompose(
            new THREE.Vector3(),
            rawQuaternion,
            throwawayScale
          )

          if (!smoothedPositionRef.current) {
            smoothedPositionRef.current = rawPosition.clone()
          } else {
            smoothedPositionRef.current.lerp(
              rawPosition,
              SMOOTHING_FACTOR
            )
          }

          if (!smoothedQuaternionRef.current) {
            smoothedQuaternionRef.current = rawQuaternion.clone()
          } else {
            smoothedQuaternionRef.current.slerp(
              rawQuaternion,
              SMOOTHING_FACTOR
            )
          }

          let stage: ReticleStage = 'candidate'

          if (horizontalConfidence >= HORIZONTAL_THRESHOLD) {
            const lastStable = lastStableRawPositionRef.current

            if (lastStable) {
              const delta = rawPosition.distanceTo(lastStable)

              if (delta <= MAX_POSITION_DELTA) {
                stableFramesRef.current += 1
              } else {
                stableFramesRef.current = 0
              }
            } else {
              stableFramesRef.current = 1
            }

            lastStableRawPositionRef.current = rawPosition.clone()

            if (stableFramesRef.current >= STABLE_FRAMES_REQUIRED) {
              stage = 'ready'
            } else {
              stage = 'candidate'
            }
          } else {
            stableFramesRef.current = 0
            lastStableRawPositionRef.current = null
            stage = 'candidate'
          }

          currentReticle.visible = true
          setReticleStage(stage)

          const displayMatrix = new THREE.Matrix4().compose(
            smoothedPositionRef.current,
            smoothedQuaternionRef.current ?? rawQuaternion,
            new THREE.Vector3(1, 1, 1)
          )

          currentReticle.matrix.copy(displayMatrix)

          if (stage === 'ready') {
            setStatus(
              'Superfície estabilizada. Toque para posicionar o x-burguer.'
            )
          } else {
            setStatus(
              'Superfície encontrada. Continue movendo devagar até o círculo ficar verde.'
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
