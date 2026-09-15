import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { App } from '../App'
import { AuthCallbackPage } from './AuthCallbackPage'

export const AppRouter = () => (
  <BrowserRouter basename={import.meta.env.BASE_URL}>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
)
