const SUPPORTED_TYPES = new Set(['image/gif', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const

type ImageContainer = 'gif' | 'jpeg' | 'png' | 'webp'

export class ImageNormalizationError extends Error {
  readonly fileName: string

  constructor(fileName: string, message: string) {
    super(message)
    this.name = 'ImageNormalizationError'
    this.fileName = fileName
  }
}

export const isAcceptedImageType = (type: string): boolean =>
  SUPPORTED_TYPES.has(type.toLowerCase())

const matchesBytes = (bytes: Uint8Array, expected: readonly number[], offset = 0): boolean =>
  expected.every((value, index) => bytes[offset + index] === value)

const ascii = (bytes: Uint8Array, offset: number, length: number): string =>
  String.fromCharCode(...bytes.subarray(offset, offset + length))

const malformedContainer = (fileName: string): never => {
  throw new ImageNormalizationError(fileName, 'Image container is malformed')
}

const inspectPng = (bytes: Uint8Array, fileName: string) => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let offset: number = PNG_SIGNATURE.length

  while (offset < bytes.length) {
    if (offset + 12 > bytes.length) {
      malformedContainer(fileName)
    }
    const chunkLength = view.getUint32(offset)
    const chunkEnd = offset + 12 + chunkLength
    if (chunkEnd > bytes.length || chunkEnd < offset) {
      malformedContainer(fileName)
    }
    const chunkType = ascii(bytes, offset + 4, 4)
    if (chunkType === 'acTL') {
      throw new ImageNormalizationError(fileName, 'Animated images are not supported')
    }
    offset = chunkEnd
    if (chunkType === 'IEND') {
      if (offset !== bytes.length) {
        malformedContainer(fileName)
      }
      return
    }
  }

  malformedContainer(fileName)
}

const skipGifSubBlocks = (bytes: Uint8Array, start: number, fileName: string): number => {
  let offset = start
  while (offset < bytes.length) {
    const blockLength = bytes[offset]
    if (blockLength === undefined) {
      malformedContainer(fileName)
    }
    offset += 1
    if (blockLength === 0) {
      return offset
    }
    if (offset + blockLength > bytes.length) {
      malformedContainer(fileName)
    }
    offset += blockLength
  }
  return malformedContainer(fileName)
}

const inspectGif = (bytes: Uint8Array, fileName: string) => {
  if (bytes.length < 13) {
    malformedContainer(fileName)
  }
  let offset = 13
  const packed = bytes[10] ?? 0
  if ((packed & 0x80) !== 0) {
    offset += 3 * 2 ** ((packed & 0x07) + 1)
  }
  let frameCount = 0

  while (offset < bytes.length) {
    const marker = bytes[offset]
    if (marker === 0x3b) {
      if (offset + 1 !== bytes.length || frameCount === 0) {
        malformedContainer(fileName)
      }
      return
    }
    if (marker === 0x21) {
      if (offset + 2 > bytes.length) {
        malformedContainer(fileName)
      }
      offset = skipGifSubBlocks(bytes, offset + 2, fileName)
      continue
    }
    if (marker !== 0x2c || offset + 10 > bytes.length) {
      malformedContainer(fileName)
    }

    frameCount += 1
    if (frameCount > 1) {
      throw new ImageNormalizationError(fileName, 'Animated images are not supported')
    }
    const imagePacked = bytes[offset + 9] ?? 0
    offset += 10
    if ((imagePacked & 0x80) !== 0) {
      offset += 3 * 2 ** ((imagePacked & 0x07) + 1)
    }
    if (offset >= bytes.length) {
      malformedContainer(fileName)
    }
    offset = skipGifSubBlocks(bytes, offset + 1, fileName)
  }

  malformedContainer(fileName)
}

const inspectWebp = (bytes: Uint8Array, fileName: string) => {
  if (bytes.length < 20) {
    malformedContainer(fileName)
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const riffEnd = view.getUint32(4, true) + 8
  if (riffEnd !== bytes.length) {
    malformedContainer(fileName)
  }

  let offset = 12
  let foundImage = false
  while (offset < riffEnd) {
    if (offset + 8 > riffEnd) {
      malformedContainer(fileName)
    }
    const chunkType = ascii(bytes, offset, 4)
    const chunkLength = view.getUint32(offset + 4, true)
    const payloadStart = offset + 8
    const chunkEnd = payloadStart + chunkLength
    if (chunkEnd > riffEnd || chunkEnd < offset) {
      malformedContainer(fileName)
    }
    if (
      chunkType === 'ANIM' ||
      chunkType === 'ANMF' ||
      (chunkType === 'VP8X' && ((bytes[payloadStart] ?? 0) & 0x02) !== 0)
    ) {
      throw new ImageNormalizationError(fileName, 'Animated images are not supported')
    }
    if (chunkType === 'VP8 ' || chunkType === 'VP8L') {
      foundImage = true
    }
    offset = chunkEnd + (chunkLength % 2)
  }

  if (offset !== riffEnd || !foundImage) {
    malformedContainer(fileName)
  }
}

const inspectImageContainer = (bytes: Uint8Array, fileName: string): ImageContainer => {
  if (matchesBytes(bytes, PNG_SIGNATURE)) {
    inspectPng(bytes, fileName)
    return 'png'
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'jpeg'
  }
  if (ascii(bytes, 0, 6) === 'GIF87a' || ascii(bytes, 0, 6) === 'GIF89a') {
    inspectGif(bytes, fileName)
    return 'gif'
  }
  if (ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WEBP') {
    inspectWebp(bytes, fileName)
    return 'webp'
  }
  throw new ImageNormalizationError(fileName, 'Unsupported or unsafe image content')
}

export const inspectImageFile = (file: File, bytes: Uint8Array) => {
  const container = inspectImageContainer(bytes, file.name)
  const mime = file.type.toLowerCase()
  const matches =
    (container === 'jpeg' && (mime === 'image/jpeg' || mime === 'image/jpg')) ||
    mime === `image/${container}`
  if (!matches) {
    throw new ImageNormalizationError(file.name, 'Image type does not match file content')
  }
}
