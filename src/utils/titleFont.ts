const TITLE_FONT_NAME = 'Archivo Black'
export const TITLE_FONT_FAMILY = `'${TITLE_FONT_NAME}', sans-serif`

const TITLE_FONT_LOAD_SIZE = 16

const titleFontSpec = (fontSize: number) => `${fontSize}px "${TITLE_FONT_NAME}"`

export const ensureTitleFontLoaded = async (fontSize = TITLE_FONT_LOAD_SIZE): Promise<void> => {
  if (typeof document === 'undefined' || document.fonts === undefined) {
    return
  }

  await document.fonts.load(titleFontSpec(fontSize))
}

export const isTitleFontReady = (fontSize = TITLE_FONT_LOAD_SIZE): boolean =>
  typeof document !== 'undefined' &&
  document.fonts !== undefined &&
  document.fonts.check(titleFontSpec(fontSize))
