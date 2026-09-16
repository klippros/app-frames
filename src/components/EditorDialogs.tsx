import { useAuth } from '../hooks/authContext'
import { AuthStatus } from '../types/auth'
import { ExportAssetsModal } from './ExportAssetsModal/ExportAssetsModal'
import { PostExportSaveDialog } from './PostExportSaveDialog/PostExportSaveDialog'
import { SaveProjectDialog } from './SaveProjectDialog/SaveProjectDialog'
import { SignInDialog } from './SignInDialog/SignInDialog'

export interface EditorDialogsProps {
  exportOpen: boolean
  saveOpen: boolean
  postExportOpen: boolean
  signInOpen: boolean
  onExportOpenChange: (open: boolean) => void
  onSaveOpenChange: (open: boolean) => void
  onPostExportOpenChange: (open: boolean) => void
  onSignInOpenChange: (open: boolean) => void
  onExport: (selectedFormatIds: string[]) => Promise<void>
  onSaveConfirm: (name: string) => Promise<void>
  onRequestSignInAndSave: () => void
}

export const EditorDialogs = ({
  exportOpen,
  saveOpen,
  postExportOpen,
  signInOpen,
  onExportOpenChange,
  onSaveOpenChange,
  onPostExportOpenChange,
  onSignInOpenChange,
  onExport,
  onSaveConfirm,
  onRequestSignInAndSave,
}: EditorDialogsProps) => {
  const { authStatus } = useAuth()

  return (
    <>
      <ExportAssetsModal open={exportOpen} onOpenChange={onExportOpenChange} onExport={onExport} />
      <SaveProjectDialog
        open={saveOpen}
        onOpenChange={onSaveOpenChange}
        onConfirm={onSaveConfirm}
        description="Give this sketch a name to keep it in your account."
      />
      <PostExportSaveDialog
        open={postExportOpen}
        onOpenChange={onPostExportOpenChange}
        mode={authStatus === AuthStatus.Authenticated ? 'save' : 'sign-in-and-save'}
        onSave={() => {
          onPostExportOpenChange(false)
          onSaveOpenChange(true)
        }}
        onSignInAndSave={() => {
          onPostExportOpenChange(false)
          onRequestSignInAndSave()
        }}
      />
      <SignInDialog open={signInOpen} onOpenChange={onSignInOpenChange} />
    </>
  )
}
