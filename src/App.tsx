import { Outlet } from 'react-router-dom'
import { EditorApp } from './components/EditorApp'

/** Layout route: stays mounted across `/` and `/projects/:projectId`. */
export const App = () => (
  <>
    <EditorApp />
    <Outlet />
  </>
)
