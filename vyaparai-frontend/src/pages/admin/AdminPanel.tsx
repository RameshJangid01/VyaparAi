import { useEffect, useState } from 'react'
import {
    Alert,
    Avatar,
    Badge,
    Button,
    Card,
    Col,
    Descriptions,
    Form,
    Input,
    InputNumber,
    Modal,
    Popconfirm,
    Row,
    Select,
    Skeleton,
    Space,
    Statistic,
    Switch,
    Table,
    Tabs,
    Tag,
    Typography,
    message,
} from 'antd'
import {
    BankOutlined,
    CalendarOutlined,
    CrownOutlined,
    DatabaseOutlined,
    DollarOutlined,
    PlusOutlined,
    ShopOutlined,
    ShoppingCartOutlined,
    TeamOutlined,
    UserOutlined,
} from '@ant-design/icons'
import {
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'
import dayjs from 'dayjs'

import { adminApi } from '../../api/adminApi'
import type {
    AdminBusiness,
    AdminDashboard,
    AdminProductsOverview,
    AdminSalesOverview,
    AdminUser,
    FestivalEvent,
    FestivalFormValues,
    SystemSettings,
} from '../../types/admin'

const { Title, Text } = Typography

const formatCurrency = (value: number = 0) =>
    `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

const ROLE_OPTIONS = ['Admin', 'Owner', 'User']

export default function AdminPanel() {
    // --------------------------------------------------
    // Overview
    // --------------------------------------------------
    const [dashboard, setDashboard] = useState<AdminDashboard | null>(null)
    const [dashboardLoading, setDashboardLoading] = useState(true)

    const loadDashboard = async () => {
        try {
            setDashboardLoading(true)
            const data = await adminApi.getDashboard()
            setDashboard(data)
        } catch (error) {
            console.error(error)
            message.error('Failed to load admin dashboard.')
        } finally {
            setDashboardLoading(false)
        }
    }

    // --------------------------------------------------
    // Businesses
    // --------------------------------------------------
    const [businesses, setBusinesses] = useState<AdminBusiness[]>([])
    const [businessesLoading, setBusinessesLoading] = useState(true)

    const loadBusinesses = async () => {
        try {
            setBusinessesLoading(true)
            const data = await adminApi.getBusinesses()
            setBusinesses(data)
        } catch (error) {
            console.error(error)
            message.error('Failed to load businesses.')
        } finally {
            setBusinessesLoading(false)
        }
    }

    const handleToggleBusiness = async (
        record: AdminBusiness,
        checked: boolean,
    ) => {
        try {
            await adminApi.toggleBusinessStatus(record.id, checked)
            setBusinesses((prev) =>
                prev.map((b) =>
                    b.id === record.id ? { ...b, isActive: checked } : b,
                ),
            )
            message.success(
                `${record.businessName} ${checked ? 'activated' : 'deactivated'}.`,
            )
        } catch (error) {
            console.error(error)
            message.error('Failed to update business status.')
        }
    }

    // --------------------------------------------------
    // Users
    // --------------------------------------------------
    const [users, setUsers] = useState<AdminUser[]>([])
    const [usersLoading, setUsersLoading] = useState(true)

    const loadUsers = async () => {
        try {
            setUsersLoading(true)
            const data = await adminApi.getUsers()
            setUsers(data)
        } catch (error) {
            console.error(error)
            message.error('Failed to load users.')
        } finally {
            setUsersLoading(false)
        }
    }

    const handleToggleUser = async (record: AdminUser, checked: boolean) => {
        try {
            await adminApi.toggleUserStatus(record.id, checked)
            setUsers((prev) =>
                prev.map((u) =>
                    u.id === record.id ? { ...u, isActive: checked } : u,
                ),
            )
            message.success(
                `${record.ownerName} ${checked ? 'activated' : 'deactivated'}.`,
            )
        } catch (error) {
            console.error(error)
            message.error('Failed to update user status.')
        }
    }

    const handleRoleChange = async (record: AdminUser, role: string) => {
        try {
            await adminApi.updateUserRole(record.id, role)
            setUsers((prev) =>
                prev.map((u) => (u.id === record.id ? { ...u, role } : u)),
            )
            message.success(`${record.ownerName}'s role updated to ${role}.`)
        } catch (error) {
            console.error(error)
            message.error('Failed to update user role.')
        }
    }

    // --------------------------------------------------
    // Products overview
    // --------------------------------------------------
    const [productsOverview, setProductsOverview] =
        useState<AdminProductsOverview | null>(null)
    const [productsLoading, setProductsLoading] = useState(true)

    const loadProductsOverview = async () => {
        try {
            setProductsLoading(true)
            const data = await adminApi.getProductsOverview()
            setProductsOverview(data)
        } catch (error) {
            console.error(error)
            message.error('Failed to load products overview.')
        } finally {
            setProductsLoading(false)
        }
    }

    // --------------------------------------------------
    // Sales overview
    // --------------------------------------------------
    const [salesOverview, setSalesOverview] =
        useState<AdminSalesOverview | null>(null)
    const [salesLoading, setSalesLoading] = useState(true)

    const loadSalesOverview = async () => {
        try {
            setSalesLoading(true)
            const data = await adminApi.getSalesOverview()
            setSalesOverview(data)
        } catch (error) {
            console.error(error)
            message.error('Failed to load sales overview.')
        } finally {
            setSalesLoading(false)
        }
    }

    // --------------------------------------------------
    // Festivals
    // --------------------------------------------------
    const [festivals, setFestivals] = useState<FestivalEvent[]>([])
    const [festivalsLoading, setFestivalsLoading] = useState(true)
    const [festivalModalOpen, setFestivalModalOpen] = useState(false)
    const [editingFestival, setEditingFestival] =
        useState<FestivalEvent | null>(null)
    const [festivalSaving, setFestivalSaving] = useState(false)
    const [festivalForm] = Form.useForm<FestivalFormValues>()

    const loadFestivals = async () => {
        try {
            setFestivalsLoading(true)
            const data = await adminApi.getFestivals()
            setFestivals(data)
        } catch (error) {
            console.error(error)
            message.error('Failed to load festivals.')
        } finally {
            setFestivalsLoading(false)
        }
    }

    const openCreateFestival = () => {
        setEditingFestival(null)
        festivalForm.resetFields()
        festivalForm.setFieldsValue({
            region: 'India',
            demandMultiplier: 1.5,
            relevantCategories: [],
        })
        setFestivalModalOpen(true)
    }

    const openEditFestival = (record: FestivalEvent) => {
        setEditingFestival(record)
        festivalForm.setFieldsValue({
            name: record.name,
            startDate: record.startDate.slice(0, 10) as unknown as string,
            endDate: record.endDate.slice(0, 10) as unknown as string,
            region: record.region,
            relevantCategories: record.relevantCategories,
            demandMultiplier: record.demandMultiplier,
            description: record.description ?? '',
        })
        setFestivalModalOpen(true)
    }

    const handleFestivalSubmit = async () => {
        try {
            const values = await festivalForm.validateFields()
            setFestivalSaving(true)

            const payload: FestivalFormValues = {
                ...values,
                startDate: dayjs(values.startDate).toISOString(),
                endDate: dayjs(values.endDate).toISOString(),
                relevantCategories: values.relevantCategories || [],
            }

            if (editingFestival) {
                await adminApi.updateFestival(editingFestival.id, payload)
                message.success('Festival updated.')
            } else {
                await adminApi.createFestival(payload)
                message.success('Festival created.')
            }

            setFestivalModalOpen(false)
            loadFestivals()
        } catch (error) {
            if (error && typeof error === 'object' && 'errorFields' in error) {
                // antd form validation error - fields already show inline errors
                return
            }
            console.error(error)
            message.error('Failed to save festival.')
        } finally {
            setFestivalSaving(false)
        }
    }

    const handleDeleteFestival = async (id: string) => {
        try {
            await adminApi.deleteFestival(id)
            message.success('Festival deleted.')
            loadFestivals()
        } catch (error) {
            console.error(error)
            message.error('Failed to delete festival.')
        }
    }

    // --------------------------------------------------
    // Settings
    // --------------------------------------------------
    const [settings, setSettings] = useState<SystemSettings | null>(null)
    const [settingsLoading, setSettingsLoading] = useState(true)

    const loadSettings = async () => {
        try {
            setSettingsLoading(true)
            const data = await adminApi.getSettings()
            setSettings(data)
        } catch (error) {
            console.error(error)
            message.error('Failed to load system settings.')
        } finally {
            setSettingsLoading(false)
        }
    }

    // --------------------------------------------------
    // Initial load - only fetch the Overview tab data up front.
    // Other tabs load lazily the first time they're opened (see onTabChange).
    // --------------------------------------------------
    useEffect(() => {
        loadDashboard()
    }, [])

    const loadedTabs = { current: new Set<string>(['overview']) }
    const [loadedTabKeys, setLoadedTabKeys] = useState<Set<string>>(
        new Set(['overview']),
    )

    const handleTabChange = (key: string) => {
        if (loadedTabKeys.has(key)) return

        setLoadedTabKeys((prev) => new Set(prev).add(key))

        if (key === 'businesses') loadBusinesses()
        if (key === 'users') loadUsers()
        if (key === 'products') loadProductsOverview()
        if (key === 'sales') loadSalesOverview()
        if (key === 'festivals') loadFestivals()
        if (key === 'settings') loadSettings()
    }

    // --------------------------------------------------
    // Table columns
    // --------------------------------------------------

    const businessColumns = [
        {
            title: 'Business',
            key: 'business',
            render: (_: unknown, r: AdminBusiness) => (
                <div>
                    <Text strong>{r.businessName}</Text>
                    <br />
                    <Text type="secondary" className="text-xs">
                        {r.ownerName}
                    </Text>
                </div>
            ),
        },
        {
            title: 'Contact',
            key: 'contact',
            render: (_: unknown, r: AdminBusiness) => (
                <div>
                    <div className="text-xs">{r.email}</div>
                    <div className="text-xs text-gray-500">{r.mobileNumber}</div>
                </div>
            ),
        },
        {
            title: 'Products',
            dataIndex: 'totalProducts',
            key: 'totalProducts',
        },
        {
            title: 'Sales',
            dataIndex: 'totalSales',
            key: 'totalSales',
        },
        {
            title: 'Revenue',
            dataIndex: 'totalRevenue',
            key: 'totalRevenue',
            render: (v: number) => formatCurrency(v),
        },
        {
            title: 'Joined',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (v: string) => dayjs(v).format('DD MMM YYYY'),
        },
        {
            title: 'Status',
            key: 'status',
            render: (_: unknown, r: AdminBusiness) => (
                <Switch
                    checked={r.isActive}
                    checkedChildren="Active"
                    unCheckedChildren="Inactive"
                    onChange={(checked) => handleToggleBusiness(r, checked)}
                />
            ),
        },
    ]

    const userColumns = [
        {
            title: 'User',
            key: 'user',
            render: (_: unknown, r: AdminUser) => (
                <div>
                    <Text strong>{r.ownerName}</Text>
                    <br />
                    <Text type="secondary" className="text-xs">
                        {r.email}
                    </Text>
                </div>
            ),
        },
        {
            title: 'Business',
            dataIndex: 'businessName',
            key: 'businessName',
        },
        {
            title: 'Role',
            key: 'role',
            render: (_: unknown, r: AdminUser) => (
                <Select
                    size="small"
                    value={r.role}
                    style={{ width: 110 }}
                    options={ROLE_OPTIONS.map((role) => ({
                        value: role,
                        label: role,
                    }))}
                    onChange={(value) => handleRoleChange(r, value)}
                />
            ),
        },
        {
            title: 'Joined',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (v: string) => dayjs(v).format('DD MMM YYYY'),
        },
        {
            title: 'Status',
            key: 'status',
            render: (_: unknown, r: AdminUser) => (
                <Switch
                    checked={r.isActive}
                    checkedChildren="Active"
                    unCheckedChildren="Inactive"
                    onChange={(checked) => handleToggleUser(r, checked)}
                />
            ),
        },
    ]

    const festivalColumns = [
        {
            title: 'Festival',
            key: 'name',
            render: (_: unknown, r: FestivalEvent) => (
                <div>
                    <Text strong>{r.name}</Text>
                    <br />
                    <Text type="secondary" className="text-xs">
                        {r.region}
                    </Text>
                </div>
            ),
        },
        {
            title: 'Dates',
            key: 'dates',
            render: (_: unknown, r: FestivalEvent) => (
                <div className="text-xs">
                    {dayjs(r.startDate).format('DD MMM')} -{' '}
                    {dayjs(r.endDate).format('DD MMM YYYY')}
                </div>
            ),
        },
        {
            title: 'Categories',
            dataIndex: 'relevantCategories',
            key: 'relevantCategories',
            render: (cats: string[]) => (
                <Space size={[4, 4]} wrap>
                    {cats.map((c) => (
                        <Tag key={c}>{c}</Tag>
                    ))}
                </Space>
            ),
        },
        {
            title: 'Demand',
            dataIndex: 'demandMultiplier',
            key: 'demandMultiplier',
            render: (v: number) => <Tag color="orange">{v}x</Tag>,
        },
        {
            title: 'Days Left',
            dataIndex: 'daysRemaining',
            key: 'daysRemaining',
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: unknown, r: FestivalEvent) => (
                <Space>
                    <Button size="small" onClick={() => openEditFestival(r)}>
                        Edit
                    </Button>
                    <Popconfirm
                        title="Delete this festival?"
                        onConfirm={() => handleDeleteFestival(r.id)}
                        okText="Delete"
                        okButtonProps={{ danger: true }}
                    >
                        <Button size="small" danger>
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ]

    return (
        <div className="min-h-full bg-gray-50 p-3 sm:p-5 lg:p-6">
            <div className="mb-6 flex items-center gap-3">
                <Avatar
                    size={52}
                    icon={<CrownOutlined />}
                    className="bg-purple-100 !text-purple-600"
                />
                <div>
                    <Title level={2} className="!mb-0 !text-brand-navy">
                        Admin Panel
                    </Title>
                    <Text type="secondary">
                        Platform-wide overview and controls
                    </Text>
                </div>
            </div>

            <Tabs
                defaultActiveKey="overview"
                onChange={handleTabChange}
                items={[
                    {
                        key: 'overview',
                        label: 'Overview',
                        children: dashboardLoading ? (
                            <Skeleton active paragraph={{ rows: 6 }} />
                        ) : (
                            <>
                                <Row gutter={[16, 16]} className="mb-6">
                                    <Col xs={12} md={6}>
                                        <Card className="rounded-2xl border-0 shadow-sm">
                                            <Statistic
                                                title="Total Businesses"
                                                value={dashboard?.totalBusinesses ?? 0}
                                                prefix={<ShopOutlined />}
                                            />
                                        </Card>
                                    </Col>
                                    <Col xs={12} md={6}>
                                        <Card className="rounded-2xl border-0 shadow-sm">
                                            <Statistic
                                                title="Total Users"
                                                value={dashboard?.totalUsers ?? 0}
                                                prefix={<TeamOutlined />}
                                            />
                                        </Card>
                                    </Col>
                                    <Col xs={12} md={6}>
                                        <Card className="rounded-2xl border-0 shadow-sm">
                                            <Statistic
                                                title="Total Products"
                                                value={dashboard?.totalProducts ?? 0}
                                                prefix={<DatabaseOutlined />}
                                            />
                                        </Card>
                                    </Col>
                                    <Col xs={12} md={6}>
                                        <Card className="rounded-2xl border-0 shadow-sm">
                                            <Statistic
                                                title="Platform Revenue"
                                                value={dashboard?.totalPlatformRevenue ?? 0}
                                                formatter={(v) =>
                                                    formatCurrency(Number(v))
                                                }
                                                prefix={<DollarOutlined />}
                                            />
                                        </Card>
                                    </Col>
                                    <Col xs={12} md={6}>
                                        <Card className="rounded-2xl border-0 shadow-sm">
                                            <Statistic
                                                title="Total Sales"
                                                value={dashboard?.totalSalesCount ?? 0}
                                                prefix={<ShoppingCartOutlined />}
                                            />
                                        </Card>
                                    </Col>
                                    <Col xs={12} md={6}>
                                        <Card className="rounded-2xl border-0 shadow-sm">
                                            <Statistic
                                                title="Total Purchases"
                                                value={dashboard?.totalPurchasesCount ?? 0}
                                            />
                                        </Card>
                                    </Col>
                                    <Col xs={12} md={6}>
                                        <Card className="rounded-2xl border-0 shadow-sm">
                                            <Statistic
                                                title="Active Businesses"
                                                value={dashboard?.activeBusinesses ?? 0}
                                            />
                                        </Card>
                                    </Col>
                                    <Col xs={12} md={6}>
                                        <Card className="rounded-2xl border-0 shadow-sm">
                                            <Statistic
                                                title="Active Users Today"
                                                value={dashboard?.activeUsersToday ?? 0}
                                                prefix={<UserOutlined />}
                                            />
                                        </Card>
                                    </Col>
                                </Row>

                                <Row gutter={[16, 16]}>
                                    <Col xs={24} lg={12}>
                                        <Card
                                            title="Business Growth (Last 6 Months)"
                                            className="rounded-2xl border-0 shadow-sm"
                                        >
                                            <ResponsiveContainer width="100%" height={260}>
                                                <BarChart
                                                    data={dashboard?.businessGrowth ?? []}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="month" fontSize={12} />
                                                    <YAxis fontSize={12} allowDecimals={false} />
                                                    <Tooltip />
                                                    <Bar
                                                        dataKey="newBusinesses"
                                                        fill="#1e5af0"
                                                        radius={[6, 6, 0, 0]}
                                                    />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </Card>
                                    </Col>
                                    <Col xs={24} lg={12}>
                                        <Card
                                            title="Sales Activity (Last 7 Days)"
                                            className="rounded-2xl border-0 shadow-sm"
                                        >
                                            <ResponsiveContainer width="100%" height={260}>
                                                <LineChart data={dashboard?.salesActivity ?? []}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="date" fontSize={11} />
                                                    <YAxis fontSize={12} />
                                                    <Tooltip />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="revenue"
                                                        stroke="#12b0a0"
                                                        strokeWidth={2}
                                                        dot={false}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </Card>
                                    </Col>
                                </Row>
                            </>
                        ),
                    },
                    {
                        key: 'businesses',
                        label: 'Businesses',
                        children: (
                            <Card className="rounded-2xl border-0 shadow-sm">
                                {businessesLoading ? (
                                    <Skeleton active />
                                ) : (
                                    <Table
                                        rowKey="id"
                                        columns={businessColumns}
                                        dataSource={businesses}
                                        pagination={{ pageSize: 10 }}
                                        scroll={{ x: 900 }}
                                    />
                                )}
                            </Card>
                        ),
                    },
                    {
                        key: 'users',
                        label: 'Users',
                        children: (
                            <Card className="rounded-2xl border-0 shadow-sm">
                                {usersLoading ? (
                                    <Skeleton active />
                                ) : (
                                    <Table
                                        rowKey="id"
                                        columns={userColumns}
                                        dataSource={users}
                                        pagination={{ pageSize: 10 }}
                                        scroll={{ x: 800 }}
                                    />
                                )}
                            </Card>
                        ),
                    },
                    {
                        key: 'products',
                        label: 'Products',
                        children: productsLoading ? (
                            <Skeleton active paragraph={{ rows: 5 }} />
                        ) : (
                            <>
                                <Row gutter={[16, 16]} className="mb-6">
                                    <Col xs={12} md={8}>
                                        <Card className="rounded-2xl border-0 shadow-sm">
                                            <Statistic
                                                title="Total Products"
                                                value={productsOverview?.totalProducts ?? 0}
                                            />
                                        </Card>
                                    </Col>
                                    <Col xs={12} md={8}>
                                        <Card className="rounded-2xl border-0 shadow-sm">
                                            <Statistic
                                                title="Active Categories"
                                                value={
                                                    productsOverview?.activeCategoriesCount ?? 0
                                                }
                                            />
                                        </Card>
                                    </Col>
                                    <Col xs={24} md={8}>
                                        <Card className="rounded-2xl border-0 shadow-sm">
                                            <Statistic
                                                title="Platform Inventory Value"
                                                value={
                                                    productsOverview?.totalPlatformInventoryValue ??
                                                    0
                                                }
                                                formatter={(v) => formatCurrency(Number(v))}
                                            />
                                        </Card>
                                    </Col>
                                </Row>

                                <Card
                                    title="Category Distribution"
                                    className="rounded-2xl border-0 shadow-sm"
                                >
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart
                                            data={productsOverview?.categoryDistribution ?? []}
                                            layout="vertical"
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" allowDecimals={false} />
                                            <YAxis
                                                dataKey="category"
                                                type="category"
                                                width={110}
                                                fontSize={12}
                                            />
                                            <Tooltip />
                                            <Bar
                                                dataKey="productCount"
                                                fill="#2fd189"
                                                radius={[0, 6, 6, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Card>
                            </>
                        ),
                    },
                    {
                        key: 'sales',
                        label: 'Sales',
                        children: salesLoading ? (
                            <Skeleton active paragraph={{ rows: 4 }} />
                        ) : (
                            <Row gutter={[16, 16]}>
                                <Col xs={12} md={6}>
                                    <Card className="rounded-2xl border-0 shadow-sm">
                                        <Statistic
                                            title="Total Orders"
                                            value={salesOverview?.totalOrders ?? 0}
                                        />
                                    </Card>
                                </Col>
                                <Col xs={12} md={6}>
                                    <Card className="rounded-2xl border-0 shadow-sm">
                                        <Statistic
                                            title="Total Revenue"
                                            value={salesOverview?.totalRevenue ?? 0}
                                            formatter={(v) => formatCurrency(Number(v))}
                                        />
                                    </Card>
                                </Col>
                                <Col xs={12} md={6}>
                                    <Card className="rounded-2xl border-0 shadow-sm">
                                        <Statistic
                                            title="Average Order Value"
                                            value={salesOverview?.averageOrderValue ?? 0}
                                            formatter={(v) => formatCurrency(Number(v))}
                                        />
                                    </Card>
                                </Col>
                                <Col xs={12} md={6}>
                                    <Card className="rounded-2xl border-0 shadow-sm">
                                        <Statistic
                                            title="Total Tax Collected"
                                            value={salesOverview?.totalTaxCollected ?? 0}
                                            formatter={(v) => formatCurrency(Number(v))}
                                        />
                                    </Card>
                                </Col>
                            </Row>
                        ),
                    },
                    {
                        key: 'festivals',
                        label: 'Festivals',
                        children: (
                            <Card
                                className="rounded-2xl border-0 shadow-sm"
                                title={
                                    <div className="flex items-center justify-between">
                                        <span>Festival Calendar</span>
                                        <Button
                                            type="primary"
                                            icon={<PlusOutlined />}
                                            onClick={openCreateFestival}
                                        >
                                            Add Festival
                                        </Button>
                                    </div>
                                }
                            >
                                {festivalsLoading ? (
                                    <Skeleton active />
                                ) : (
                                    <Table
                                        rowKey="id"
                                        columns={festivalColumns}
                                        dataSource={festivals}
                                        pagination={{ pageSize: 10 }}
                                        scroll={{ x: 900 }}
                                    />
                                )}
                            </Card>
                        ),
                    },
                    {
                        key: 'settings',
                        label: 'Settings',
                        children: settingsLoading ? (
                            <Skeleton active paragraph={{ rows: 6 }} />
                        ) : (
                            <Card className="rounded-2xl border-0 shadow-sm">
                                {settings && !settings.aiConfigured && (
                                    <Alert
                                        className="mb-4"
                                        type="warning"
                                        showIcon
                                        message="Gemini API key is not configured"
                                        description="The AI copilot is currently running on its deterministic fallback, not the Gemini model. Set GEMINI_API_KEY in VyaparAI.Api/.env to enable it."
                                    />
                                )}
                                <Descriptions column={1} bordered size="middle">
                                    <Descriptions.Item label="Environment">
                                        <Tag color="blue">{settings?.environment}</Tag>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Database">
                                        <Space>
                                            <BankOutlined />
                                            {settings?.databaseName}
                                            <Badge
                                                status={
                                                    settings?.databaseConnected
                                                        ? 'success'
                                                        : 'error'
                                                }
                                                text={
                                                    settings?.databaseConnected
                                                        ? 'Connected'
                                                        : 'Disconnected'
                                                }
                                            />
                                        </Space>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="AI Model">
                                        {settings?.aiModelConfigured}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="AI Configured">
                                        <Badge
                                            status={
                                                settings?.aiConfigured ? 'success' : 'warning'
                                            }
                                            text={settings?.aiConfigured ? 'Yes' : 'No'}
                                        />
                                    </Descriptions.Item>
                                    <Descriptions.Item label="API Version">
                                        {settings?.apiVersion}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Server Time (UTC)">
                                        {settings?.serverTimeUtc}
                                    </Descriptions.Item>
                                </Descriptions>
                            </Card>
                        ),
                    },
                ]}
            />

            <Modal
                title={editingFestival ? 'Edit Festival' : 'Add Festival'}
                open={festivalModalOpen}
                onCancel={() => setFestivalModalOpen(false)}
                onOk={handleFestivalSubmit}
                confirmLoading={festivalSaving}
                okText={editingFestival ? 'Save Changes' : 'Create'}
                destroyOnClose
            >
                <Form form={festivalForm} layout="vertical" className="mt-4">
                    <Form.Item
                        name="name"
                        label="Festival Name"
                        rules={[{ required: true, message: 'Name is required' }]}
                    >
                        <Input placeholder="e.g. Diwali" />
                    </Form.Item>

                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item
                                name="startDate"
                                label="Start Date"
                                rules={[
                                    { required: true, message: 'Start date is required' },
                                ]}
                            >
                                <Input type="date" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="endDate"
                                label="End Date"
                                rules={[
                                    { required: true, message: 'End date is required' },
                                ]}
                            >
                                <Input type="date" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="region" label="Region">
                        <Input placeholder="India" />
                    </Form.Item>

                    <Form.Item
                        name="relevantCategories"
                        label="Relevant Categories"
                        tooltip="Products in these categories will get a demand boost in the AI purchase planner."
                    >
                        <Select
                            mode="tags"
                            placeholder="e.g. Groceries, Sweets, Dairy"
                            open={false}
                        />
                    </Form.Item>

                    <Form.Item
                        name="demandMultiplier"
                        label="Demand Multiplier"
                        rules={[
                            { required: true, message: 'Demand multiplier is required' },
                        ]}
                        tooltip="e.g. 1.5 means 50% more demand expected during this festival."
                    >
                        <InputNumber
                            min={0.5}
                            max={10}
                            step={0.1}
                            style={{ width: '100%' }}
                        />
                    </Form.Item>

                    <Form.Item name="description" label="Description">
                        <Input.TextArea rows={3} placeholder="Optional notes" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}
