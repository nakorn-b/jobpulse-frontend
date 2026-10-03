import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { AppShell } from '@/components/app-shell'
import ChatPage from '@/pages/chat'

const DashboardPage = lazy(() => import('@/pages/dashboard'))

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: <ChatPage /> },
      {
        path: 'dashboard',
        element: (
          <Suspense>
            <DashboardPage />
          </Suspense>
        ),
      },
      { path: '*', element: <ChatPage /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
