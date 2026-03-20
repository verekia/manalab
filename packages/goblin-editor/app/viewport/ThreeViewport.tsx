import { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'
import type { EditorState, Entity, Vec3, ArrayField } from '../state/types'
import type { EditorAction } from '../state/actions'
import { generateId } from '../lib/idGen'
import { roundVec3 } from '../lib/math'
import { buildDefaultEntity } from '../lib/schemaDefaults'
import { createEntityMesh, createSubItemMesh } from './entityRenderers'
import { renderStage } from './stageRenderer'
import type { StageObjects } from './stageRenderer'

interface ViewportProps {
  state: EditorState
  dispatch: React.Dispatch<EditorAction>
}

// Persistent refs across renders
let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let orbitControls: OrbitControls | null = null
let transformControls: TransformControls | null = null
let animFrameId: number | null = null

const entityMeshMap = new Map<string, THREE.Object3D>()
let stageObjects: StageObjects | null = null
let gridHelper: THREE.GridHelper | null = null

export default function ThreeViewport({ state, dispatch }: ViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef(state)
  stateRef.current = state
  const dispatchRef = useRef(dispatch)
  dispatchRef.current = dispatch

  // Initialize Three.js scene
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0
    container.appendChild(renderer.domElement)

    // Scene
    scene = new THREE.Scene()
    scene.background = new THREE.Color('#1a1a2e')
    scene.fog = new THREE.FogExp2('#1a1a2e', 0.008)

    // Camera
    camera = new THREE.PerspectiveCamera(50, 1, 0.1, 500)
    camera.position.set(20, 15, 20)
    camera.lookAt(0, 0, 0)

    // Orbit controls
    orbitControls = new OrbitControls(camera, renderer.domElement)
    orbitControls.enableDamping = true
    orbitControls.dampingFactor = 0.1
    orbitControls.minDistance = 3
    orbitControls.maxDistance = 80
    orbitControls.target.set(0, 0, 0)

    // Transform controls
    transformControls = new TransformControls(camera, renderer.domElement)
    transformControls.setSize(0.8)
    scene.add(transformControls.getHelper())

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transformControls.addEventListener('dragging-changed', (event: any) => {
      if (orbitControls) orbitControls.enabled = !event.value
      if (!event.value) {
        // Drag ended — commit transform
        const obj = transformControls?.object
        if (!obj) return
        const s = stateRef.current

        if (obj.userData.isSubItem && obj.userData.entityId) {
          const pos = roundVec3([obj.position.x, obj.position.y, obj.position.z])
          dispatchRef.current({
            type: 'TRANSFORM_SUB_ITEM',
            entityId: obj.userData.entityId,
            layerId: s.ui.activeLayerId,
            sceneId: s.ui.currentSceneId,
            arrayField: obj.userData.fieldKey,
            itemIndex: obj.userData.itemIndex,
            positionField: obj.userData.positionField,
            position: pos,
          })
        } else if (obj.userData.entityId) {
          const pos = roundVec3([obj.position.x, obj.position.y, obj.position.z])
          const rot = roundVec3([obj.rotation.x, obj.rotation.y, obj.rotation.z])
          const scl = roundVec3([obj.scale.x, obj.scale.y, obj.scale.z])
          dispatchRef.current({
            type: 'TRANSFORM_ENTITY',
            entityId: obj.userData.entityId,
            layerId: s.ui.activeLayerId,
            sceneId: s.ui.currentSceneId,
            position: pos,
            rotation: rot,
            scale: scl,
          })
        }
      }
    })

    // Ground plane for raycasting (invisible)
    const groundGeo = new THREE.PlaneGeometry(500, 500)
    groundGeo.rotateX(-Math.PI / 2)
    const groundMat = new THREE.MeshBasicMaterial({ visible: false })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.name = 'ground_plane'
    scene.add(ground)

    // Resize
    const resizeObserver = new ResizeObserver(() => {
      if (!renderer || !camera || !container) return
      const w = container.clientWidth
      const h = container.clientHeight
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    })
    resizeObserver.observe(container)
    // Trigger initial resize
    const w = container.clientWidth
    const h = container.clientHeight
    renderer.setSize(w, h)
    camera.aspect = w / h
    camera.updateProjectionMatrix()

    // Click handler
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    const onClick = (event: MouseEvent) => {
      if (!renderer || !camera || !scene) return
      // Ignore if transform gizmo is being interacted with
      if (transformControls?.dragging) return

      const rect = renderer.domElement.getBoundingClientRect()
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(mouse, camera)

      const s = stateRef.current
      const d = dispatchRef.current

      // Try picking active layer entities
      const activeLayerMeshes: THREE.Object3D[] = []
      entityMeshMap.forEach((mesh) => {
        if (mesh.userData.layerId === s.ui.activeLayerId) {
          activeLayerMeshes.push(mesh)
          // Also add children for raycasting
          mesh.traverse((child) => {
            if (child !== mesh) activeLayerMeshes.push(child)
          })
        }
      })

      const hits = raycaster.intersectObjects(activeLayerMeshes, false)
      if (hits.length > 0) {
        // Find the root (entity or sub-item)
        let hitObj = hits[0].object
        while (hitObj.parent && !hitObj.userData.entityId) {
          hitObj = hitObj.parent
        }
        if (hitObj.userData.entityId) {
          if (hitObj.userData.isSubItem) {
            d({ type: 'SELECT_ENTITY', entityId: hitObj.userData.entityId })
            d({ type: 'SELECT_SUB_ITEM', subItem: { field: hitObj.userData.fieldKey, index: hitObj.userData.itemIndex } })
          } else {
            d({ type: 'SELECT_ENTITY', entityId: hitObj.userData.entityId })
          }
          return
        }
      }

      // If in placement mode, place on ground
      if (s.ui.placementTool) {
        const groundMeshes = scene!.children.filter((c) => c.name === 'ground_plane')
        const groundHits = raycaster.intersectObjects(groundMeshes)
        if (groundHits.length > 0) {
          const pt = groundHits[0].point
          const pos: Vec3 = roundVec3([pt.x, 0, pt.z])

          let entity: Entity
          if (s.ui.placementTool.type === 'decoration') {
            const id = generateId()
            entity = {
              id,
              asset: s.ui.placementTool.asset,
              position: pos,
              rotation: [0, 0, 0] as Vec3,
              scale: [1, 1, 1] as Vec3,
            }
          } else if (s.ui.placementTool.type === 'collider') {
            const id = generateId()
            entity = {
              id,
              shape: s.ui.placementTool.shape,
              position: pos,
              rotation: [0, 0, 0] as Vec3,
              dimensions: [1, 2, 1] as Vec3,
            }
          } else {
            // marker
            const layerRef = s.present.project.scenes[s.ui.currentSceneId]?.layers.find(
              (l) => l.id === s.ui.activeLayerId
            )
            const layerTypeDef = layerRef ? s.present.project.layerTypes[layerRef.type] : null
            if (!layerTypeDef) return
            entity = buildDefaultEntity(layerTypeDef.entitySchema)
            entity.position = pos
          }

          d({
            type: 'PLACE_ENTITY',
            entity,
            layerId: s.ui.activeLayerId,
            sceneId: s.ui.currentSceneId,
          })
          d({ type: 'SELECT_ENTITY', entityId: entity.id })
        }
        return
      }

      // Click on nothing — deselect
      d({ type: 'SELECT_ENTITY', entityId: null })
    }

    renderer.domElement.addEventListener('click', onClick)

    // Animation loop
    const animate = () => {
      animFrameId = requestAnimationFrame(animate)
      orbitControls?.update()
      if (renderer && scene && camera) {
        renderer.render(scene, camera)
      }
    }
    animate()

    return () => {
      resizeObserver.disconnect()
      renderer?.domElement.removeEventListener('click', onClick)
      if (animFrameId !== null) cancelAnimationFrame(animFrameId)
      transformControls?.dispose()
      orbitControls?.dispose()
      renderer?.dispose()
      if (container.contains(renderer!.domElement)) {
        container.removeChild(renderer!.domElement)
      }
      entityMeshMap.clear()
      renderer = null
      scene = null
      camera = null
      orbitControls = null
      transformControls = null
      stageObjects = null
      gridHelper = null
    }
  }, [])

  // Sync scene data to Three.js
  useEffect(() => {
    if (!scene || !camera) return

    const s = state
    const sceneId = s.ui.currentSceneId
    const sceneDef = s.present.project.scenes[sceneId]
    if (!sceneDef) return

    // Update stage
    if (stageObjects) {
      stageObjects.cleanup()
    }
    stageObjects = renderStage(scene, sceneDef.stage)

    // Update grid
    if (gridHelper) {
      scene.remove(gridHelper)
      gridHelper.dispose()
    }
    if (sceneDef.stage.grid.visible) {
      gridHelper = new THREE.GridHelper(
        sceneDef.stage.grid.size,
        sceneDef.stage.grid.divisions,
        '#444466',
        '#333355'
      )
      gridHelper.material.opacity = 0.3
      ;(gridHelper.material as THREE.Material).transparent = true
      scene.add(gridHelper)
    }

    // Update entities
    const layerDataMap = s.present.sceneLayers[sceneId] || {}
    const existingIds = new Set<string>()

    for (const layer of sceneDef.layers) {
      const layerData = layerDataMap[layer.id]
      if (!layerData) continue

      const isActive = layer.id === s.ui.activeLayerId
      const isVisible = layer.visible
      const layerType = s.present.project.layerTypes[layer.type]
      if (!layerType) continue

      for (const entity of layerData.entities) {
        existingIds.add(entity.id)
        let mesh = entityMeshMap.get(entity.id)

        // For marker-mode entities, recreate mesh when entity data changes
        if (mesh && layerType.renderMode === 'markers') {
          const entityHash = JSON.stringify(entity)
          if (mesh.userData.entityHash !== entityHash) {
            scene.remove(mesh)
            entityMeshMap.delete(entity.id)
            mesh = undefined
          }
        }

        if (!mesh) {
          mesh = createEntityMesh(entity, layerType, s.present.project.assetLibrary)
          mesh.userData.entityId = entity.id
          mesh.userData.layerId = layer.id
          if (layerType.renderMode === 'markers') {
            mesh.userData.entityHash = JSON.stringify(entity)
          }
          scene.add(mesh)
          entityMeshMap.set(entity.id, mesh)
        }

        // Update transform
        const pos = (entity.position as Vec3) || [0, 0, 0]
        const rot = (entity.rotation as Vec3) || [0, 0, 0]
        const scl = (entity.scale as Vec3) || (entity.dimensions as Vec3) || [1, 1, 1]

        mesh.position.set(pos[0], pos[1], pos[2])
        mesh.rotation.set(rot[0], rot[1], rot[2])

        if (layerType.renderMode === 'wireframe') {
          // For colliders, dimensions define the geometry, not scale
          mesh.scale.set(1, 1, 1)
          updateColliderGeometry(mesh, entity)
        } else {
          mesh.scale.set(scl[0], scl[1], scl[2])
        }

        // Visibility and opacity
        if (!isVisible) {
          mesh.visible = false
        } else {
          mesh.visible = true
          setMeshOpacity(mesh, isActive ? 1.0 : 0.4)
        }

        // Selection highlight
        updateSelectionHighlight(mesh, entity.id === s.ui.selectedEntityId && !s.ui.selectedSubItem)

        mesh.userData.layerId = layer.id

        // Sub-item meshes for array fields with itemPositionField
        for (const [fieldKey, fieldDef] of Object.entries(layerType.entitySchema)) {
          if (fieldDef.type !== 'array') continue
          const arrDef = fieldDef as ArrayField
          if (!arrDef.itemPositionField) continue

          const items = (entity[fieldKey] as Record<string, unknown>[]) || []
          for (let i = 0; i < items.length; i++) {
            const subKey = `${entity.id}:${fieldKey}:${i}`
            existingIds.add(subKey)
            let subMesh = entityMeshMap.get(subKey)

            // Recreate if item data changed
            if (subMesh) {
              const itemHash = JSON.stringify(items[i])
              if (subMesh.userData.itemHash !== itemHash) {
                scene.remove(subMesh)
                entityMeshMap.delete(subKey)
                subMesh = undefined
              }
            }

            if (!subMesh) {
              subMesh = createSubItemMesh(fieldKey, i, items[i])
              subMesh.userData.entityId = entity.id
              subMesh.userData.layerId = layer.id
              subMesh.userData.isSubItem = true
              subMesh.userData.fieldKey = fieldKey
              subMesh.userData.itemIndex = i
              subMesh.userData.positionField = arrDef.itemPositionField
              subMesh.userData.itemHash = JSON.stringify(items[i])
              scene.add(subMesh)
              entityMeshMap.set(subKey, subMesh)
            }

            // Position from item's position field
            const itemPos = (items[i][arrDef.itemPositionField] as Vec3) || [0, 0, 0]
            subMesh.position.set(itemPos[0], itemPos[1], itemPos[2])

            // Visibility
            const subPath = `${entity.id}:${fieldKey}:${i}`
            const isSubHidden = s.ui.hiddenSubItems.includes(subPath)
            if (!isVisible || isSubHidden) {
              subMesh.visible = false
            } else {
              subMesh.visible = true
              setMeshOpacity(subMesh, isActive ? 1.0 : 0.4)
            }

            // Sub-item selection highlight
            const isSubSelected = s.ui.selectedEntityId === entity.id &&
              s.ui.selectedSubItem?.field === fieldKey &&
              s.ui.selectedSubItem?.index === i
            updateSelectionHighlight(subMesh, isSubSelected)

            subMesh.userData.layerId = layer.id
          }
        }
      }
    }

    // Remove meshes for deleted entities
    entityMeshMap.forEach((mesh, id) => {
      if (!existingIds.has(id)) {
        scene!.remove(mesh)
        entityMeshMap.delete(id)
      }
    })

    // Attach transform controls to selected entity or sub-item
    if (s.ui.selectedEntityId && transformControls) {
      let targetMesh: THREE.Object3D | undefined
      if (s.ui.selectedSubItem) {
        const subKey = `${s.ui.selectedEntityId}:${s.ui.selectedSubItem.field}:${s.ui.selectedSubItem.index}`
        targetMesh = entityMeshMap.get(subKey)
      } else {
        targetMesh = entityMeshMap.get(s.ui.selectedEntityId)
      }

      if (targetMesh) {
        transformControls.attach(targetMesh)
        // Sub-items only support translate
        if (s.ui.selectedSubItem) {
          transformControls.setMode('translate')
        } else {
          transformControls.setMode(
            s.ui.transformMode === 'translate' ? 'translate' :
            s.ui.transformMode === 'rotate' ? 'rotate' : 'scale'
          )
        }
        transformControls.getHelper().visible = true
      } else {
        transformControls.detach()
        transformControls.getHelper().visible = false
      }
    } else if (transformControls) {
      transformControls.detach()
      transformControls.getHelper().visible = false
    }
  }, [state])

  // Camera reset handler
  const resetCamera = useCallback(() => {
    if (!camera || !orbitControls) return
    const sceneDef = state.present.project.scenes[state.ui.currentSceneId]
    if (!sceneDef) return
    const pos = sceneDef.stage.camera.defaultPosition
    const tgt = sceneDef.stage.camera.defaultTarget
    camera.position.set(pos[0], pos[1], pos[2])
    orbitControls.target.set(tgt[0], tgt[1], tgt[2])
  }, [state.ui.currentSceneId, state.present.project.scenes])

  // Focus on selected entity
  useEffect(() => {
    const handler = (e: Event) => {
      const entityId = (e as CustomEvent).detail
      if (!entityId || !camera || !orbitControls) return
      const mesh = entityMeshMap.get(entityId)
      if (mesh) {
        orbitControls.target.copy(mesh.position)
      }
    }
    window.addEventListener('focus-entity', handler)
    return () => window.removeEventListener('focus-entity', handler)
  }, [])

  // Expose resetCamera
  useEffect(() => {
    const handler = () => resetCamera()
    window.addEventListener('reset-camera', handler)
    return () => window.removeEventListener('reset-camera', handler)
  }, [resetCamera])

  const cursorStyle = state.ui.placementTool ? 'crosshair' : 'default'

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', cursor: cursorStyle }}
    />
  )
}

