import { Avatar, Badge, Dropdown, Input, Tag } from 'antd'
import type { MenuProps } from 'antd'
import {
  MenuOutlined,
  BellOutlined,
  UserOutlined,
  SearchOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

interface HeaderProps {
  onMenuClick?: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const profileItems: MenuProps['items'] = [
    { key: 'settings', label: 'Settings', onClick: () => navigate('/settings') },
    { key: 'logout', label: 'Logout', onClick: () => { logout(); navigate('/login') } },
  ]

  return (
    <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-white px-4 py-3 md:px-6">
      <div className="flex items-center gap-3">
        <button
          className="rounded-md p-2 text-brand-navy hover:bg-gray-100 md:hidden"
          onClick={onMenuClick}
        >
          <MenuOutlined />
        </button>
        <Input
          prefix={<SearchOutlined className="text-gray-400" />}
          placeholder="Search products, customers, invoices..."
          className="hidden w-72 rounded-lg md:block"
        />
      </div>

      <div className="flex items-center gap-4">
        <Tag color="blue" className="hidden md:inline-flex">
          {user?.businessName ?? 'My Business'}
        </Tag>
        <Badge dot color="#2FD189">
          <ThunderboltOutlined className="text-lg text-brand-teal" title="AI Alerts" />
        </Badge>
        <Badge count={0} showZero={false}>
          <BellOutlined className="text-lg text-brand-navy" />
        </Badge>
        <Dropdown menu={{ items: profileItems }} trigger={['click']}>
          <Avatar icon={<UserOutlined />} className="cursor-pointer bg-brand-blue" />
        </Dropdown>
      </div>
    </div>
  )
}
