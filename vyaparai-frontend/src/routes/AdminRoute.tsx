import { Navigate, Outlet } from 'react-router-dom'
import { Result, Button } from 'antd'
import { useAuth } from '../context/AuthContext'

// Sits inside ProtectedRoute in App.tsx, so by the time this renders the
// user is already known to be logged in - this only adds the role check.
export default function AdminRoute() {
    const { user } = useAuth()

    if (!user) {
        return <Navigate to="/login" replace />
    }

    if (user.role !== 'Admin') {
        return (
            <div className="flex h-full min-h-[70vh] items-center justify-center">
                <Result
                    status="403"
                    title="Admin access only"
                    subTitle="You don't have permission to view the admin panel."
                    extra={
                        <Button type="primary" href="/dashboard">
                            Back to Dashboard
                        </Button>
                    }
                />
            </div>
        )
    }

    return <Outlet />
}
