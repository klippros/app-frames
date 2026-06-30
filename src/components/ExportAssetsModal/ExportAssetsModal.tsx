import { Button, Dialog, Stack, VStack } from '@chakra-ui/react'
import { faAndroid, faApple } from '@fortawesome/free-brands-svg-icons'
import { useState } from 'react'
import { DEFAULT_SELECTED_FORMAT_IDS, getFormatsByStore } from '../../utils/exportFormats'
import { FormatRow } from './FormatRow'
import { StoreSectionHeading } from './StoreSectionHeading'

export interface ExportAssetsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExport: (selectedFormatIds: string[]) => Promise<void>
}

export const ExportAssetsModal = ({ open, onOpenChange, onExport }: ExportAssetsModalProps) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(DEFAULT_SELECTED_FORMAT_IDS)
  const [isExporting, setIsExporting] = useState(false)

  const toggleFormat = (formatId: string, checked: boolean) => {
    setSelectedIds((current) =>
      checked ? [...new Set([...current, formatId])] : current.filter((id) => id !== formatId),
    )
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await onExport(selectedIds)
      onOpenChange(false)
    } finally {
      setIsExporting(false)
    }
  }

  const appStoreFormats = getFormatsByStore('app-store')
  const googlePlayFormats = getFormatsByStore('google-play')

  return (
    <Dialog.Root open={open} onOpenChange={(details) => onOpenChange(details.open)} size="lg">
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>Export assets</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body>
            <VStack align="stretch" gap={6}>
              <Stack gap={1}>
                <StoreSectionHeading icon={faApple} label="APP STORE" />
                {appStoreFormats.map((format) => (
                  <FormatRow
                    key={format.id}
                    format={format}
                    checked={selectedIds.includes(format.id)}
                    onCheckedChange={(checked) => toggleFormat(format.id, checked)}
                  />
                ))}
              </Stack>
              <Stack gap={1}>
                <StoreSectionHeading icon={faAndroid} label="GOOGLE PLAY" />
                {googlePlayFormats.map((format) => (
                  <FormatRow
                    key={format.id}
                    format={format}
                    checked={selectedIds.includes(format.id)}
                    onCheckedChange={(checked) => toggleFormat(format.id, checked)}
                  />
                ))}
              </Stack>
            </VStack>
          </Dialog.Body>
          <Dialog.Footer>
            <Dialog.ActionTrigger asChild>
              <Button variant="outline">Cancel</Button>
            </Dialog.ActionTrigger>
            <Button
              onClick={handleExport}
              loading={isExporting}
              disabled={selectedIds.length === 0 || isExporting}
            >
              Download
            </Button>
          </Dialog.Footer>
          <Dialog.CloseTrigger />
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  )
}
