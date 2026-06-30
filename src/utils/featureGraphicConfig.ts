export interface OutputDimensions {
  width: number
  height: number
}

export interface GradientConfig {
  baseColor: string
  centerHighlightOpacity: number
  edgeDarknessOpacity: number
}

export interface FeatureGraphicConfig {
  dimensions: OutputDimensions
  centerX: number
  centerY: number
  screenshotHeight: number
  screenshotRadius: number
  fanAngleRange: number
  fanSpreadPx: number
  fanDropPx: number
  sidePaddingPx: number
}

export const featureGraphicGradient: GradientConfig = {
  baseColor: '#2f43b4',
  centerHighlightOpacity: 0.22,
  edgeDarknessOpacity: 0.98,
}

export const featureGraphicConfig: FeatureGraphicConfig = {
  dimensions: {
    width: 1024,
    height: 500,
  },
  centerX: 512,
  centerY: 214,
  screenshotHeight: 380,
  screenshotRadius: 26,
  fanAngleRange: 34,
  fanSpreadPx: 165,
  fanDropPx: 72,
  sidePaddingPx: 70,
}
