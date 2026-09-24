import type { Product3D } from '../products'

export type PhysicalARCallbacks = {
  onStatus?: (message: string) => void
  onSessionStart?: () => void
  onSessionEnd?: () => void
  onDepthSupport?: (enabled: boolean) => void
}

export type PhysicalARSession = {
  end: () => Promise<void>
}

const STABLE_FRAMES_REQUIRED = 12
const MAX_POSITION_DELTA_METERS = 0.012
const HORIZONTAL_THRESHOLD = 0.82
const SMOOTHING_FACTOR = 0.18

export async function startPhysicalAR(
  product: Product3D,
  overlayRoot: HTMLElement,
  callbacks: PhysicalARCallbacks = {}
): Promise<PhysicalARSession> {
  const xr = (navigator as Navigator & { xr?: any }).xr

  if (!xr) {
    throw new Error('WebXR não está disponível neste navegador.')
  }

  const [THREE, { GLTFLoader }] = await Promise.all([
    import('three'),
    import('three/examples/jsm/loaders/GLTFLoader.js'),
  ])

  callbacks.onStatus?.('Carregando o produto em tamanho físico…')

  const loader = new GLTFLoader()
  const gltf = await loader.loadAsync(product.modelUrl)
  const source = gltf.scene

  const initialBox = new THREE.Box3().setFromObject(source)
  const initialSize = new THREE.Vector3()
  initialBox.getSize(initialSize)

  const originalHorizontal = Math.max(initialSize.x, initialSize.z)

  if (!Number.isFinite(originalHorizontal) || originalHorizontal <= 0) {
    throw new Error('O modelo 3D possui dimensões inválidas.')
  }

  // 1 unidade do GLB passa a representar metros reais no mundo XR.
  const targetWidthMeters = product.realWidthCm / 100
  const physicalScale = targetWidthMeters / originalHorizontal
  source.scale.setScalar(physicalScale)

  // Centraliza o modelo no X/Z e deixa a base exatamente sobre a mesa.
  const scaledBox = new THREE.Box3().setFromObject(source)
  const center = new THREE.Vector3()
  scaledBox.getCenter(center)
  source.position.x -= center.x
  source.position.z -= center.z
  source.position.y -= scaledBox.min.y

  source.traverse((object: any) => {
    if (object instanceof THREE.Mesh) {
      object.frustumCulled = true
      object.castShadow = false
      object.receiveShadow = false
    }
  })

  const template = new THREE.Group()
  template.name = `KivoraPhysical-${product.id}`
  template.add(source)

  const sessionInit: any = {
    requiredFeatures: ['hit-test'],
    optionalFeatures: ['dom-overlay', 'depth-sensing'],
    domOverlay: { root: overlayRoot },
    depthSensing: {
      // Three.js r172 utiliza a textura GPU para oclusão automática.
      usagePreference: ['gpu-optimized'],
      dataFormatPreference: ['float32', 'luminance-alpha'],
    },
  }

  callbacks.onStatus?.('Abrindo a câmera e procurando uma superfície…')

  let session: any

  try {
    session = await xr.requestSession('immersive-ar', sessionInit)
  } catch (error) {
    // Alguns navegadores rejeitam o dicionário depthSensing mesmo quando a
    // feature é opcional. Fazemos uma segunda tentativa mais compatível.
    session = await xr.requestSession('immersive-ar', {
      requiredFeatures: ['hit-test'],
      optionalFeatures: ['dom-overlay'],
      domOverlay: { root: overlayRoot },
    })

    console.info('[Kivora AR] Depth sensing indisponível nesta sessão.', error)
  }

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera()
  camera.matrixAutoUpdate = false

  scene.add(new THREE.HemisphereLight(0xffffff, 0x777777, 2.2))
  const directional = new THREE.DirectionalLight(0xffffff, 1.35)
  directional.position.set(1, 2.5, 1.5)
  scene.add(directional)

  const lowMemory = ((navigator as any).deviceMemory ?? 8) <= 4
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: !lowMemory,
    powerPreference: 'high-performance',
  })

  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowMemory ? 1.15 : 1.5))
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.xr.enabled = true
  renderer.xr.setReferenceSpaceType('local')
  renderer.xr.setFramebufferScaleFactor(lowMemory ? 0.72 : 0.88)

  renderer.domElement.className = 'kivora-xr-canvas'
  document.body.appendChild(renderer.domElement)

  const footprintRadius = Math.max(targetWidthMeters / 2, 0.045)
  const reticle = new THREE.Group()
  reticle.matrixAutoUpdate = false
  reticle.visible = false
  reticle.renderOrder = 1000

  const footprint = new THREE.Mesh(
    new THREE.CircleGeometry(footprintRadius, lowMemory ? 36 : 64).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({
      color: 0xe7a264,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false,
    })
  )

  const outlineThickness = Math.min(0.004, Math.max(0.002, footprintRadius * 0.035))
  const outline = new THREE.Mesh(
    new THREE.RingGeometry(
      Math.max(0.001, footprintRadius - outlineThickness),
      footprintRadius,
      lowMemory ? 48 : 80
    ).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({
      color: 0xe7a264,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false,
    })
  )

  outline.position.y = 0.001
  reticle.add(footprint, outline)
  scene.add(reticle)

  let placedObject: any = null
  let hitTestSource: any = null
  let disposed = false
  let stableFrames = 0
  let lastRawPosition: any = null
  let smoothedPosition: any = null
  let smoothedQuaternion: any = null
  let lastStatus = ''
  let depthReported = false

  const setStatus = (message: string) => {
    if (message === lastStatus) return
    lastStatus = message
    callbacks.onStatus?.(message)
  }

  const removePlacedObject = () => {
    if (placedObject) {
      scene.remove(placedObject)
      placedObject = null
    }
  }

  const placeObject = () => {
    if (!reticle.visible || stableFrames < STABLE_FRAMES_REQUIRED) {
      setStatus('Mova o celular devagar até o contorno ficar estável.')
      return
    }

    removePlacedObject()

    const placed = template.clone(true)
    const position = new THREE.Vector3()
    const quaternion = new THREE.Quaternion()
    const ignoredScale = new THREE.Vector3()
    reticle.matrix.decompose(position, quaternion, ignoredScale)

    placed.position.copy(position)
    placed.quaternion.copy(quaternion)
    placed.scale.set(1, 1, 1)

    scene.add(placed)
    placedObject = placed
    reticle.visible = false

    setStatus(
      `${product.shortName} colocado com ${product.realWidthCm} cm. Toque em outra área para reposicionar.`
    )
  }

  const controller = renderer.xr.getController(0)
  const onSelect = () => placeObject()
  controller.addEventListener('select', onSelect)
  scene.add(controller)

  await renderer.xr.setSession(session)
  renderer.xr.setFoveation(lowMemory ? 0.7 : 0.45)

  const referenceSpace = await session.requestReferenceSpace('local')
  const viewerSpace = await session.requestReferenceSpace('viewer')
  hitTestSource = await session.requestHitTestSource({ space: viewerSpace })

  callbacks.onSessionStart?.()
  setStatus(
    `Procure a mesa. O contorno representa ${product.realWidthCm} cm reais.`
  )

  const cleanUp = () => {
    if (disposed) return
    disposed = true

    hitTestSource?.cancel?.()
    hitTestSource = null
    controller.removeEventListener('select', onSelect)
    renderer.setAnimationLoop(null)
    renderer.dispose()
    renderer.domElement.remove()
    removePlacedObject()
    callbacks.onSessionEnd?.()
  }

  session.addEventListener('end', cleanUp, { once: true })

  renderer.setAnimationLoop((_time: number, frame?: any) => {
    if (!frame || disposed) return

    if (!depthReported) {
      const hasDepth = renderer.xr.hasDepthSensing()
      if (hasDepth) {
        depthReported = true
        callbacks.onDepthSupport?.(true)
      }
    }

    const results = frame.getHitTestResults(hitTestSource)

    if (!results.length) {
      reticle.visible = false
      stableFrames = 0
      lastRawPosition = null
      setStatus('Aponte para a mesa e mova o celular lentamente.')
      renderer.render(scene, camera)
      return
    }

    const pose = results[0].getPose(referenceSpace)
    if (!pose) {
      renderer.render(scene, camera)
      return
    }

    const matrix = pose.transform.matrix
    const horizontalConfidence = Math.abs(matrix[5])
    const rawPosition = new THREE.Vector3(matrix[12], matrix[13], matrix[14])

    const rawMatrix = new THREE.Matrix4().fromArray(matrix)
    const rawQuaternion = new THREE.Quaternion()
    rawMatrix.decompose(new THREE.Vector3(), rawQuaternion, new THREE.Vector3())

    if (!smoothedPosition) {
      smoothedPosition = rawPosition.clone()
    } else {
      smoothedPosition.lerp(rawPosition, SMOOTHING_FACTOR)
    }

    if (!smoothedQuaternion) {
      smoothedQuaternion = rawQuaternion.clone()
    } else {
      smoothedQuaternion.slerp(rawQuaternion, SMOOTHING_FACTOR)
    }

    if (horizontalConfidence >= HORIZONTAL_THRESHOLD) {
      if (lastRawPosition) {
        const delta = rawPosition.distanceTo(lastRawPosition)
        stableFrames = delta <= MAX_POSITION_DELTA_METERS ? stableFrames + 1 : 0
      } else {
        stableFrames = 1
      }
      lastRawPosition = rawPosition.clone()
    } else {
      stableFrames = 0
      lastRawPosition = null
    }

    const displayMatrix = new THREE.Matrix4().compose(
      smoothedPosition,
      smoothedQuaternion,
      new THREE.Vector3(1, 1, 1)
    )

    reticle.matrix.copy(displayMatrix)
    reticle.visible = !placedObject

    const ready = stableFrames >= STABLE_FRAMES_REQUIRED
    const material = outline.material as any
    material.color.setHex(ready ? 0x42e58b : 0xe7a264)

    if (!placedObject) {
      setStatus(
        ready
          ? `Área confirmada: ${product.realWidthCm} cm. Toque para colocar.`
          : `Superfície encontrada. Estabilizando referência de ${product.realWidthCm} cm…`
      )
    }

    renderer.render(scene, camera)
  })

  // Caso a API de profundidade não seja ativada nos primeiros instantes,
  // informa o fallback sem impedir a experiência.
  window.setTimeout(() => {
    if (!disposed && !depthReported) {
      depthReported = true
      callbacks.onDepthSupport?.(false)
    }
  }, 1200)

  return {
    end: async () => {
      if (session && session.end) {
        await session.end()
      }
    },
  }
}
