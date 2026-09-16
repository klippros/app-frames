export const SKETCH_PATH = '/sketch' as const

export const isSketchPath = (pathname: string): boolean => pathname === SKETCH_PATH
