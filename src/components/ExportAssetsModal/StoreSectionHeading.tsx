import { HStack, Text } from '@chakra-ui/react'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export interface StoreSectionHeadingProps {
  icon: IconDefinition
  label: string
}

export const StoreSectionHeading = ({ icon, label }: StoreSectionHeadingProps) => (
  <HStack gap={2} color="whiteAlpha.700">
    <FontAwesomeIcon icon={icon} />
    <Text fontSize="xs" fontWeight="semibold" letterSpacing="wider">
      {label}
    </Text>
  </HStack>
)
