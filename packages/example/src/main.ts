import * as THREE from 'three'
import sceneData from '../scene-data/decorations.json'
import colliderData from '../scene-data/colliders.json'

// Scene
const scene = new THREE.Scene()
scene.background = new THREE.Color('#87CEEB')

// Camera
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100
)
camera.position.set(12, 8, 12)
camera.lookAt(0, 0, 0)

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)
renderer.shadowMap.enabled = true
document.body.appendChild(renderer.domElement)

// Lights
scene.add(new THREE.AmbientLight('#ffffff', 0.6))
const sun = new THREE.DirectionalLight('#fff5e6', 1)
sun.position.set(5, 10, 5)
sun.castShadow = true
scene.add(sun)

// Ground
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(50, 50),
  new THREE.MeshStandardMaterial({ color: '#4a7c59' })
)
ground.rotation.x = -Math.PI / 2
ground.receiveShadow = true
scene.add(ground)

// Tree builder
function createTree(): THREE.Group {
  const group = new THREE.Group()

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.2, 1, 8),
    new THREE.MeshStandardMaterial({ color: '#8B4513' })
  )
  trunk.position.y = 0.5
  trunk.castShadow = true
  group.add(trunk)

  const foliage = new THREE.Mesh(
    new THREE.ConeGeometry(0.8, 1.5, 8),
    new THREE.MeshStandardMaterial({ color: '#2d7d3a' })
  )
  foliage.position.y = 1.75
  foliage.castShadow = true
  group.add(foliage)

  return group
}

// Render trees from scene data
for (const entity of sceneData.entities) {
  const tree = createTree()
  const [x, y, z] = entity.position
  tree.position.set(x, y, z)
  if (entity.scale) {
    const [sx, sy, sz] = entity.scale
    tree.scale.set(sx, sy, sz)
  }
  scene.add(tree)
}

// Render colliders from scene data
for (const entity of colliderData.entities) {
  const [x, y, z] = entity.position
  const dims = entity.dimensions || [1, 2, 1]

  let geometry: THREE.BufferGeometry
  if (entity.shape === 'box') {
    geometry = new THREE.BoxGeometry(dims[0], dims[1], dims[2])
  } else {
    geometry = new THREE.CylinderGeometry(dims[0], dims[0], dims[1], 16)
  }

  const edges = new THREE.EdgesGeometry(geometry)
  const line = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color: '#00d4ff' })
  )
  line.position.set(x, dims[1] / 2, z)
  scene.add(line)

  const fill = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({ color: '#00d4ff', transparent: true, opacity: 0.1 })
  )
  fill.position.set(x, dims[1] / 2, z)
  scene.add(fill)
}

// Animate
function animate() {
  requestAnimationFrame(animate)
  renderer.render(scene, camera)
}
animate()

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})
