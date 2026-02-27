import { RouteObject } from 'react-router-dom'
import Layout from './components/Layout'
import NotFound from './pages/NotFound'
import AdminLayout from './pages/admin/AdminLayout'
import AdminLogin from './pages/admin/AdminLogin'
import AdminOverview from './pages/admin/AdminOverview'
import AdminHome from './pages/admin/AdminHome'
import AdminProjects from './pages/admin/AdminProjects'
import AdminResume from './pages/admin/AdminResume'
import { getPublicDoc } from './lib/content'

export type AppLayoutLoaderData = {
  site: Promise<Record<string, unknown> | null>
}

export const routes: RouteObject[] = [
  {
    id: 'app-shell',
    path: '/',
    loader: () => ({
      site: getPublicDoc('site')
    }),
    element: <Layout />,
    children: [
      {
        index: true,
        lazy: () => import('./pages/Home')
      },
      {
        path: 'about',
        lazy: () => import('./pages/About')
      },
      {
        path: 'projects',
        lazy: () => import('./pages/Projects')
      },
      {
        path: 'projects/:projectId',
        lazy: () => import('./pages/ProjectDetail')
      },
      {
        path: 'resume',
        lazy: () => import('./pages/Resume')
      },
      {
        path: 'contact',
        lazy: () => import('./pages/Contact')
      }
    ]
  },
  { path: '/admin/login', element: <AdminLogin /> },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminOverview /> },
      { path: 'home', element: <AdminHome /> },
      { path: 'projects', element: <AdminProjects /> },
      { path: 'resume', element: <AdminResume /> }
    ]
  },
  { path: '*', element: <NotFound /> }
]
