import * as THREE from 'three'
import type { StageConfig } from '../state/types'

export interface StageObjects {
  lights: THREE.Light[]
  backdrops: THREE.Object3D[]
  cleanup: () => void
}

export function renderStage(scene: THREE.Scene, stage: StageConfig): StageObjects {
  const lights: THREE.Light[] = []
  const backdrops: THREE.Object3D[] = []

  // Ambient light
  const ambient = new THREE.AmbientLight(
    stage.lighting.ambientColor,
    stage.lighting.ambientIntensity,
  )
  scene.add(ambient)
  lights.push(ambient)

  // Directional (sun) light
  const dir = stage.lighting.sunDirection
  const sun = new THREE.DirectionalLight(stage.lighting.sunColor, stage.lighting.sunIntensity)
  sun.position.set(-dir[0] * 20, -dir[1] * 20, -dir[2] * 20)
  sun.castShadow = true
  scene.add(sun)
  lights.push(sun)

  // Hemisphere fill
  const hemi = new THREE.HemisphereLight('#b1e1ff', '#2a1a0a', 0.3)
  scene.add(hemi)
  lights.push(hemi)

  // Backdrops
  for (const bd of stage.backdrops) {
    let mesh: THREE.Object3D

    switch (bd.type) {
      case 'plane': {
        const size = bd.size || [100, 100]
        const geo = new THREE.PlaneGeometry(size[0], size[1])
        geo.rotateX(-Math.PI / 2)
        const mat = new THREE.MeshStandardMaterial({
          color: bd.color || '#888888',
          transparent: bd.opacity !== undefined && bd.opacity < 1,
          opacity: bd.opacity ?? 1,
          side: THREE.DoubleSide,
        })
        mesh = new THREE.Mesh(geo, mat)
        break
      }
      case 'box': {
        const geo = new THREE.BoxGeometry(1, 1, 1)
        const mat = new THREE.MeshStandardMaterial({
          color: bd.color || '#888888',
          transparent: bd.opacity !== undefined && bd.opacity < 1,
          opacity: bd.opacity ?? 1,
        })
        mesh = new THREE.Mesh(geo, mat)
        break
      }
      case 'sphere': {
        const geo = new THREE.SphereGeometry(0.5, 32, 24)
        const mat = new THREE.MeshStandardMaterial({
          color: bd.color || '#888888',
          transparent: bd.opacity !== undefined && bd.opacity < 1,
          opacity: bd.opacity ?? 1,
        })
        mesh = new THREE.Mesh(geo, mat)
        break
      }
      default:
        // glb — show a placeholder box
        const geo = new THREE.BoxGeometry(2, 0.5, 2)
        const mat = new THREE.MeshStandardMaterial({
          color: '#555555',
          wireframe: true,
        })
        mesh = new THREE.Mesh(geo, mat)
        break
    }

    mesh.position.set(bd.position[0], bd.position[1], bd.position[2])
    mesh.rotation.set(bd.rotation[0], bd.rotation[1], bd.rotation[2])
    mesh.scale.set(bd.scale[0], bd.scale[1], bd.scale[2])
    mesh.name = `backdrop_${bd.id}`
    scene.add(mesh)
    backdrops.push(mesh)
  }

  const cleanup = () => {
    lights.forEach((l) => scene.remove(l))
    backdrops.forEach((b) => {
      scene.remove(b)
      if (b instanceof THREE.Mesh) {
        b.geometry?.dispose()
        if (b.material) {
          if (Array.isArray(b.material)) b.material.forEach((m) => m.dispose())
          else b.material.dispose()
        }
      }
    })
  }

  return { lights, backdrops, cleanup }
}
