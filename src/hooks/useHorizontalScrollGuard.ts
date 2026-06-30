import { useEffect, useRef } from 'react'

export const useHorizontalScrollGuard = <T extends HTMLElement>() => {
  const ref = useRef<T>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) {
      return undefined
    }

    const handleWheel = (event: WheelEvent) => {
      if (element.scrollWidth <= element.clientWidth) {
        return
      }

      const { deltaX, deltaY, shiftKey } = event

      let horizontalDelta = 0
      if (deltaX !== 0) {
        horizontalDelta = deltaX
      } else if (shiftKey) {
        horizontalDelta = deltaY
      }

      if (horizontalDelta === 0) {
        return
      }

      event.preventDefault()
      element.scrollLeft += horizontalDelta
    }

    element.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      element.removeEventListener('wheel', handleWheel)
    }
  }, [])

  return ref
}
