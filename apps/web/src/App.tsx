import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { HomePage } from './pages/HomePage'
import { LessonPage } from './pages/LessonPage'

const routerBasename =
  import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

export default function App() {
  return (
    <BrowserRouter basename={routerBasename}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/lessons/:slug" element={<LessonPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
