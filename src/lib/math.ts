import { Vec3 } from '../state/types'

export function roundVec3(v: Vec3, decimals = 3): Vec3 {
  const f = Math.pow(10, decimals)
  return [
    Math.round(v[0] * f) / f,
    Math.round(v[1] * f) / f,
    Math.round(v[2] * f) / f,
  ]
}
