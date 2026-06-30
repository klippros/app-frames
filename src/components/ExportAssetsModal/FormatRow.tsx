import { Badge, Checkbox, HStack, Stack, Text } from '@chakra-ui/react'
import type { ExportFormat } from '../../types'

export interface FormatRowProps {
  format: ExportFormat
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

export const FormatRow = ({ format, checked, onCheckedChange }: FormatRowProps) => (
  <Checkbox.Root
    checked={checked}
    onCheckedChange={(event) => onCheckedChange(!!event.checked)}
    alignItems="flex-start"
    py={2}
  >
    <Checkbox.HiddenInput />
    <Checkbox.Control mt={0.5} />
    <Stack gap={0.5} flex="1">
      <HStack gap={2} align="center">
        <Checkbox.Label fontWeight="medium">{format.label}</Checkbox.Label>
        {format.recommended ? (
          <Badge colorPalette="blue" size="sm">
            Recommended
          </Badge>
        ) : null}
      </HStack>
      {format.description ? (
        <Text fontSize="sm" color="fg.muted">
          {format.description}
        </Text>
      ) : null}
      <Text fontSize="sm" color="fg.muted">
        {format.width}×{format.height}
      </Text>
    </Stack>
  </Checkbox.Root>
)
