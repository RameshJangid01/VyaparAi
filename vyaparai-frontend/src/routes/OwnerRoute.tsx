import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Sits inside ProtectedRoute in App.tsx. Blocks Admin accounts from the
// per-business pages (Dashboard, Billing, Products, etc.) and sends them
// to the Admin Panel instead - Admins don't own a business/store.
export default function OwnerRoute() {
    const { user } = useAuth()

    if (user?.role === 'Admin') {
        return <Navigate to="/admin" replace />
    }

    return <Outlet />
}