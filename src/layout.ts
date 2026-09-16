export const mainContentMaxWidth = '1200px' as const

/** Shared size for toolbar icon buttons and matching controls (e.g. hue selector). */
export const toolbarControlSize = '44px' as const

/** Max CSS width of editor preview frames before they shrink to fit the viewport. */
export const previewFrameMaxWidth = '320px' as const

/** Top padding so overlay action buttons sit fully below the header. */
export const framesEditorPaddingTop =
  `calc(${toolbarControlSize} / 2 + var(--chakra-spacing-3))` as const

/** Height of the fixed app footer. */
export const footerHeight = '6rem' as const
