function createStore(initial = {}) {
  let state = { ...initial }
  const listeners = new Set()

  function setState(partial) {
    const prev = state
    state = { ...state, ...partial }
    for (const fn of listeners) fn(state, prev)
  }

  function subscribe(fn) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  }

  return {
    get state() { return state },
    setState,
    subscribe,
    connect(page, key = 'store') {
      page.setData({ [key]: state })
      const unsub = subscribe((s) => {
        if (page.setData) page.setData({ [key]: s })
      })
      const origUnload = page.onUnload
      page.onUnload = function (...args) {
        unsub()
        if (origUnload) origUnload.apply(this, args)
      }
    },
  }
}

module.exports = { createStore }
