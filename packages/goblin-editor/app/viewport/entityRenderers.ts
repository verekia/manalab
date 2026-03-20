import * as THREE from 'three'
import type { Entity, LayerTypeDef, Vec3 } from '../state/types'

// Deterministic color palette for placeholder entities
export const PLACEHOLDER_COLORS: Record<string, string> = {
  oak_tree: '#2d7d3a',
  pine_tree: '#1a5c28',
  rock_large: '#7a7a7a',
  rock_small: '#999999',
  bush: '#3a8a2e',
  palm_tree: '#4a9e3a',
}

function getPlaceholderColor(assetKey: string): string {
  if (PLACEHOLDER_COLORS[assetKey]) return PLACEHOLDER_COLORS[assetKey]
  // Generate from hash
  let hash = 0
  for (let i = 0; i < assetKey.length; i++) {
    hash = assetKey.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h = Math.abs(hash) % 360
  return `hsl(${h}, 50%, 45%)`
}

function createPlaceholderMesh(assetKey: string, label: string): THREE.Group {
  const group = new THREE.Group()
  const color = getPlaceholderColor(assetKey)

  // Main body — a box or cone based on asset type
  let geometry: THREE.BufferGeometry
  if (assetKey.includes('tree') || assetKey.includes('palm')) {
    // Tree-like: trunk + cone
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.2, 1, 8),
      new THREE.MeshStandardMaterial({ color: '#8B4513' })
    )
    trunk.position.y = 0.5
    group.add(trunk)

    geometry = new THREE.ConeGeometry(0.8, 1.5, 8)
    const foliage = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({ color })
    )
    foliage.position.y = 1.75
    group.add(foliage)
  } else if (assetKey.includes('rock')) {
    // Rock-like: dodecahedron
    geometry = new THREE.DodecahedronGeometry(0.5, 0)
    const rock = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({ color, flatShading: true })
    )
    rock.position.y = 0.4
    rock.scale.set(1, 0.7, 1)
    group.add(rock)
  } else if (assetKey.includes('bush')) {
    geometry = new THREE.SphereGeometry(0.5, 8, 6)
    const bush = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({ color })
    )
    bush.position.y = 0.4
    bush.scale.set(1, 0.7, 1.2)
    group.add(bush)
  } else {
    // Generic box
    geometry = new THREE.BoxGeometry(1, 1, 1)
    const box = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({ color })
    )
    box.position.y = 0.5
    group.add(box)
  }

  // Label sprite
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = 'rgba(0,0,0,0.6)'
  ctx.roundRect(0, 0, 256, 64, 8)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 24px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, 128, 32)

  const tex = new THREE.CanvasTexture(canvas)
  const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true })
  const sprite = new THREE.Sprite(spriteMat)
  sprite.position.y = 3
  sprite.scale.set(2, 0.5, 1)
  group.add(sprite)

  return group
}

function createColliderMesh(entity: Entity): THREE.Group {
  const group = new THREE.Group()
  const dims = (entity.dimensions as Vec3) || [1, 2, 1]
  const shape = entity.shape as string

  let geometry: THREE.BufferGeometry
  if (shape === 'box') {
    geometry = new THREE.BoxGeometry(dims[0], dims[1], dims[2])
  } else {
    geometry = new THREE.CylinderGeometry(dims[0], dims[0], dims[1], 16)
  }

  const edges = new THREE.EdgesGeometry(geometry)
  const line = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color: '#00d4ff' })
  )
  line.position.y = dims[1] / 2
  group.add(line)

  const fillMat = new THREE.MeshBasicMaterial({
    color: '#00d4ff',
    transparent: true,
    opacity: 0.08,
  })
  const fillMesh = new THREE.Mesh(geometry.clone(), fillMat)
  fillMesh.position.y = dims[1] / 2
  group.add(fillMesh)

  return group
}

function createMarkerMesh(entity: Entity): THREE.Group {
  const group = new THREE.Group()

  // Orange sphere
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 16, 12),
    new THREE.MeshStandardMaterial({ color: '#ff8c00' })
  )
  sphere.position.y = 2.2
  group.add(sphere)

  // Pole
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 2, 8),
    new THREE.MeshStandardMaterial({ color: '#cc7000' })
  )
  pole.position.y = 1
  group.add(pole)

  // Label sprite
  const name = (entity.name as string) || entity.id
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = 'rgba(0,0,0,0.6)'
  ctx.roundRect(0, 0, 256, 64, 8)
  ctx.fill()
  ctx.fillStyle = '#ff8c00'
  ctx.font = 'bold 22px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(name.slice(0, 20), 128, 32)

  const tex = new THREE.CanvasTexture(canvas)
  const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true })
  const sprite = new THREE.Sprite(spriteMat)
  sprite.position.y = 3.2
  sprite.scale.set(2, 0.5, 1)
  group.add(sprite)

  return group
}

const SUB_ITEM_COLORS = ['#4ecdc4', '#5c7cfa', '#ff6b9d', '#ffd93d', '#6bcb77', '#c084fc']

export function createSubItemMesh(fieldKey: string, index: number, item: Record<string, unknown>): THREE.Group {
  const group = new THREE.Group()
  const color = SUB_ITEM_COLORS[index % SUB_ITEM_COLORS.length]

  // Colored cube
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.5, 0.5),
    new THREE.MeshStandardMaterial({ color })
  )
  cube.position.y = 0.25
  group.add(cube)

  // Index label
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = 'rgba(0,0,0,0.6)'
  ctx.roundRect(0, 0, 128, 64, 8)
  ctx.fill()
  ctx.fillStyle = color
  ctx.font = 'bold 28px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(`#${index}`, 64, 32)

  const tex = new THREE.CanvasTexture(canvas)
  const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true })
  const sprite = new THREE.Sprite(spriteMat)
  sprite.position.y = 1.2
  sprite.scale.set(1, 0.5, 1)
  group.add(sprite)

  group.userData.isSubItem = true
  group.userData.fieldKey = fieldKey
  group.userData.itemIndex = index

  return group
}

export function createEntityMesh(
  entity: Entity,
  layerType: LayerTypeDef,
  assetLibrary: Record<string, Record<string, { label: string; glb?: string }>>
): THREE.Object3D {
  if (layerType.renderMode === 'wireframe') {
    return createColliderMesh(entity)
  }

  if (layerType.renderMode === 'markers') {
    return createMarkerMesh(entity)
  }

  // gltf / decoration — use placeholder for now (glTF loading is async & optional)
  const assetKey = entity.asset as string
  const category = assetLibrary['decorations'] || {}
  const assetDef = category[assetKey]
  const label = assetDef?.label || assetKey || 'Unknown'

  return createPlaceholderMesh(assetKey, label)
}
