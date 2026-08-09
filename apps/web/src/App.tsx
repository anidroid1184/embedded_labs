import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { HomePage } from './pages/HomePage'
import { LessonPage } from './pages/LessonPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/lessons/:slug" element={<LessonPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
