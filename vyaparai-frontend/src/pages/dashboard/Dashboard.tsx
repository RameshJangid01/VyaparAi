import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Progress,
  Row,
  Skeleton,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd'
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  InboxOutlined,
  ReloadOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  TrophyOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'

const { Title, Text } = Typography
interface Festival {
  id: string
  name: string
  startDate: string
  endDate: string
  region: string
  relevantCategories: string[]
  demandMultiplier: number
  description?: string
  daysRemaining: number
  isActive: boolean
}
interface DashboardStats {
  todaySales: number
  todayProfit: number
  totalRevenue: number
  totalProducts: number
  lowStock: number
  customers: number
  pendingPayments: number
  salesGrowth: number
  profitGrowth: number
}

interface SalesTrend {
  date: string
  sales: number
  profit: number
}

interface RevenuePurchase {
  month: string
  revenue: number
  purchases: number
}

interface TopProduct {
  id: string
  name: string
  quantity: number
  revenue: number
}

interface LowStockProduct {
  id: string
  name: string
  stock: number
  minStock: number
}

interface RecentSale {
  id: string
  invoiceNumber: string
  customerName: string
  amount: number
  paymentStatus: string
  date: string
}

interface AIInsight {
  title: string
  message: string
  type: 'success' | 'warning' | 'info'
}

interface DashboardData {
  stats: DashboardStats
  salesTrend: SalesTrend[]
  revenueVsPurchases: RevenuePurchase[]
  topProducts: TopProduct[]
  lowStockProducts: LowStockProduct[]
  recentSales: RecentSale[]
  aiInsights: AIInsight[]
  upcomingFestivals: Festival[]
}

const emptyDashboard: DashboardData = {
  stats: {
    todaySales: 0,
    todayProfit: 0,
    totalRevenue: 0,
    totalProducts: 0,
    lowStock: 0,
    customers: 0,
    pendingPayments: 0,
    salesGrowth: 0,
    profitGrowth: 0,
  },

  salesTrend: [],
  revenueVsPurchases: [],
  topProducts: [],
  lowStockProducts: [],
  recentSales: [],
  aiInsights: [],
  upcomingFestivals: [],
}

const currency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value || 0)

const numberFormat = (value: number) =>
  new Intl.NumberFormat('en-IN').format(value || 0)

const getAuthToken = () => {
  return localStorage.getItem('vyaparai_token') || ''
}
const mapDashboardResponse = (data: any): DashboardData => {
  const kpis = data?.kpis ?? {}

  return {
    stats: {
      todaySales: Number(kpis.todaySales ?? 0),

      todayProfit: Number(kpis.todayProfit ?? 0),

      // Backend MonthlyRevenue ko Total Revenue ke liye use kar rahe hain
      totalRevenue: Number(kpis.monthlyRevenue ?? 0),

      totalProducts: Number(kpis.totalProducts ?? 0),

      lowStock: Number(kpis.lowStockCount ?? 0),

      customers: Number(kpis.totalCustomers ?? 0),

      pendingPayments: Number(
        kpis.pendingCustomerPayments ?? 0,
      ),

      salesGrowth: 0,

      profitGrowth: 0,
    },
    upcomingFestivals: [],
    // Backend SalesTrend7Days
    salesTrend: (
      data?.salesTrend7Days ??
      data?.salesTrend30Days ??
      []
    ).map((item: any) => ({
      date: item.date
        ? new Date(item.date).toLocaleDateString(
          'en-IN',
          {
            day: '2-digit',
            month: 'short',
          },
        )
        : '',

      sales: Number(item.revenue ?? 0),

      profit: 0,
    })),

    // Backend RevenueVsPurchases
    revenueVsPurchases: (
      data?.revenueVsPurchases ?? []
    ).map((item: any) => ({
      month: item.month ?? '',

      revenue: Number(item.sales ?? 0),

      purchases: Number(item.purchases ?? 0),
    })),

    // Backend TopSellingProducts
    topProducts: (
      data?.topSellingProducts ?? []
    ).map((item: any, index: number) => ({
      id: String(
        item.productId ?? index,
      ),

      name:
        item.productName ??
        'Unknown Product',

      quantity: Number(
        item.unitsSold ?? 0,
      ),

      revenue: Number(
        item.revenue ?? 0,
      ),
    })),

    // Backend LowStockAlerts
    lowStockProducts: (
      data?.lowStockAlerts ?? []
    ).map((item: any, index: number) => ({
      id: String(
        item.productId ?? index,
      ),

      name:
        item.productName ??
        'Unknown Product',

      stock: Number(
        item.currentStock ?? 0,
      ),

      minStock: Number(
        item.minimumStock ?? 0,
      ),
    })),

    // Backend RecentSales
    recentSales: (
      data?.recentSales ?? []
    ).map((item: any, index: number) => ({
      id: String(
        item.id ?? index,
      ),

      invoiceNumber:
        item.invoiceNumber ??
        `INV-${index + 1}`,

      customerName:
        item.customerName ??
        'Walk-in Customer',

      amount: Number(
        item.amount ?? 0,
      ),

      paymentStatus:
        item.paymentStatus ??
        'Pending',

      date:
        item.date ??
        '',
    })),

    // Backend AiInsights is string[]
    aiInsights: (
      data?.aiInsights ?? []
    ).map((item: string) => ({
      title: 'VyaparAI Insight',

      message: item,

      type: item.includes('⚠️')
        ? 'warning'
        : item.includes('💰')
          ? 'info'
          : 'success',
    })),
  }
}

