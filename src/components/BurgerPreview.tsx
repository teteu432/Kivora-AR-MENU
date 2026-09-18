import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { getBurgerModel } from '../lib/burgerModel'

export default function BurgerPreview() {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let disposed = false
    let frameId = 0
    let model: THREE.Group | null = null

    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(36, 1, 0.01, 10)
    camera.position.set(0.23, 0.15, 0.32)

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    })

    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    host.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.enablePan = false
    controls.minDistance = 0.2
    controls.maxDistance = 0.7
    controls.target.set(0, 0.07, 0)
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.8

    const hemisphere = new THREE.HemisphereLight(0xffffff, 0x566070, 2.2)
    scene.add(hemisphere)

    const key = new THREE.DirectionalLight(0xffffff, 4)
    key.position.set(0.35, 0.65, 0.45)
    key.castShadow = true
    scene.add(key)

    const fill = new THREE.DirectionalLight(0xffd6b0, 1.5)
    fill.position.set(-0.35, 0.25, 0.2)
    scene.add(fill)

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(0.18, 64).rotateX(-Math.PI / 2),
      new THREE.ShadowMaterial({
        color: 0x000000,
        opacity: 0.24,
      })
    )
    floor.receiveShadow = true
    floor.position.y = -0.001
    scene.add(floor)

    void getBurgerModel()
      .then((loaded) => {
        if (disposed) return
        model = loaded
        scene.add(model)
        setState('ready')
      })
      .catch((error) => {
        console.error('[Kivora Preview] Falha ao carregar GLB:', error)
        if (!disposed) setState('error')
      })

    const resize = () => {
      const width = Math.max(host.clientWidth, 1)
      const height = Math.max(host.clientHeight, 1)

      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
    }

    const observer = new ResizeObserver(resize)
    observer.observe(host)
    resize()

    const animate = () => {
      frameId = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      disposed = true
      cancelAnimationFrame(frameId)
      observer.disconnect()
      controls.dispose()

      if (model) {
        scene.remove(model)
      }

      renderer.dispose()

      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div ref={hostRef} className="preview-host">
      {state === 'loading' && (
        <div className="preview-message">Carregando hambúrguer 3D…</div>
      )}

      {state === 'error' && (
        <div className="preview-message preview-error">
          Não foi possível carregar o modelo 3D.
        </div>
      )}
    </div>
  )
}
