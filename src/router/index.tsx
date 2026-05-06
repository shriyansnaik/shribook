import { createBrowserRouter, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import SuperAdminRoute from './SuperAdminRoute'
import LoginPage from '@/pages/LoginPage'
import GroupSelectPage from '@/pages/GroupSelectPage'
import GroupLayout from '@/pages/group/GroupLayout'
import DashboardPage from '@/pages/group/DashboardPage'
import EventsPage from '@/pages/group/EventsPage'
import MembersPage from '@/pages/group/MembersPage'
import SettingsPage from '@/pages/group/SettingsPage'
import EventCreatePage from '@/pages/event/EventCreatePage'
import EventDetailPage from '@/pages/event/EventDetailPage'
import EventEditPage from '@/pages/event/EventEditPage'
import SuperAdminPage from '@/pages/super-admin/SuperAdminPage'
import NotFoundPage from '@/pages/error/NotFoundPage'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      { index: true, element: <Navigate to="/groups" replace /> },
      { path: 'groups', element: <GroupSelectPage /> },
      {
        path: 'groups/:groupId',
        element: <GroupLayout />,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'events', element: <EventsPage /> },
          { path: 'events/new', element: <EventCreatePage /> },
          { path: 'events/:eventId', element: <EventDetailPage /> },
          { path: 'events/:eventId/edit', element: <EventEditPage /> },
          { path: 'members', element: <MembersPage /> },
          { path: 'settings', element: <SettingsPage /> },
        ],
      },
      {
        path: 'super-admin',
        element: (
          <SuperAdminRoute>
            <SuperAdminPage />
          </SuperAdminRoute>
        ),
      },
    ],
  },
  { path: '/404', element: <NotFoundPage /> },
  { path: '*', element: <Navigate to="/404" replace /> },
])

export default router