export default function Dashboard() {
  const { user } = useAuth()

  const [dashboard, setDashboard] =
    useState<DashboardData>(emptyDashboard)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const token = getAuthToken()

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token
          ? {
            Authorization: `Bearer ${token}`,
          }
          : {}),
      }

      const [dashboardResponse, festivalResponse] =
        await Promise.all([
          fetch(
            'http://localhost:5000/api/dashboard',
            {
              method: 'GET',
              headers,
            },
          ),

          fetch(
            'http://localhost:5000/api/festivals/upcoming?daysAhead=90',
            {
              method: 'GET',
              headers,
            },
          ),
        ])

      if (!dashboardResponse.ok) {
        throw new Error(
          `Dashboard API failed: ${dashboardResponse.status}`,
        )
      }

      if (!festivalResponse.ok) {
        throw new Error(
          `Festival API failed: ${festivalResponse.status}`,
        )
      }

      const dashboardResult =
        await dashboardResponse.json()

      const festivalResult =
        await festivalResponse.json()

      const dashboardPayload =
        dashboardResult?.data ?? dashboardResult

      const festivalPayload =
        festivalResult?.data ?? festivalResult

      const mappedDashboard =
        mapDashboardResponse(dashboardPayload)

      const festivals: Festival[] = (
        Array.isArray(festivalPayload)
          ? festivalPayload
          : []
      ).map((festival: any) => ({
        id: String(festival.id ?? ''),
        name: festival.name ?? 'Festival',
        startDate: festival.startDate ?? '',
        endDate: festival.endDate ?? '',
        region: festival.region ?? 'India',

        relevantCategories:
          festival.relevantCategories ?? [],

        demandMultiplier: Number(
          festival.demandMultiplier ?? 1,
        ),

        description:
          festival.description ?? '',

        daysRemaining: Number(
          festival.daysRemaining ?? 0,
        ),

        isActive:
          festival.isActive ?? true,
      }))

      setDashboard({
        ...mappedDashboard,
        upcomingFestivals: festivals,
      })
    } catch (err) {
      console.error('Dashboard error:', err)

      setError(
        'Dashboard data load nahi ho pa raha. Please try again.',
      )

      message.error('Dashboard load failed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const {
    stats,
    salesTrend,
    revenueVsPurchases,
    topProducts,
    lowStockProducts,
    recentSales,
    aiInsights,
    upcomingFestivals,
  } = dashboard

  const statCards = [
    {
      title: "Today's Sales",
      value: stats.todaySales,
      icon: <DollarOutlined />,
      formatter: currency,
      growth: stats.salesGrowth,
      description: 'vs yesterday',
    },
    {
      title: "Today's Profit",
      value: stats.todayProfit,
      icon: <ArrowUpOutlined />,
      formatter: currency,
      growth: stats.profitGrowth,
      description: 'vs yesterday',
    },
    {
      title: 'Total Revenue',
      value: stats.totalRevenue,
      icon: <BarChartOutlined />,
      formatter: currency,
    },
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: <InboxOutlined />,
      formatter: numberFormat,
    },
    {
      title: 'Low Stock',
      value: stats.lowStock,
      icon: <WarningOutlined />,
      formatter: numberFormat,
      danger: stats.lowStock > 0,
    },
    {
      title: 'Customers',
      value: stats.customers,
      icon: <TeamOutlined />,
      formatter: numberFormat,
    },
    {
      title: 'Pending Payments',
      value: stats.pendingPayments,
      icon: <ExclamationCircleOutlined />,
      formatter: currency,
      danger: stats.pendingPayments > 0,
    },
  ]

  const recentSaleColumns = [
    {
      title: 'Invoice',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      render: (value: string) => (
        <Text strong>{value}</Text>
      ),
    },
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
      responsive: ['sm'] as any,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (value: number) => (
        <Text strong>{currency(value)}</Text>
      ),
    },
    {
      title: 'Payment',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status: string) => {
        const normalized = status?.toLowerCase()

        if (
          normalized === 'paid' ||
          normalized === 'completed'
        ) {
          return (
            <Tag icon={<CheckCircleOutlined />} color="success">
              Paid
            </Tag>
          )
        }

        if (normalized === 'cancelled') {
          return <Tag color="error">Cancelled</Tag>
        }

        return <Tag color="warning">Pending</Tag>
      },
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      responsive: ['md'] as any,
      render: (date: string) =>
        date
          ? new Date(date).toLocaleDateString('en-IN')
          : '-',
    },
  ]

  return (
    <div className="min-h-full bg-[#f7f8fa] p-3 sm:p-4 lg:p-6">
      {/* HEADER */}
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Title
            level={3}
            className="!mb-1 !text-[#102A5C] !text-xl sm:!text-2xl"
          >
            Welcome back, {user?.ownerName ?? 'there'} 👋
          </Title>

          <Text type="secondary">
            Here's what's happening with{' '}
            <Text strong>
              {user?.businessName ?? 'your business'}
            </Text>
            .
          </Text>
        </div>

        <Tooltip title="Refresh dashboard">
          <Button
            icon={<ReloadOutlined />}
            onClick={loadDashboard}
            loading={loading}
          >
            <span className="hidden sm:inline">
              Refresh
            </span>
          </Button>
        </Tooltip>
      </div>

      {/* ERROR */}
      {error && (
        <Alert
          className="mb-5"
          type="error"
          showIcon
          message="Unable to load dashboard"
          description={error}
          action={
            <Button size="small" onClick={loadDashboard}>
              Retry
            </Button>
          }
        />
      )}
      {/* UPCOMING FESTIVALS */}
      <Card
        bordered={false}
        className="mb-5 rounded-2xl shadow-sm"
        title={
          <div className="flex items-center gap-2">
            <span className="text-xl">🎉</span>

            <div>
              <Text strong className="text-base">
                Upcoming Festivals
              </Text>

              <div>
                <Text type="secondary" className="text-xs">
                  Plan your inventory before festival demand increases
                </Text>
              </div>
            </div>
          </div>
        }
      >
        {loading ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : upcomingFestivals.length === 0 ? (
          <Empty
            description="No upcoming festivals in the next 90 days"
          />
        ) : (
          <Row gutter={[16, 16]}>
            {upcomingFestivals.slice(0, 3).map((festival) => {
              const demandIncrease = Math.round(
                (festival.demandMultiplier - 1) * 100,
              )

              return (
                <Col
                  xs={24}
                  md={12}
                  lg={8}
                  key={festival.id}
                >
                  <Card
                    size="small"
                    className="h-full rounded-xl border border-orange-100 bg-gradient-to-br from-orange-50 to-white"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Text
                          strong
                          className="block text-base text-[#102A5C]"
                        >
                          {festival.name}
                        </Text>

                        <Text
                          type="secondary"
                          className="text-xs"
                        >
                          {festival.region}
                        </Text>
                      </div>

                      <Tag
                        color="orange"
                        className="shrink-0"
                      >
                        {festival.daysRemaining === 0
                          ? 'Today'
                          : `${festival.daysRemaining} days`}
                      </Tag>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between">
                        <Text type="secondary">
                          Start Date
                        </Text>

                        <Text strong>
                          {festival.startDate
                            ? new Date(
                              festival.startDate,
                            ).toLocaleDateString('en-IN')
                            : '-'}
                        </Text>
                      </div>

                      <div className="flex justify-between">
                        <Text type="secondary">
                          Expected Demand
                        </Text>

                        <Text
                          strong
                          className="text-green-600"
                        >
                          +{demandIncrease}%
                        </Text>
                      </div>
                    </div>

                    {festival.relevantCategories.length >
                      0 && (
                        <div className="mt-4">
                          <Text
                            type="secondary"
                            className="mb-2 block text-xs"
                          >
                            Recommended Categories
                          </Text>

                          <div className="flex flex-wrap gap-1">
                            {festival.relevantCategories
                              .slice(0, 5)
                              .map((category) => (
                                <Tag
                                  key={category}
                                  color="blue"
                                >
                                  {category}
                                </Tag>
                              ))}
                          </div>
                        </div>
                      )}

                    {festival.description && (
                      <div className="mt-4 rounded-lg bg-white p-3">
                        <Text className="text-xs">
                          {festival.description}
                        </Text>
                      </div>
                    )}

                    <div className="mt-4 rounded-lg bg-orange-100 px-3 py-2">
                      <Text className="text-xs text-orange-800">
                        💡 Stock up early to prepare for
                        increased festival demand.
                      </Text>
                    </div>
                  </Card>
                </Col>
              )
            })}
          </Row>
        )}
      </Card>
      {/* STAT CARDS */}
      <Row gutter={[12, 12]} className="mb-5">
        {statCards.map((item) => (
          <Col
            key={item.title}
            xs={12}
            sm={12}
            md={8}
            lg={6}
            xl={6}
            xxl={3}
          >
            <Card
              bordered={false}
              className="h-full rounded-2xl shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
              bodyStyle={{
                padding: 18,
              }}
            >
              {loading ? (
                <Skeleton
                  active
                  paragraph={{ rows: 1 }}
                />
              ) : (
                <>
                  <div className="mb-3 flex items-start justify-between">
                    <Text
                      type="secondary"
                      className="text-xs sm:text-sm"
                    >
                      {item.title}
                    </Text>

                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.danger
                        ? 'bg-red-50 text-red-500'
                        : 'bg-blue-50 text-blue-600'
                        }`}
                    >
                      {item.icon}
                    </div>
                  </div>

                  <Statistic
                    value={item.value}
                    formatter={(value) =>
                      item.formatter(Number(value))
                    }
                    valueStyle={{
                      fontSize: 23,
                      fontWeight: 700,
                      color: item.danger
                        ? '#dc2626'
                        : '#102A5C',
                    }}
                  />

                  {typeof item.growth === 'number' && (
                    <div className="mt-2 flex items-center gap-1 text-xs">
                      {item.growth >= 0 ? (
                        <ArrowUpOutlined className="text-green-500" />
                      ) : (
                        <ArrowDownOutlined className="text-red-500" />
                      )}

                      <span
                        className={
                          item.growth >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }
                      >
                        {Math.abs(item.growth).toFixed(1)}%
                      </span>

                      <Text type="secondary">
                        {item.description}
                      </Text>
                    </div>
                  )}
                </>
              )}
            </Card>
          </Col>
        ))}
      </Row>

      {/* SALES TREND + REVENUE PURCHASE */}
      <Row gutter={[16, 16]} className="mb-5">
        <Col xs={24} xl={15}>
          <Card
            bordered={false}
            className="rounded-2xl shadow-sm"
            title={
              <div>
                <Text strong className="text-base">
                  Sales Trend
                </Text>
                <div>
                  <Text type="secondary" className="text-xs">
                    Sales and profit performance
                  </Text>
                </div>
              </div>
            }
          >
            {loading ? (
              <Skeleton active paragraph={{ rows: 7 }} />
            ) : salesTrend.length === 0 ? (
              <Empty description="No sales data available" />
            ) : (
              <div className="h-[280px] w-full sm:h-[330px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesTrend}>
                    <defs>
                      <linearGradient
                        id="salesGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#2563eb"
                          stopOpacity={0.25}
                        />
                        <stop
                          offset="95%"
                          stopColor="#2563eb"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                    />

                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value) =>
                        `₹${value}`
                      }
                    />

                    <ChartTooltip
                      formatter={(value: any) =>
                        currency(Number(value))
                      }
                    />

                    <Legend />

                    <Area
                      type="monotone"
                      dataKey="sales"
                      name="Sales"
                      stroke="#2563eb"
                      fill="url(#salesGradient)"
                      strokeWidth={2}
                    />

                    <Area
                      type="monotone"
                      dataKey="profit"
                      name="Profit"
                      stroke="#16a34a"
                      fill="transparent"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} xl={9}>
          <Card
            bordered={false}
            className="rounded-2xl shadow-sm"
            title={
              <div>
                <Text strong className="text-base">
                  Revenue vs Purchases
                </Text>
                <div>
                  <Text type="secondary" className="text-xs">
                    Monthly comparison
                  </Text>
                </div>
              </div>
            }
          >
            {loading ? (
              <Skeleton active paragraph={{ rows: 7 }} />
            ) : revenueVsPurchases.length === 0 ? (
              <Empty description="No revenue data available" />
            ) : (
              <div className="h-[280px] w-full sm:h-[330px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueVsPurchases}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11 }}
                    />

                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value) =>
                        `₹${value}`
                      }
                    />

                    <ChartTooltip
                      formatter={(value: any) =>
                        currency(Number(value))
                      }
                    />

                    <Legend />

                    <Bar
                      dataKey="revenue"
                      name="Revenue"
                      fill="#2563eb"
                      radius={[5, 5, 0, 0]}
                    />

                    <Bar
                      dataKey="purchases"
                      name="Purchases"
                      fill="#f59e0b"
                      radius={[5, 5, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* TOP PRODUCTS + LOW STOCK */}
      <Row gutter={[16, 16]} className="mb-5">
        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            className="rounded-2xl shadow-sm"
            title={
              <div className="flex items-center gap-2">
                <TrophyOutlined className="text-yellow-500" />
                <Text strong>Top Selling Products</Text>
              </div>
            }
          >
            {loading ? (
              <Skeleton active paragraph={{ rows: 5 }} />
            ) : topProducts.length === 0 ? (
              <Empty description="No product sales yet" />
            ) : (
              <div className="space-y-4">
                {topProducts.slice(0, 5).map((product, index) => {
                  const maxQuantity =
                    topProducts[0]?.quantity || 1

                  const percentage =
                    (product.quantity / maxQuantity) * 100

                  return (
                    <div key={product.id}>
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-600">
                            {index + 1}
                          </div>

                          <Text
                            ellipsis
                            className="max-w-[180px] sm:max-w-[280px]"
                          >
                            {product.name}
                          </Text>
                        </div>

                        <Text strong>
                          {numberFormat(product.quantity)}
                        </Text>
                      </div>

                      <Progress
                        percent={Math.round(percentage)}
                        showInfo={false}
                        size="small"
                      />

                      <div className="mt-1 text-right">
                        <Text type="secondary" className="text-xs">
                          {currency(product.revenue)}
                        </Text>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            className="rounded-2xl shadow-sm"
            title={
              <div className="flex items-center gap-2">
                <WarningOutlined className="text-red-500" />
                <Text strong>Low Stock Alert</Text>
              </div>
            }
            extra={
              stats.lowStock > 0 ? (
                <Tag color="error">
                  {stats.lowStock} items
                </Tag>
              ) : (
                <Tag color="success">Healthy</Tag>
              )
            }
          >
            {loading ? (
              <Skeleton active paragraph={{ rows: 5 }} />
            ) : lowStockProducts.length === 0 ? (
              <Empty
                image={
                  <CheckCircleOutlined className="text-4xl text-green-500" />
                }
                description="All products have healthy stock"
              />
            ) : (
              <div className="space-y-4">
                {lowStockProducts.slice(0, 5).map((product) => {
                  const stockPercentage =
                    product.minStock > 0
                      ? Math.min(
                        100,
                        (product.stock /
                          product.minStock) *
                        100,
                      )
                      : 0

                  return (
                    <div key={product.id}>
                      <div className="mb-1 flex justify-between gap-3">
                        <Text ellipsis>
                          {product.name}
                        </Text>

                        <Text
                          strong
                          className="shrink-0 text-red-500"
                        >
                          {product.stock} left
                        </Text>
                      </div>

                      <Progress
                        percent={Math.round(
                          stockPercentage,
                        )}
                        status="exception"
                        showInfo={false}
                        size="small"
                      />

                      <Text
                        type="secondary"
                        className="text-xs"
                      >
                        Minimum stock: {product.minStock}
                      </Text>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* RECENT SALES */}
      <Card
        bordered={false}
        className="mb-5 rounded-2xl shadow-sm"
        title={
          <div>
            <Text strong className="text-base">
              Recent Sales
            </Text>
            <div>
              <Text type="secondary" className="text-xs">
                Latest transactions from your store
              </Text>
            </div>
          </div>
        }
      >
        <Table
          rowKey="id"
          loading={loading}
          columns={recentSaleColumns}
          dataSource={recentSales}
          pagination={false}
          locale={{
            emptyText: (
              <Empty description="No recent sales" />
            ),
          }}
          scroll={{ x: 650 }}
        />
      </Card>

      {/* AI INSIGHTS */}
      <Card
        bordered={false}
        className="rounded-2xl shadow-sm"
        title={
          <div className="flex items-center gap-2">
            <span className="text-xl">🤖</span>

            <div>
              <Text strong className="text-base">
                VyaparAI Insights
              </Text>

              <div>
                <Text type="secondary" className="text-xs">
                  AI-powered business recommendations
                </Text>
              </div>
            </div>
          </div>
        }
      >
        {loading ? (
          <Skeleton active paragraph={{ rows: 3 }} />
        ) : aiInsights.length === 0 ? (
          <Alert
            type="info"
            showIcon
            message="AI insights will appear here"
            description="Keep adding products and sales data to receive business recommendations."
          />
        ) : (
          <Row gutter={[12, 12]}>
            {aiInsights.map((insight, index) => (
              <Col xs={24} md={12} lg={8} key={index}>
                <Alert
                  showIcon
                  type={
                    insight.type === 'warning'
                      ? 'warning'
                      : insight.type === 'success'
                        ? 'success'
                        : 'info'
                  }
                  message={insight.title}
                  description={insight.message}
                />
              </Col>
            ))}
          </Row>
        )}
      </Card>
    </div>
  )
}