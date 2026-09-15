import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/authContext'
import { AuthStatus } from '../types/auth'

export const usePendingSaveAfterAuth = (
  pending: boolean,
  setPending: (value: boolean) => void,
  openSave: () => void,
  closeSignIn: () => void,
) => {
  const { authStatus } = useAuth()

  useEffect(() => {
    if (pending && authStatus === AuthStatus.Authenticated) {
      setPending(false)
      closeSignIn()
      openSave()
    }
  }, [authStatus, closeSignIn, openSave, pending, setPending])
}

export const useEditorDialogState = () => {
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [postExportOpen, setPostExportOpen] = useState(false)
  const [signInOpen, setSignInOpen] = useState(false)
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
    pendingSaveAfterAuth,
    setPendingSaveAfterAuth,
  }
}
