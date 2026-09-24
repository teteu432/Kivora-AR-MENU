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

const STABLE_FRAMES_REQUIRED = 8
const MAX_STABLE_DELTA_METERS = 0.018

/**
 * WebXR enxuto para alimentos.
 *
 * Diferença principal em relação ao AR padrão do <model-viewer>:
 * - a escala é convertida uma vez para metros reais;
 * - o hit-test só é usado ANTES da colocação;
 * - depois do toque o produto deixa de seguir o retículo/câmera;
 * - quando a API de Anchors existe, o ponto é preso ao mundo real;
 * - sem Anchors, congelamos a pose no referenceSpace (fallback).
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

  // IMPORTANTE: requestSession precisa ocorrer ainda dentro do gesto do usuário.
  // Não fazemos import/load do modelo antes desta chamada.
  const session = await xr.requestSession('immersive-ar', {
    requiredFeatures: ['hit-test'],
    optionalFeatures: ['anchors', 'dom-overlay'],
    domOverlay: { root: overlayRoot },
  })

  callbacks.onSessionStart?.()
  callbacks.onStatus?.('Abrindo a câmera…')

  const [THREE, { GLTFLoader }] = await Promise.all([
    import('three'),
    import('three/examples/jsm/loaders/GLTFLoader.js'),
  ])

  const lowMemory = ((navigator as any).deviceMemory ?? 8) <= 4

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: false,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: false,
  })

  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.setPixelRatio(1)
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.xr.enabled = true
  renderer.xr.setReferenceSpaceType('local')
  renderer.xr.setFramebufferScaleFactor(lowMemory ? 0.72 : 0.82)
  renderer.domElement.className = 'kivora-xr-canvas'
  document.body.appendChild(renderer.domElement)

  try {
    await renderer.xr.setSession(session)
    renderer.xr.setFoveation(lowMemory ? 0.7 : 0.5)
  } catch (error) {
    renderer.dispose()
    renderer.domElement.remove()
    await session.end().catch(() => undefined)
    throw error
  }

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20)

  // Luz leve, sem sombras em tempo real.
  scene.add(new THREE.HemisphereLight(0xffffff, 0x5d554b, 2.2))
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.25)
  keyLight.position.set(1.4, 2.4, 1.2)
  scene.add(keyLight)

  callbacks.onStatus?.(`Carregando ${product.shortName}…`)

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

  // WebXR trabalha em METROS. 13 cm => 0,13 m no mundo.
  // Não existe compensação por distância da câmera e não existe scaleCalibration aqui.
  const targetWidthMeters = product.realWidthCm / 100
  const physicalScale = targetWidthMeters / originalHorizontal
  source.scale.setScalar(physicalScale)

  // Centraliza X/Z e coloca a base exatamente em Y=0 do ponto de apoio.
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
        material.envMapIntensity = 0.75
      }
    }
  })

  const template = new THREE.Group()
  template.name = `KivoraStable-${product.id}`
  template.add(source)

  // Retículo do mesmo diâmetro do alimento. Ele desaparece assim que o usuário fixa.
  const radius = Math.max(targetWidthMeters / 2, 0.04)
  const reticle = new THREE.Group()
  reticle.matrixAutoUpdate = false
  reticle.visible = false

  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(radius, lowMemory ? 28 : 42).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({
      color: 0xe5a066,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  )

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(Math.max(radius - 0.003, 0.001), radius, lowMemory ? 36 : 52)
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
  let lastHitPosition: any = null
  let stableFrames = 0
  let placing = false

  const markPlaced = (placed: boolean) => callbacks.onPlaced?.(placed)

  const deleteAnchor = () => {
    if (worldAnchor) {
      try {
        worldAnchor.delete?.()
      } catch {
        // Alguns runtimes expõem delete mas podem rejeitar se a sessão já terminou.
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
    // A escala física já está dentro do template. A pose NUNCA altera escala.
    object.scale.set(1, 1, 1)
  }

  const placeCurrentHit = async () => {
    if (placing || placedObject) return

    if (!latestPoseMatrix || !latestHitResult || stableFrames < STABLE_FRAMES_REQUIRED) {
      callbacks.onStatus?.('Mova o celular devagar até o círculo ficar verde; depois toque na mesa.')
      return
    }

    placing = true

    const placed = template.clone(true)
    applyPoseMatrix(placed, latestPoseMatrix)
    scene.add(placed)
    placedObject = placed
    reticle.visible = false
    markPlaced(true)

    callbacks.onStatus?.(
      `${product.shortName} fixado em ${product.realWidthCm} cm. Agora caminhe para os lados para observá-lo em 3D.`
    )

    // Melhor opção: XRAnchor criado diretamente do hit-test da mesa.
    // Se não houver suporte, o objeto permanece congelado na pose local.
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
    lastHitPosition = null
    latestHitResult = null
    latestPoseMatrix = null
    callbacks.onStatus?.(`Procure a mesa novamente. O círculo representa ${product.realWidthCm} cm reais.`)
  }

  const onSelect = () => {
    void placeCurrentHit()
  }

  session.addEventListener('select', onSelect)

  callbacks.onStatus?.(
    `Aponte para a mesa. Quando o círculo de ${product.realWidthCm} cm ficar verde, toque para fixar.`
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

  renderer.setAnimationLoop((_time: number, frame?: any) => {
    if (!frame || disposed) return

    // Depois de fixado, o hit-test deixa de controlar o produto.
    // Se houver XRAnchor, usamos somente a pose desse anchor.
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

    const results = frame.getHitTestResults(hitTestSource)

    if (!results.length) {
      reticle.visible = false
      latestHitResult = null
      latestPoseMatrix = null
      stableFrames = 0
      lastHitPosition = null
      callbacks.onStatus?.('Aponte para uma mesa com textura e mova o celular devagar.')
      renderer.render(scene, camera)
      return
    }

    const hit = results[0]
    const pose = hit.getPose(referenceSpace)

    if (!pose) {
      renderer.render(scene, camera)
      return
    }

    latestHitResult = hit
    latestPoseMatrix = new Float32Array(pose.transform.matrix)
    reticle.matrix.fromArray(pose.transform.matrix)
    reticle.visible = true

    const matrix = pose.transform.matrix
    const hitPosition = new THREE.Vector3(matrix[12], matrix[13], matrix[14])

    if (lastHitPosition) {
      const delta = hitPosition.distanceTo(lastHitPosition)
      stableFrames = delta <= MAX_STABLE_DELTA_METERS ? stableFrames + 1 : 0
    } else {
      stableFrames = 1
    }

    lastHitPosition = hitPosition

    const ready = stableFrames >= STABLE_FRAMES_REQUIRED
    ;(ring.material as any).color.setHex(ready ? 0x4de28a : 0xe5a066)

    callbacks.onStatus?.(
      ready
        ? `Mesa estável. Toque para fixar o ${product.shortName} em ${product.realWidthCm} cm.`
        : `Mesa encontrada. Estabilizando a referência de ${product.realWidthCm} cm…`
    )

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
