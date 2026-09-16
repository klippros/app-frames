import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/authContext'
import { AuthStatus } from '../types/auth'

export const usePendingSaveAfterAuth = (
  pending: boolean,
  setPending: (value: boolean) => void,
  openSave: () => void,
  closeSignIn: () => void,
  atProjectLimit = false,
) => {
  const { authStatus } = useAuth()

  useEffect(() => {
    if (!pending || authStatus !== AuthStatus.Authenticated) {
      return
    }

    setPending(false)
    closeSignIn()

    if (atProjectLimit) {
      return
    }

    openSave()
  }, [authStatus, atProjectLimit, closeSignIn, openSave, pending, setPending])
}

export const useEditorDialogState = (atProjectLimit = false) => {
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [postExportOpen, setPostExportOpen] = useState(false)
  const [signInOpen, setSignInOpen] = useState(false)
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false)
  const [pendingSaveAfterAuth, setPendingSaveAfterAuth] = useState(false)

  usePendingSaveAfterAuth(
    pendingSaveAfterAuth,
    setPendingSaveAfterAuth,
    () => {
      setSaveDialogOpen(true)
    },
    () => {
      setSignInOpen(false)
    },
    atProjectLimit,
  )

  return {
    exportModalOpen,
    setExportModalOpen,
    saveDialogOpen,
    setSaveDialogOpen,
    postExportOpen,
    setPostExportOpen,
    signInOpen,
    setSignInOpen,
    deleteProjectOpen,
    setDeleteProjectOpen,
    pendingSaveAfterAuth,
    setPendingSaveAfterAuth,
  }
}
