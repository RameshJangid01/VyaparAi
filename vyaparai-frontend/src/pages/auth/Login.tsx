import { Button, Form, Input, App as AntApp } from 'antd'
import { MailOutlined, LockOutlined } from '@ant-design/icons'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../../api/authApi'
import { useAuth } from '../../context/AuthContext'
import Logo from '../../components/common/Logo'
import type { LoginRequest } from '../../types/auth'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: { pathname: string } } }
  const { message } = AntApp.useApp()

  const mutation = useMutation({
    mutationFn: (payload: LoginRequest) => authApi.login(payload),
    onSuccess: (data) => {
      login(data)
      message.success('Welcome back!')
      const destination =
        data.user.role === 'Admin'
          ? '/admin'
          : (location.state?.from?.pathname ?? '/dashboard')
      navigate(destination, { replace: true })
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message ?? 'Login failed. Please try again.')
    },
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white to-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <Logo height={56} />
          <p className="text-sm text-gray-500">Manage Today. Predict Tomorrow.</p>
        </div>

        <Form layout="vertical" onFinish={(v) => mutation.mutate(v)} disabled={mutation.isPending}>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, message: 'Email is required' }, { type: 'email', message: 'Enter a valid email' }]}
          >
            <Input prefix={<MailOutlined />} placeholder="you@business.com" size="large" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Password is required' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="••••••••" size="large" />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={mutation.isPending}
            className="mt-2 bg-brand-blue"
          >
            Login
          </Button>
        </Form>

        <p className="mt-6 text-center text-sm text-gray-500">
          New to VyaparAI?{' '}
          <Link to="/signup" className="font-medium text-brand-blue">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}