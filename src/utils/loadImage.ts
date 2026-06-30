const imageCache = new Map<string, HTMLImageElement>()

export function loadImage(url: string) {
  const cached = imageCache.get(url)
  if (cached) {
    return Promise.resolve(cached)
  }

  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      imageCache.set(url, image)
      resolve(image)
    }
    image.onerror = () => {
      reject(new Error(`Failed to load image: ${url}`))
    }
    image.src = url
  })
}

export function clearImageCache() {
  imageCache.clear()
}
