import { Button, Form, Input, App as AntApp } from 'antd'
import { MailOutlined, LockOutlined, ShopOutlined, UserOutlined, PhoneOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../../api/authApi'
import { useAuth } from '../../context/AuthContext'
import Logo from '../../components/common/Logo'
import type { SignupRequest } from '../../types/auth'

export default function Signup() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const { message } = AntApp.useApp()

  const mutation = useMutation({
    mutationFn: (payload: SignupRequest) => authApi.signup(payload),
    onSuccess: (data) => {
      login(data)
      message.success('Account created! Welcome to VyaparAI.')
      navigate('/dashboard', { replace: true })
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message ?? 'Signup failed. Please try again.')
    },
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white to-slate-50 px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <Logo height={56} />
          <p className="text-sm text-gray-500">Create your business account</p>
        </div>

        <Form layout="vertical" onFinish={(v) => mutation.mutate(v)} disabled={mutation.isPending}>
          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
            <Form.Item
              name="businessName"
              label="Business Name"
              rules={[{ required: true, message: 'Business name is required' }]}
            >
              <Input prefix={<ShopOutlined />} placeholder="Sharma General Store" size="large" />
            </Form.Item>
            <Form.Item
              name="ownerName"
              label="Owner Name"
              rules={[{ required: true, message: 'Owner name is required' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Rohit Sharma" size="large" />
            </Form.Item>
          </div>

          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, message: 'Email is required' }, { type: 'email', message: 'Enter a valid email' }]}
          >
            <Input prefix={<MailOutlined />} placeholder="you@business.com" size="large" />
          </Form.Item>

          <Form.Item
            name="mobileNumber"
            label="Mobile Number"
            rules={[
              { required: true, message: 'Mobile number is required' },
              { pattern: /^[0-9]{10}$/, message: 'Enter a valid 10-digit mobile number' },
            ]}
          >
            <Input prefix={<PhoneOutlined />} placeholder="9876543210" size="large" maxLength={10} />
          </Form.Item>

          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Password is required' }, { min: 6, message: 'Minimum 6 characters' }]}
              hasFeedback
            >
              <Input.Password prefix={<LockOutlined />} placeholder="••••••••" size="large" />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label="Confirm Password"
              dependencies={['password']}
              hasFeedback
              rules={[
                { required: true, message: 'Please confirm your password' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) return Promise.resolve()
                    return Promise.reject(new Error('Passwords do not match'))
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="••••••••" size="large" />
            </Form.Item>
          </div>

          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={mutation.isPending}
            className="mt-2 bg-brand-blue"
          >
            Create Account
          </Button>
        </Form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-blue">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}
