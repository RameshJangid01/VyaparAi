// import { Menu } from 'antd'
// import {
//   DashboardOutlined,
//   ShoppingCartOutlined,
//   AppstoreOutlined,
//   DatabaseOutlined,
//   ShoppingOutlined,
//   TeamOutlined,
//   ShopOutlined,
//   BarChartOutlined,
//   RobotOutlined,
//   SettingOutlined,
//   LogoutOutlined,
// } from '@ant-design/icons'
// import { useNavigate, useLocation } from 'react-router-dom'
// import Logo from '../common/Logo'
// import { useAuth } from '../../context/AuthContext'

// const items = [
//   { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
//   { key: '/billing', icon: <ShoppingCartOutlined />, label: 'Billing' },
//   { key: '/products', icon: <AppstoreOutlined />, label: 'Products' },
//   { key: '/inventory', icon: <DatabaseOutlined />, label: 'Inventory' },
//   { key: '/purchases', icon: <ShoppingOutlined />, label: 'Purchases' },
//   { key: '/customers', icon: <TeamOutlined />, label: 'Customers' },
//   { key: '/suppliers', icon: <ShopOutlined />, label: 'Suppliers' },
//   { key: '/reports', icon: <BarChartOutlined />, label: 'Reports' },
//   { key: '/ai', icon: <RobotOutlined />, label: 'VyaparAI' },
//   { key: '/settings', icon: <SettingOutlined />, label: 'Settings' },

// ]

// interface SidebarProps {
//   collapsed?: boolean
//   onNavigate?: () => void
// }

// export default function Sidebar({ collapsed, onNavigate }: SidebarProps) {
//   const navigate = useNavigate()
//   const location = useLocation()
//   const { logout } = useAuth()

//   const handleClick = (key: string) => {
//     if (key === '/logout') {
//       logout()
//       navigate('/login')
//       return
//     }
//     navigate(key)
//     onNavigate?.()
//   }

//   return (
//     <div className="flex h-full flex-col bg-white">
//       <div className="flex items-center gap-2 px-4 py-4">
//         <Logo height={collapsed ? 28 : 32} />
//         {!collapsed && (
//           <span className="text-lg font-semibold text-brand-navy">VyaparAI</span>
//         )}
//       </div>
//       <Menu
//         mode="inline"
//         selectedKeys={[location.pathname]}
//         items={items}
//         onClick={({ key }) => handleClick(key)}
//         className="flex-1 border-r-0"
//       />
//       <div className="border-t border-gray-100 p-2">
//         <Menu
//           mode="inline"
//           selectable={false}
//           items={[{ key: '/logout', icon: <LogoutOutlined />, label: 'Logout' }]}
//           onClick={({ key }) => handleClick(key)}
//         />
//       </div>
//     </div>
//   )
// }



import { Menu } from 'antd'
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  AppstoreOutlined,
  DatabaseOutlined,
  ShoppingOutlined,
  TeamOutlined,
  ShopOutlined,
  BarChartOutlined,
  RobotOutlined,
  SettingOutlined,
  LogoutOutlined,
  CrownOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import Logo from '../common/Logo'
import { useAuth } from '../../context/AuthContext'

interface SidebarProps {
  collapsed?: boolean
  onNavigate?: () => void
}

export default function Sidebar({ collapsed, onNavigate }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout, user } = useAuth()

  const items =
    user?.role === 'Admin'
      ? [{ key: '/admin', icon: <CrownOutlined />, label: 'Admin Panel' }]
      : [
        { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
        { key: '/billing', icon: <ShoppingCartOutlined />, label: 'Billing' },
        { key: '/products', icon: <AppstoreOutlined />, label: 'Products' },
        { key: '/inventory', icon: <DatabaseOutlined />, label: 'Inventory' },
        { key: '/purchases', icon: <ShoppingOutlined />, label: 'Purchases' },
        { key: '/customers', icon: <TeamOutlined />, label: 'Customers' },
        { key: '/suppliers', icon: <ShopOutlined />, label: 'Suppliers' },
        { key: '/reports', icon: <BarChartOutlined />, label: 'Reports' },
        { key: '/ai', icon: <RobotOutlined />, label: 'VyaparAI' },
        { key: '/settings', icon: <SettingOutlined />, label: 'Settings' },
      ]

  const handleClick = (key: string) => {
    if (key === '/logout') {
      logout()
      navigate('/login')
      return
    }

    navigate(key)
    onNavigate?.()
  }

  return (
    <div className="fixed left-0 top-0 z-50 flex h-screen w-[240px] flex-col bg-white">
      {/* Logo */}
      <div className="flex shrink-0 items-center gap-2 px-4 py-4">
        <Logo height={collapsed ? 28 : 32} />
        {!collapsed && (
          <span className="text-lg font-semibold text-brand-navy">
            VyaparAI
          </span>
        )}
      </div>

      {/* Main Menu */}
      <div className="min-h-0 flex-1">
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={items}
          onClick={({ key }) => handleClick(key)}
          className="!w-full !border-r-0"
        />
      </div>

      {/* Logout */}
      <div className="shrink-0 border-t border-gray-100 p-2">
        <Menu
          mode="inline"
          selectable={false}
          items={[
            {
              key: '/logout',
              icon: <LogoutOutlined />,
              label: 'Logout',
            },
          ]}
          onClick={({ key }) => handleClick(key)}
          className="!w-full !border-r-0"
        />
      </div>
    </div>
  )
}