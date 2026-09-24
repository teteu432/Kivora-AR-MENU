import type { Product3D } from '../products'

export type StableARCallbacks = {
  onStatus?: (message: string) => void
  onSessionStart?: () => void
  onSessionEnd?: () => void
  onPlaced?: (placed: boolean) => void
  onAnchorMode?: (mode: 'anchor' | 'fixed-pose') => void
}

export type StableARSession = {
  end: () => Promise<void>
  reposition: () => void
}

// V4.1: tolerância maior e menos frames necessários.
// A versão anterior exigia estabilidade demais em superfícies escuras/lisas.
const STABLE_FRAMES_REQUIRED = 3
const MAX_STABLE_DELTA_METERS = 0.04
const HIT_GRACE_MS = 320
const STATUS_THROTTLE_MS = 320

/**
 * AR leve para alimentos.
 *
 * V4.1 reduz trabalho por frame:
 * - status React é atualizado no máximo ~3x/s, não 60x/s;
 * - hit-test é amostrado a ~30 Hz;
 * - framebuffer e foveation são ajustados ao aparelho;
 * - retículo usa menos geometria;
 * - a detecção aceita pequenas oscilações de rastreamento.
 */
export async function startStableAR(
  product: Product3D,
  overlayRoot: HTMLElement,
  callbacks: StableARCallbacks = {}
): Promise<StableARSession> {
  const xr = (navigator as Navigator & { xr?: any }).xr

  if (!xr) {
    throw new Error('WebXR não está disponível neste navegador.')
  }

  // requestSession permanece dentro do gesto do usuário.
  const session = await xr.requestSession('immersive-ar', {
    requiredFeatures: ['hit-test'],
    optionalFeatures: ['anchors', 'dom-overlay', 'local-floor'],
    domOverlay: { root: overlayRoot },
  })

  callbacks.onSessionStart?.()

  let lastStatus = ''
  let lastStatusAt = 0
  const emitStatus = (message: string, force = false) => {
    const now = performance.now()
    if (!force) {
      if (message === lastStatus && now - lastStatusAt < 1400) return
      if (now - lastStatusAt < STATUS_THROTTLE_MS) return
    }
    lastStatus = message
    lastStatusAt = now
    callbacks.onStatus?.(message)
  }

  emitStatus('Abrindo a câmera…', true)

  const [THREE, { GLTFLoader }] = await Promise.all([
    import('three'),
    import('three/examples/jsm/loaders/GLTFLoader.js'),
  ])

  const memory = (navigator as any).deviceMemory ?? 8
  const cores = navigator.hardwareConcurrency ?? 8
  const lowEnd = memory <= 4 || cores <= 4

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: false,
    stencil: false,
    precision: 'mediump',
    powerPreference: 'high-performance',
    preserveDrawingBuffer: false,
  })

  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.setPixelRatio(1)
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.xr.enabled = true
  renderer.xr.setReferenceSpaceType('local')
  renderer.xr.setFramebufferScaleFactor(lowEnd ? 0.5 : 0.64)
  renderer.domElement.className = 'kivora-xr-canvas'
  document.body.appendChild(renderer.domElement)

  try {
    await renderer.xr.setSession(session)
    renderer.xr.setFoveation(lowEnd ? 1 : 0.8)
  } catch (error) {
    renderer.dispose()
    renderer.domElement.remove()
    await session.end().catch(() => undefined)
    throw error
  }

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20)

  // Iluminação simples, sem sombras em tempo real.
  scene.add(new THREE.HemisphereLight(0xffffff, 0x5d554b, 2.0))
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.1)
  keyLight.position.set(1.2, 2.2, 1.0)
  scene.add(keyLight)

  emitStatus(`Carregando ${product.shortName}…`, true)

  let gltf: any
  try {
    gltf = await new GLTFLoader().loadAsync(product.modelUrl)
  } catch (error) {
    await session.end().catch(() => undefined)
    renderer.dispose()
    renderer.domElement.remove()
    throw new Error('Não foi possível carregar o modelo 3D na câmera.', { cause: error })
  }

  const source = gltf.scene
  const initialBox = new THREE.Box3().setFromObject(source)
  const initialSize = new THREE.Vector3()
  initialBox.getSize(initialSize)
  const originalHorizontal = Math.max(initialSize.x, initialSize.z)

  if (!Number.isFinite(originalHorizontal) || originalHorizontal <= 0) {
    await session.end().catch(() => undefined)
    renderer.dispose()
    renderer.domElement.remove()
    throw new Error('O modelo 3D possui dimensões inválidas.')
  }

  const targetWidthMeters = product.realWidthCm / 100
  const physicalScale = targetWidthMeters / originalHorizontal
  source.scale.setScalar(physicalScale)

  const scaledBox = new THREE.Box3().setFromObject(source)
  const scaledCenter = new THREE.Vector3()
  scaledBox.getCenter(scaledCenter)
  source.position.x -= scaledCenter.x
  source.position.z -= scaledCenter.z
  source.position.y -= scaledBox.min.y

  source.traverse((object: any) => {
    if (!object?.isMesh) return
    object.castShadow = false
    object.receiveShadow = false
    object.frustumCulled = true

    const materials = Array.isArray(object.material) ? object.material : [object.material]
    for (const material of materials) {
      if (material && 'envMapIntensity' in material) {
        material.envMapIntensity = 0.65
      }
    }
  })

  const template = new THREE.Group()
  template.name = `KivoraStable-${product.id}`
  template.add(source)

  // Retículo leve com o diâmetro real do alimento.
  const radius = Math.max(targetWidthMeters / 2, 0.04)
  const reticle = new THREE.Group()
  reticle.matrixAutoUpdate = true
  reticle.visible = false

  const segments = lowEnd ? 20 : 28
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(radius, segments).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({
      color: 0xe5a066,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  )

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(Math.max(radius - 0.003, 0.001), radius, segments)
      .rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({
      color: 0xe5a066,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  )
  ring.position.y = 0.001
  reticle.add(disc, ring)
  scene.add(reticle)

  const referenceSpace = await session.requestReferenceSpace('local')
  const viewerSpace = await session.requestReferenceSpace('viewer')
  const hitTestSource = await session.requestHitTestSource({ space: viewerSpace })

  let disposed = false
  let placedObject: any = null
  let worldAnchor: any = null
  let latestHitResult: any = null
  let latestPoseMatrix: Float32Array | null = null
  let stableFrames = 0
  let placing = false
  let lastHitAt = 0
  let lastHitSampleAt = 0

  const lastRawPosition = new THREE.Vector3()
  let hasLastRawPosition = false
  const targetPosition = new THREE.Vector3()
  const targetQuaternion = new THREE.Quaternion()
  const targetScale = new THREE.Vector3()
  const targetMatrix = new THREE.Matrix4()
  let reticleInitialized = false

  const markPlaced = (placed: boolean) => callbacks.onPlaced?.(placed)

  const deleteAnchor = () => {
    if (worldAnchor) {
      try {
        worldAnchor.delete?.()
      } catch {
        // Sessões encerradas podem rejeitar delete().
      }
      worldAnchor = null
    }
  }

  const removePlacedObject = () => {
    deleteAnchor()
    if (placedObject) {
      scene.remove(placedObject)
      placedObject = null
    }
    markPlaced(false)
  }

  const applyPoseMatrix = (object: any, matrixArray: ArrayLike<number>) => {
    const matrix = new THREE.Matrix4().fromArray(Array.from(matrixArray))
    const position = new THREE.Vector3()
    const quaternion = new THREE.Quaternion()
    const ignoredScale = new THREE.Vector3()
    matrix.decompose(position, quaternion, ignoredScale)

    object.position.copy(position)
    object.quaternion.copy(quaternion)
    object.scale.set(1, 1, 1)
  }

  const placeCurrentHit = async () => {
    if (placing || placedObject) return

    if (!latestPoseMatrix || !latestHitResult || stableFrames < STABLE_FRAMES_REQUIRED) {
      emitStatus('Aponte para a mesa e mova o celular devagar; toque quando o círculo ficar verde.', true)
      return
    }

    placing = true

    const placed = template.clone(true)
    applyPoseMatrix(placed, latestPoseMatrix)
    scene.add(placed)
    placedObject = placed
    reticle.visible = false
    markPlaced(true)

    emitStatus(
      `${product.shortName} fixado em ${product.realWidthCm} cm. Agora caminhe para os lados.`,
      true
    )

    try {
      if (typeof latestHitResult.createAnchor === 'function') {
        worldAnchor = await latestHitResult.createAnchor()
        callbacks.onAnchorMode?.('anchor')
      } else {
        callbacks.onAnchorMode?.('fixed-pose')
      }
    } catch (error) {
      console.info('[Kivora AR] Anchor indisponível; usando pose fixa.', error)
      worldAnchor = null
      callbacks.onAnchorMode?.('fixed-pose')
    } finally {
      placing = false
    }
  }

  const reposition = () => {
    removePlacedObject()
    stableFrames = 0
    hasLastRawPosition = false
    latestHitResult = null
    latestPoseMatrix = null
    reticleInitialized = false
    emitStatus(`Procure a mesa novamente. O círculo representa ${product.realWidthCm} cm reais.`, true)
  }

  const onSelect = () => {
    void placeCurrentHit()
  }

  session.addEventListener('select', onSelect)

  emitStatus(
    `Aponte para a mesa e mova o celular devagar. O círculo representa ${product.realWidthCm} cm.`,
    true
  )

  const cleanup = () => {
    if (disposed) return
    disposed = true

    session.removeEventListener('select', onSelect)
    hitTestSource?.cancel?.()
    removePlacedObject()
    renderer.setAnimationLoop(null)
    renderer.dispose()
    renderer.domElement.remove()
    callbacks.onSessionEnd?.()
  }

  session.addEventListener('end', cleanup, { once: true })

  renderer.setAnimationLoop((time: number, frame?: any) => {
    if (!frame || disposed) return

    if (placedObject) {
      if (worldAnchor?.anchorSpace) {
        const anchorPose = frame.getPose(worldAnchor.anchorSpace, referenceSpace)
        if (anchorPose) {
          applyPoseMatrix(placedObject, anchorPose.transform.matrix)
        }
      }

      renderer.render(scene, camera)
      return
    }

    // O renderer continua a 60/90 Hz, mas hit-test e UI não precisam disso.
    if (time - lastHitSampleAt >= 32) {
      lastHitSampleAt = time

      const results = frame.getHitTestResults(hitTestSource)

      if (results.length) {
        const hit = results[0]
        const pose = hit.getPose(referenceSpace)

        if (pose) {
          lastHitAt = time
          latestHitResult = hit
          latestPoseMatrix = new Float32Array(pose.transform.matrix)

          targetMatrix.fromArray(pose.transform.matrix)
          targetMatrix.decompose(targetPosition, targetQuaternion, targetScale)

          if (!reticleInitialized) {
            reticle.position.copy(targetPosition)
            reticle.quaternion.copy(targetQuaternion)
            reticleInitialized = true
          } else {
            // Suaviza a mira sem atrasar demais a colocação.
            reticle.position.lerp(targetPosition, 0.42)
            reticle.quaternion.slerp(targetQuaternion, 0.42)
          }
          reticle.visible = true

          if (hasLastRawPosition) {
            const delta = targetPosition.distanceTo(lastRawPosition)
            stableFrames = delta <= MAX_STABLE_DELTA_METERS ? Math.min(stableFrames + 1, 12) : 1
          } else {
            stableFrames = 1
            hasLastRawPosition = true
          }
          lastRawPosition.copy(targetPosition)

          const ready = stableFrames >= STABLE_FRAMES_REQUIRED
          ;(ring.material as any).color.setHex(ready ? 0x4de28a : 0xe5a066)

          emitStatus(
            ready
              ? `Mesa encontrada. Toque para fixar o ${product.shortName}.`
              : 'Mesa encontrada. Mantenha o celular por um instante…'
          )
        }
      } else if (time - lastHitAt > HIT_GRACE_MS) {
        reticle.visible = false
        latestHitResult = null
        latestPoseMatrix = null
        stableFrames = 0
        hasLastRawPosition = false
        reticleInitialized = false
        emitStatus('Procure uma área da mesa com bordas ou objetos próximos e mova o celular devagar.')
      }
    }

    renderer.render(scene, camera)
  })

  return {
    end: async () => {
      if (!disposed) {
        await session.end()
      }
    },
    reposition,
  }
}
