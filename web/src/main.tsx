import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { routes } from './routes'
import { ThemeProvider } from './lib/theme'
import './styles.css'
import './themes.css'
import { AuthProvider } from './lib/auth'
import { LanguageProvider } from './lib/language'

const router = createBrowserRouter(routes)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <LanguageProvider>
        <ThemeProvider>
          <RouterProvider router={router} />
        </ThemeProvider>
      </LanguageProvider>
    </AuthProvider>
  </React.StrictMode>
)
