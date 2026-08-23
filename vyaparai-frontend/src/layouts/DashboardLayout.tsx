import { useState } from 'react'
import { Layout, Drawer } from 'antd'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import Header from '../components/layout/Header'

const { Sider, Content } = Layout

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <Layout className="min-h-screen font-sans">
      <Sider
        theme="light"
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        breakpoint="md"
        collapsedWidth={0}
        trigger={null}
        className="hidden border-r border-gray-100 md:block"
        width={230}
      >
        <Sidebar collapsed={collapsed} />
      </Sider>

      <Drawer
        placement="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        closable={false}
        bodyStyle={{ padding: 0 }}
        width={240}
      >
        <Sidebar onNavigate={() => setDrawerOpen(false)} />
      </Drawer>

      <Layout>
        <Header onMenuClick={() => setDrawerOpen(true)} />
        <Content className="m-3 md:m-6">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
