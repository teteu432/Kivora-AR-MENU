import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { BURGER_WIDTH_METERS, MODEL_URL } from '../config'

let templatePromise: Promise<THREE.Group> | null = null

function normalizeBurger(source: THREE.Object3D) {
  const initialBox = new THREE.Box3().setFromObject(source)
  const initialSize = new THREE.Vector3()
  initialBox.getSize(initialSize)

  const horizontalSize = Math.max(initialSize.x, initialSize.z)

  if (!Number.isFinite(horizontalSize) || horizontalSize <= 0) {
    throw new Error('O GLB possui dimensões inválidas.')
  }

  const factor = BURGER_WIDTH_METERS / horizontalSize
  source.scale.setScalar(factor)

  const scaledBox = new THREE.Box3().setFromObject(source)
  const center = new THREE.Vector3()
  scaledBox.getCenter(center)

  source.position.x -= center.x
  source.position.z -= center.z
  source.position.y -= scaledBox.min.y

  source.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true
      object.receiveShadow = true
      object.frustumCulled = true
    }
  })

  const wrapper = new THREE.Group()
  wrapper.name = 'KivoraBurger'
  wrapper.add(source)

  return wrapper
}

async function loadTemplate() {
  const loader = new GLTFLoader()
  const gltf = await loader.loadAsync(MODEL_URL)

  if (!gltf.scene) {
    throw new Error('GLB carregado sem cena 3D.')
  }

  return normalizeBurger(gltf.scene)
}

export async function getBurgerModel() {
  if (!templatePromise) {
    templatePromise = loadTemplate().catch((error) => {
      templatePromise = null
      throw error
    })
  }

  const template = await templatePromise
  return template.clone(true)
}
