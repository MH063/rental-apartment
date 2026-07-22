let counter = Date.now()

export function nextId(): number {
  return ++counter
}