function updateColliderGeometry(mesh: THREE.Object3D, entity: Entity) {
  const dims = (entity.dimensions as Vec3) || [1, 2, 1]
  const shape = entity.shape as string

  // Remove old children
  while (mesh.children.length > 0) {
    const child = mesh.children[0]
    mesh.remove(child)
    if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
      child.geometry?.dispose()
    }
  }

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

  const fillMat = new THREE.MeshBasicMaterial({
    color: '#00d4ff',
    transparent: true,
    opacity: 0.08,
  })
  const fillMesh = new THREE.Mesh(geometry.clone(), fillMat)
  fillMesh.position.y = dims[1] / 2

  mesh.add(line)
  mesh.add(fillMesh)
}

function setMeshOpacity(obj: THREE.Object3D, opacity: number) {
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material) {
      const mat = child.material as THREE.MeshStandardMaterial
      if (mat.name !== 'selection_highlight') {
        mat.transparent = opacity < 1
        mat.opacity = opacity
      }
    }
  })
}

function updateSelectionHighlight(obj: THREE.Object3D, selected: boolean) {
  // Remove existing highlight
  const toRemove: THREE.Object3D[] = []
  obj.traverse((child) => {
    if (child.userData.isSelectionHighlight) {
      toRemove.push(child)
    }
  })
  toRemove.forEach((c) => c.parent?.remove(c))

  if (selected) {
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh && !child.userData.isSelectionHighlight) {
        const edges = new THREE.EdgesGeometry(child.geometry)
        const line = new THREE.LineSegments(
          edges,
          new THREE.LineBasicMaterial({ color: '#ffcc00', linewidth: 2 })
        )
        line.userData.isSelectionHighlight = true
        line.renderOrder = 999
        ;(line.material as THREE.LineBasicMaterial).depthTest = false
        line.position.copy(child.position)
        line.rotation.copy(child.rotation)
        line.scale.copy(child.scale)
        obj.add(line)
      }
    })
  }
}
