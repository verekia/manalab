let counter = 0

export function generateId(): string {
  counter++
  const rand = Math.random().toString(36).substring(2, 8)
  return `e_${rand}${counter}`
}
