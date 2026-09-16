import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'
import { App } from '../App'
import { AuthCallbackPage } from './AuthCallbackPage'

const basename = import.meta.env.BASE_URL

const router = createBrowserRouter(
  [
    { path: '/auth/callback', element: <AuthCallbackPage /> },
    {
      path: '/',
      element: <App />,
      children: [
        { index: true, element: null },
        { path: 'sketch', element: null },
        { path: 'projects/:projectId', element: null },
      ],
    },
    { path: '*', element: <Navigate to="/" replace /> },
  ],
  { basename },
)

export const AppRouter = () => <RouterProvider router={router} />
