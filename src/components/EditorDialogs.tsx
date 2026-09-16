import { useAuth } from '../hooks/authContext'
import { AuthStatus } from '../types/auth'
import { DeleteProjectDialog } from './DeleteProjectDialog/DeleteProjectDialog'
import { ExportAssetsModal } from './ExportAssetsModal/ExportAssetsModal'
import { PostExportSaveDialog } from './PostExportSaveDialog/PostExportSaveDialog'
import { SaveProjectDialog } from './SaveProjectDialog/SaveProjectDialog'
import { SignInDialog } from './SignInDialog/SignInDialog'

export interface EditorDialogsProps {
  exportOpen: boolean
  saveOpen: boolean
  postExportOpen: boolean
  signInOpen: boolean
  deleteProjectOpen: boolean
  deleteProjectName: string
  atProjectLimit?: boolean
  onExportOpenChange: (open: boolean) => void
  onSaveOpenChange: (open: boolean) => void
  onPostExportOpenChange: (open: boolean) => void
  onSignInOpenChange: (open: boolean) => void
  onDeleteProjectOpenChange: (open: boolean) => void
  onExport: (selectedFormatIds: string[]) => Promise<void>
  onSaveConfirm: (name: string) => Promise<void>
  onDeleteProjectConfirm: () => Promise<void> | void
  onRequestSignInAndSave: () => void
}

export const EditorDialogs = ({
  exportOpen,
  saveOpen,
  postExportOpen,
  signInOpen,
  deleteProjectOpen,
  deleteProjectName,
  atProjectLimit = false,
  onExportOpenChange,
  onSaveOpenChange,
  onPostExportOpenChange,
  onSignInOpenChange,
  onDeleteProjectOpenChange,
  onExport,
  onSaveConfirm,
  onDeleteProjectConfirm,
  onRequestSignInAndSave,
}: EditorDialogsProps) => {
  const { authStatus } = useAuth()

  let postExportMode: 'save' | 'sign-in-and-save' | 'at-limit' = 'sign-in-and-save'
  if (atProjectLimit) {
    postExportMode = 'at-limit'
  } else if (authStatus === AuthStatus.Authenticated) {
    postExportMode = 'save'
  }

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
        mode={postExportMode}
        onSave={() => {
          onPostExportOpenChange(false)
          onSaveOpenChange(true)
        }}
        onSignInAndSave={() => {
          onPostExportOpenChange(false)
          onRequestSignInAndSave()
        }}
      />
      <DeleteProjectDialog
        open={deleteProjectOpen}
        projectName={deleteProjectName}
        onOpenChange={onDeleteProjectOpenChange}
        onConfirm={onDeleteProjectConfirm}
      />
      <SignInDialog open={signInOpen} onOpenChange={onSignInOpenChange} />
    </>
  )
}
