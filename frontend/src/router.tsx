/* eslint-disable react-refresh/only-export-components */
import { Navigate, Outlet, createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuditPage } from '@/pages/AuditPage'
import { ChatPage } from '@/pages/ChatPage'
import { ClassifierPage } from '@/pages/ClassifierPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { LoginPage } from '@/pages/LoginPage'
import { PatientProfilePage } from '@/pages/PatientProfilePage'
import { PatientsPage } from '@/pages/PatientsPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { RequestDetailPage } from '@/pages/RequestDetailPage'
import { RequestsPage } from '@/pages/RequestsPage'
import { SchedulePage } from '@/pages/SchedulePage'
import { UsersPage } from '@/pages/UsersPage'
import { useAuthStore } from '@/store/authStore'

function PrivateRoute() {
  const { accessToken } = useAuthStore()
  return accessToken ? <Outlet /> : <Navigate to='/login' />
}

function AdminRoute() {
  const { user } = useAuthStore()
  return user?.role === 'admin' ? <Outlet /> : <Navigate to='/dashboard' />
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <PrivateRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <Navigate to='/dashboard' /> },
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/classifier', element: <ClassifierPage /> },
          { path: '/chat', element: <ChatPage /> },
          { path: '/schedule', element: <SchedulePage /> },
          { path: '/patients', element: <PatientsPage /> },
          { path: '/patients/:id', element: <PatientProfilePage /> },
          { path: '/requests', element: <RequestsPage /> },
          { path: '/requests/:id', element: <RequestDetailPage /> },
          { path: '/profile', element: <ProfilePage /> },
          {
            element: <AdminRoute />,
            children: [
              { path: '/users', element: <UsersPage /> },
              { path: '/audit', element: <AuditPage /> },
            ],
          },
        ],
      },
    ],
  },
])
