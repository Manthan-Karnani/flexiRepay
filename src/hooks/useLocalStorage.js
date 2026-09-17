import { useState } from 'react'

export default function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw !== null) return JSON.parse(raw)
      return typeof initialValue === 'function' ? initialValue() : initialValue
    } catch {
      return typeof initialValue === 'function' ? initialValue() : initialValue
    }
  })

  const set = (next) => {
    setValue((prev) => {
      const v = typeof next === 'function' ? next(prev) : next
      try {
        localStorage.setItem(key, JSON.stringify(v))
      } catch {
        // keep in-memory
      }
      return v
    })
  }

  return [value, set]
}
