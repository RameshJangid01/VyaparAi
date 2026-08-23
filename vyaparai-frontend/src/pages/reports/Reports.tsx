import {
    Alert,
    Button,
    Card,
    Col,
    DatePicker,
    Empty,
    Row,
    Select,
    Skeleton,
    Statistic,
    Table,
    Tag,
    Typography,
    message,
} from 'antd'

import {
    ArrowDownOutlined,
    ArrowUpOutlined,
    BarChartOutlined,
    DownloadOutlined,
    FileExcelOutlined,
    ReloadOutlined,
    ShoppingCartOutlined,
    TeamOutlined,
    WalletOutlined,
    WarningOutlined,
    InboxOutlined,
} from '@ant-design/icons'

import { useEffect, useState } from 'react'
import dayjs, { Dayjs } from 'dayjs'

import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'
import { useNavigate } from 'react-router-dom'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// =========================
// TYPES
// =========================

interface SalesReportItem {
    id: string
    date: string
    invoiceNumber: string
    customerName: string
    totalItems: number
    subtotal: number
    gstTotal: number
    discountTotal: number
    grandTotal: number
    paymentMethod: string
    paymentStatus: string
}

interface SalesReport {
    totalRevenue: number
    totalTaxCollected: number
    totalDiscountGiven: number
    totalOrders: number
    averageOrderValue: number
    items: SalesReportItem[]
}

interface PurchaseReportItem {
    date: string
    invoiceNumber: string
    supplierName: string
    totalItems: number
    subtotal: number
    gstTotal: number
    grandTotal: number
    paidAmount: number
    pendingAmount: number
}

interface PurchaseReport {
    totalPurchases: number
    totalTaxPaid: number
    totalPaid: number
    totalPending: number
    totalPurchaseOrders: number
    items: PurchaseReportItem[]
}

interface ProfitBreakdownItem {
    date: string
    revenue: number
    cost: number
    profit: number
    marginPercent: number
}

interface ProfitReport {
    totalRevenue: number
    totalCostOfGoodsSold: number
    grossProfit: number
    profitMarginPercentage: number
    dailyBreakdown: ProfitBreakdownItem[]
}

interface InventoryReportItem {
    productId: string
    productName: string
    sku: string
    category: string
    currentQuantity: number
    minimumStockLevel: number
    purchasePrice: number
    sellingPrice: number
    stockValue: number
    status: string
}

interface InventoryReport {
    totalProducts: number
    inStockCount: number
    lowStockCount: number
    outOfStockCount: number
    totalStockValue: number
    items: InventoryReportItem[]
}

interface CustomerReportItem {
    customerId: string
    name: string
    mobile: string
    totalPurchases: number
    totalPaid: number
    pendingAmount: number
    orderCount: number
    lastPurchaseDate: string | null
}

interface CustomerReport {
    totalCustomers: number
    totalRevenueFromCustomers: number
    totalPendingReceivables: number
    items: CustomerReportItem[]
}

// =========================
// COMPONENT
// =========================

export default function Reports() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const [dateRange, setDateRange] = useState<
        [Dayjs, Dayjs]
    >([
        dayjs().startOf('month'),
        dayjs(),
    ])

    const [period, setPeriod] = useState('this_month')

    const [sales, setSales] = useState<SalesReport | null>(null)
    const [purchases, setPurchases] =
        useState<PurchaseReport | null>(null)

    const [profit, setProfit] =
        useState<ProfitReport | null>(null)

    const [inventory, setInventory] =
        useState<InventoryReport | null>(null)

    const [customers, setCustomers] =
        useState<CustomerReport | null>(null)

    // =========================
    // FORMAT CURRENCY
    // =========================

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2,
        }).format(value || 0)

    // =========================
    // API CALL
    // =========================

    const fetchReports = async () => {
        try {
            setLoading(true)
            setError('')

            const fromDate =
                dateRange[0]
                    .startOf('day')
                    .toISOString()

            const toDate =
                dateRange[1]
                    .endOf('day')
                    .toISOString()

            /*
             * IMPORTANT:
             * Apne AuthContext ke according token key check karo.
             * Agar tumhara token kisi aur key mein hai to yahan change karo.
             */
            const token =
                localStorage.getItem('vyaparai_token') ||
                localStorage.getItem('token') ||
                localStorage.getItem('accessToken')

            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            }

            if (token) {
                headers.Authorization = `Bearer ${token}`
            }

            // =========================
            // 5 REPORT APIs
            // =========================

            const [
                salesResponse,
                purchasesResponse,
                profitResponse,
                inventoryResponse,
                customersResponse,
            ] = await Promise.all([
                fetch(
                    `${API_BASE_URL}/reports/sales?fromDate=${encodeURIComponent(
                        fromDate,
                    )}&toDate=${encodeURIComponent(toDate)}`,
                    {
                        method: 'GET',
                        headers,
                    },
                ),

                fetch(
                    `${API_BASE_URL}/reports/purchases?fromDate=${encodeURIComponent(
                        fromDate,
                    )}&toDate=${encodeURIComponent(toDate)}`,
                    {
                        method: 'GET',
                        headers,
                    },
                ),

                fetch(
                    `${API_BASE_URL}/reports/profit?fromDate=${encodeURIComponent(
                        fromDate,
                    )}&toDate=${encodeURIComponent(toDate)}`,
                    {
                        method: 'GET',
                        headers,
                    },
                ),

                fetch(
                    `${API_BASE_URL}/reports/inventory`,
                    {
                        method: 'GET',
                        headers,
                    },
                ),

                fetch(
                    `${API_BASE_URL}/reports/customers`,
                    {
                        method: 'GET',
                        headers,
                    },
                ),
            ])

            // =========================
            // CHECK RESPONSE
            // =========================

            if (!salesResponse.ok) {
                throw new Error(
                    `Sales report failed: ${salesResponse.status}`,
                )
            }

            if (!purchasesResponse.ok) {
                throw new Error(
                    `Purchase report failed: ${purchasesResponse.status}`,
                )
            }

            if (!profitResponse.ok) {
                throw new Error(
                    `Profit report failed: ${profitResponse.status}`,
                )
            }

            if (!inventoryResponse.ok) {
                throw new Error(
                    `Inventory report failed: ${inventoryResponse.status}`,
                )
            }

            if (!customersResponse.ok) {
                throw new Error(
                    `Customer report failed: ${customersResponse.status}`,
                )
            }

            // =========================
            // JSON
            // =========================

            const [
                salesJson,
                purchasesJson,
                profitJson,
                inventoryJson,
                customersJson,
            ] = await Promise.all([
                salesResponse.json(),
                purchasesResponse.json(),
                profitResponse.json(),
                inventoryResponse.json(),
                customersResponse.json(),
            ])

            /*
             * ApiResponse<T> ke according
             * actual data result.data ke andar hai.
             */

            setSales(salesJson?.data ?? salesJson)
            setPurchases(
                purchasesJson?.data ?? purchasesJson,
            )
            setProfit(profitJson?.data ?? profitJson)
            setInventory(
                inventoryJson?.data ?? inventoryJson,
            )
            setCustomers(
                customersJson?.data ?? customersJson,
            )
        } catch (err) {
            console.error('Reports error:', err)

            const errorMessage =
                err instanceof Error
                    ? err.message
                    : 'Unable to load reports.'

            setError(errorMessage)

            message.error(
                'Reports load nahi ho paayi.',
            )
        } finally {
            setLoading(false)
        }
    }

    // =========================
    // INITIAL LOAD
    // =========================

    useEffect(() => {
        fetchReports()
    }, [])

    // =========================
    // PERIOD
    // =========================

    const handlePeriodChange = (
        value: string,
    ) => {
        setPeriod(value)

        const today = dayjs()

        if (value === 'today') {
            setDateRange([
                today.startOf('day'),
                today.endOf('day'),
            ])
        }

        if (value === 'this_week') {
            setDateRange([
                today.startOf('week'),
                today.endOf('week'),
            ])
        }

        if (value === 'this_month') {
            setDateRange([
                today.startOf('month'),
                today.endOf('month'),
            ])
        }

        if (value === 'last_month') {
            const lastMonth =
                today.subtract(1, 'month')

            setDateRange([
                lastMonth.startOf('month'),
                lastMonth.endOf('month'),
            ])
        }

        if (value === 'this_year') {
            setDateRange([
                today.startOf('year'),
                today.endOf('year'),
            ])
        }
    }

    // =========================
    // EXPORT CSV
    // =========================

    const handleExport = () => {
        const rows = [
            [
                'Invoice',
                'Customer',
                'Items',
                'Subtotal',
                'GST',
                'Discount',
                'Grand Total',
                'Payment Method',
                'Payment Status',
            ],
            ...(sales?.items ?? []).map(
                (item) => [
                    item.invoiceNumber,
                    item.customerName,
                    item.totalItems,
                    item.subtotal,
                    item.gstTotal,
                    item.discountTotal,
                    item.grandTotal,
                    item.paymentMethod,
                    item.paymentStatus,
                ],
            ),
        ]

        const csv = rows
            .map((row) =>
                row
                    .map((value) =>
                        `"${String(value).replaceAll('"', '""')}"`,
                    )
                    .join(','),
            )
            .join('\n')

        const blob = new Blob([csv], {
            type: 'text/csv;charset=utf-8;',
        })

        const url =
            URL.createObjectURL(blob)

        const link =
            document.createElement('a')

        link.href = url
        link.download =
            `vyaparai-sales-report-${dayjs().format(
                'YYYY-MM-DD',
            )}.csv`

        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        URL.revokeObjectURL(url)
    }

    // =========================
    // COLUMNS
    // =========================

    const salesColumns = [
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
        },
        {
            title: 'Invoice',
            dataIndex: 'invoiceNumber',
            key: 'invoiceNumber',
            render: (
                value: string,
                record: SalesReportItem,
            ) => (
                <button
                    type="button"
                    onClick={() => {


                        navigate(`/invoice/${record.id}`)
                    }}
                    className="cursor-pointer font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                >
                    {value}
                </button>
            ),
        },
        {
            title: 'Customer',
            dataIndex: 'customerName',
            key: 'customerName',
        },
        {
            title: 'Items',
            dataIndex: 'totalItems',
            key: 'totalItems',
        },
        {
            title: 'GST',
            dataIndex: 'gstTotal',
            key: 'gstTotal',
            render: (value: number) =>
                formatCurrency(value),
        },
        {
            title: 'Discount',
            dataIndex: 'discountTotal',
            key: 'discountTotal',
            render: (value: number) =>
                formatCurrency(value),
        },
        {
            title: 'Total',
            dataIndex: 'grandTotal',
            key: 'grandTotal',
            render: (value: number) => (
                <b>{formatCurrency(value)}</b>
            ),
        },
        {
            title: 'Payment',
            dataIndex: 'paymentStatus',
            key: 'paymentStatus',
            render: (value: string) => (
                <Tag
                    color={
                        value === 'Paid'
                            ? 'green'
                            : value === 'Partial'
                                ? 'orange'
                                : 'red'
                    }
                >
                    {value}
                </Tag>
            ),
        },
    ]

    const purchaseColumns = [
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
        },
        {
            title: 'Invoice',
            dataIndex: 'invoiceNumber',
            key: 'invoiceNumber',
        },
        {
            title: 'Supplier',
            dataIndex: 'supplierName',
            key: 'supplierName',
        },
        {
            title: 'Items',
            dataIndex: 'totalItems',
            key: 'totalItems',
        },
        {
            title: 'Total',
            dataIndex: 'grandTotal',
            key: 'grandTotal',
            render: (value: number) =>
                formatCurrency(value),
        },
        {
            title: 'Paid',
            dataIndex: 'paidAmount',
            key: 'paidAmount',
            render: (value: number) =>
                formatCurrency(value),
        },
        {
            title: 'Pending',
            dataIndex: 'pendingAmount',
            key: 'pendingAmount',
            render: (value: number) => (
                <span className="text-red-500">
                    {formatCurrency(value)}
                </span>
            ),
        },
    ]

    const inventoryColumns = [
        {
            title: 'Product',
            dataIndex: 'productName',
            key: 'productName',
        },
        {
            title: 'SKU',
            dataIndex: 'sku',
            key: 'sku',
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
        },
        {
            title: 'Stock',
            dataIndex: 'currentQuantity',
            key: 'currentQuantity',
        },
        {
            title: 'Min Stock',
            dataIndex: 'minimumStockLevel',
            key: 'minimumStockLevel',
        },
        {
            title: 'Purchase Price',
            dataIndex: 'purchasePrice',
            key: 'purchasePrice',
            render: (value: number) =>
                formatCurrency(value),
        },
        {
            title: 'Stock Value',
            dataIndex: 'stockValue',
            key: 'stockValue',
            render: (value: number) =>
                formatCurrency(value),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (value: string) => (
                <Tag
                    color={
                        value === 'IN STOCK'
                            ? 'green'
                            : value === 'LOW STOCK'
                                ? 'orange'
                                : 'red'
                    }
                >
                    {value}
                </Tag>
            ),
        },
    ]

    const customerColumns = [
        {
            title: 'Customer',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Mobile',
            dataIndex: 'mobile',
            key: 'mobile',
        },
        {
            title: 'Orders',
            dataIndex: 'orderCount',
            key: 'orderCount',
        },
        {
            title: 'Purchases',
            dataIndex: 'totalPurchases',
            key: 'totalPurchases',
            render: (value: number) =>
                formatCurrency(value),
        },
        {
            title: 'Paid',
            dataIndex: 'totalPaid',
            key: 'totalPaid',
            render: (value: number) =>
                formatCurrency(value),
        },
        {
            title: 'Pending',
            dataIndex: 'pendingAmount',
            key: 'pendingAmount',
            render: (value: number) => (
                <span className="font-semibold text-red-500">
                    {formatCurrency(value)}
                </span>
            ),
        },
        {
            title: 'Last Purchase',
            dataIndex: 'lastPurchaseDate',
            key: 'lastPurchaseDate',
            render: (value: string | null) =>
                value
                    ? dayjs(value).format('DD MMM YYYY')
                    : '-',
        },
    ]

    return (
        <div className="min-h-full bg-[#f7f8fa] p-3 sm:p-4 lg:p-6">

            {/* ================= HEADER ================= */}

            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                <div>
                    <Title
                        level={3}
                        className="!mb-1 !text-brand-navy"
                    >
                        Reports
                    </Title>

                    <Text type="secondary">
                        Analyse your sales, purchases,
                        profit, inventory and customers.
                    </Text>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">

                    <Button
                        icon={<ReloadOutlined />}
                        loading={loading}
                        onClick={fetchReports}
                    >
                        Refresh
                    </Button>

                    <Button
                        type="primary"
                        icon={<DownloadOutlined />}
                        onClick={handleExport}
                    >
                        Export CSV
                    </Button>

                </div>

            </div>

            {/* ================= FILTER ================= */}

            <Card className="mb-5 rounded-2xl border-0 shadow-sm">

                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

                    <div>
                        <Text strong>
                            Report Period
                        </Text>

                        <div className="text-xs text-gray-400">
                            Select a date range to analyse
                            your business.
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">

                        <Select
                            value={period}
                            onChange={handlePeriodChange}
                            className="w-full sm:w-40"
                            options={[
                                {
                                    label: 'Today',
                                    value: 'today',
                                },
                                {
                                    label: 'This Week',
                                    value: 'this_week',
                                },
                                {
                                    label: 'This Month',
                                    value: 'this_month',
                                },
                                {
                                    label: 'Last Month',
                                    value: 'last_month',
                                },
                                {
                                    label: 'This Year',
                                    value: 'this_year',
                                },
                            ]}
                        />

                        <RangePicker
                            value={dateRange}
                            onChange={(values) => {
                                if (
                                    values?.[0] &&
                                    values?.[1]
                                ) {
                                    setDateRange([
                                        values[0],
                                        values[1],
                                    ])

                                    setPeriod('custom')
                                }
                            }}
                            className="w-full sm:w-auto"
                        />

                        <Button
                            type="primary"
                            onClick={fetchReports}
                        >
                            Apply
                        </Button>

                    </div>

                </div>

            </Card>

            {/* ================= ERROR ================= */}

            {error && (
                <Alert
                    className="mb-5"
                    type="error"
                    showIcon
                    message="Reports not loaded"
                    description={error}
                    closable
                    onClose={() => setError('')}
                />
            )}

            {/* ================= SALES ================= */}

            <div className="mb-2">
                <Title
                    level={4}
                    className="!text-brand-navy"
                >
                    Sales Overview
                </Title>
            </div>

            <Row
                gutter={[16, 16]}
                className="mb-5"
            >

                <Col xs={24} sm={12} lg={6}>
                    <ReportCard
                        title="Total Revenue"
                        value={sales?.totalRevenue ?? 0}
                        icon={<ShoppingCartOutlined />}
                        loading={loading}
                        currency
                    />
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <ReportCard
                        title="Total Orders"
                        value={sales?.totalOrders ?? 0}
                        icon={<BarChartOutlined />}
                        loading={loading}
                    />
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <ReportCard
                        title="GST Collected"
                        value={sales?.totalTaxCollected ?? 0}
                        icon={<WalletOutlined />}
                        loading={loading}
                        currency
                    />
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <ReportCard
                        title="Average Order Value"
                        value={sales?.averageOrderValue ?? 0}
                        icon={<ArrowUpOutlined />}
                        loading={loading}
                        currency
                    />
                </Col>

            </Row>

            {/* ================= PROFIT ================= */}

            <div className="mb-2">
                <Title
                    level={4}
                    className="!text-brand-navy"
                >
                    Profit Overview
                </Title>
            </div>

            <Row
                gutter={[16, 16]}
                className="mb-5"
            >

                <Col xs={24} sm={12} lg={6}>
                    <ReportCard
                        title="Revenue"
                        value={profit?.totalRevenue ?? 0}
                        icon={<WalletOutlined />}
                        loading={loading}
                        currency
                    />
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <ReportCard
                        title="Cost of Goods"
                        value={
                            profit?.totalCostOfGoodsSold ?? 0
                        }
                        icon={<ArrowDownOutlined />}
                        loading={loading}
                        currency
                    />
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <ReportCard
                        title="Gross Profit"
                        value={profit?.grossProfit ?? 0}
                        icon={<ArrowUpOutlined />}
                        loading={loading}
                        currency
                    />
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <ReportCard
                        title="Profit Margin"
                        value={
                            profit?.profitMarginPercentage ?? 0
                        }
                        icon={<BarChartOutlined />}
                        loading={loading}
                        suffix="%"
                    />
                </Col>

            </Row>

            {/* ================= CHARTS ================= */}

            <Row
                gutter={[16, 16]}
                className="mb-5"
            >

                <Col xs={24} xl={14}>

                    <Card
                        title={
                            <div>
                                <div className="font-semibold text-brand-navy">
                                    Profit Trend
                                </div>

                                <div className="text-xs font-normal text-gray-400">
                                    Revenue vs cost vs profit
                                </div>
                            </div>
                        }
                        className="rounded-2xl border-0 shadow-sm"
                    >

                        {loading ? (
                            <Skeleton active />
                        ) : !profit?.dailyBreakdown?.length ? (
                            <Empty description="No profit data available" />
                        ) : (
                            <div className="h-[320px] w-full">

                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                >

                                    <LineChart
                                        data={profit.dailyBreakdown}
                                    >

                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                        />

                                        <XAxis dataKey="date" />

                                        <YAxis />

                                        <Tooltip
                                            formatter={(value: number) =>
                                                formatCurrency(value)
                                            }
                                        />

                                        <Legend />

                                        <Line
                                            type="monotone"
                                            dataKey="revenue"
                                            name="Revenue"
                                            strokeWidth={3}
                                        />

                                        <Line
                                            type="monotone"
                                            dataKey="cost"
                                            name="Cost"
                                            strokeWidth={3}
                                        />

                                        <Line
                                            type="monotone"
                                            dataKey="profit"
                                            name="Profit"
                                            strokeWidth={3}
                                        />

                                    </LineChart>

                                </ResponsiveContainer>

                            </div>
                        )}

                    </Card>

                </Col>

                <Col xs={24} xl={10}>

                    <Card
                        title={
                            <div>
                                <div className="font-semibold text-brand-navy">
                                    Sales vs Purchases
                                </div>

                                <div className="text-xs font-normal text-gray-400">
                                    Business revenue and expenses
                                </div>
                            </div>
                        }
                        className="rounded-2xl border-0 shadow-sm"
                    >

                        {!sales?.items?.length &&
                            !purchases?.items?.length ? (
                            <Empty description="No data available" />
                        ) : (
                            <div className="h-[320px] w-full">

                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                >

                                    <BarChart
                                        data={createComparisonData(
                                            sales?.items ?? [],
                                            purchases?.items ?? [],
                                        )}
                                    >

                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                        />

                                        <XAxis dataKey="date" />

                                        <YAxis />

                                        <Tooltip
                                            formatter={(value: number) =>
                                                formatCurrency(value)
                                            }
                                        />

                                        <Legend />

                                        <Bar
                                            dataKey="sales"
                                            name="Sales"
                                        />

                                        <Bar
                                            dataKey="purchases"
                                            name="Purchases"
                                        />

                                    </BarChart>

                                </ResponsiveContainer>

                            </div>
                        )}

                    </Card>

                </Col>

            </Row>

            {/* ================= PURCHASE ================= */}

            <div className="mb-2">
                <Title
                    level={4}
                    className="!text-brand-navy"
                >
                    Purchase Overview
                </Title>
            </div>

            <Row
                gutter={[16, 16]}
                className="mb-5"
            >

                <Col xs={24} sm={12} lg={6}>
                    <ReportCard
                        title="Total Purchases"
                        value={
                            purchases?.totalPurchases ?? 0
                        }
                        icon={<ArrowDownOutlined />}
                        loading={loading}
                        currency
                    />
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <ReportCard
                        title="Purchase Orders"
                        value={
                            purchases?.totalPurchaseOrders ?? 0
                        }
                        icon={<FileExcelOutlined />}
                        loading={loading}
                    />
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <ReportCard
                        title="Total Paid"
                        value={
                            purchases?.totalPaid ?? 0
                        }
                        icon={<WalletOutlined />}
                        loading={loading}
                        currency
                    />
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <ReportCard
                        title="Total Pending"
                        value={
                            purchases?.totalPending ?? 0
                        }
                        icon={<WarningOutlined />}
                        loading={loading}
                        currency
                        danger
                    />
                </Col>

            </Row>

            <Card
                className="mb-5 rounded-2xl border-0 shadow-sm"
                title="Purchase Transactions"
            >

                <Table
                    rowKey="invoiceNumber"
                    loading={loading}
                    dataSource={
                        purchases?.items ?? []
                    }
                    columns={purchaseColumns}
                    scroll={{ x: 900 }}
                    pagination={{
                        pageSize: 10,
                    }}
                />

            </Card>

            {/* ================= SALES TABLE ================= */}

            <Card
                className="mb-5 rounded-2xl border-0 shadow-sm"
                title="Sales Transactions"
            >

                <Table
                    rowKey="invoiceNumber"
                    loading={loading}
                    dataSource={
                        sales?.items ?? []
                    }
                    columns={salesColumns}
                    scroll={{ x: 1000 }}
                    pagination={{
                        pageSize: 10,
                    }}
                />

            </Card>

            {/* ================= INVENTORY ================= */}

            <div className="mb-2">
                <Title
                    level={4}
                    className="!text-brand-navy"
                >
                    Inventory Overview
                </Title>
            </div>

            <Row
                gutter={[16, 16]}
                className="mb-5"
            >

                <Col xs={12} sm={6}>
                    <ReportCard
                        title="Products"
                        value={
                            inventory?.totalProducts ?? 0
                        }
                        icon={<InboxOutlined />}
                        loading={loading}
                    />
                </Col>

                <Col xs={12} sm={6}>
                    <ReportCard
                        title="In Stock"
                        value={
                            inventory?.inStockCount ?? 0
                        }
                        icon={<ArrowUpOutlined />}
                        loading={loading}
                    />
                </Col>

                <Col xs={12} sm={6}>
                    <ReportCard
                        title="Low Stock"
                        value={
                            inventory?.lowStockCount ?? 0
                        }
                        icon={<WarningOutlined />}
                        loading={loading}
                        danger={
                            (inventory?.lowStockCount ?? 0) > 0
                        }
                    />
                </Col>

                <Col xs={12} sm={6}>
                    <ReportCard
                        title="Stock Value"
                        value={
                            inventory?.totalStockValue ?? 0
                        }
                        icon={<WalletOutlined />}
                        loading={loading}
                        currency
                    />
                </Col>

            </Row>

            <Card
                className="mb-5 rounded-2xl border-0 shadow-sm"
                title="Inventory Report"
            >

                <Table
                    rowKey="productId"
                    loading={loading}
                    dataSource={
                        inventory?.items ?? []
                    }
                    columns={inventoryColumns}
                    scroll={{ x: 1000 }}
                    pagination={{
                        pageSize: 10,
                    }}
                />

            </Card>

            {/* ================= CUSTOMERS ================= */}

            <div className="mb-2">
                <Title
                    level={4}
                    className="!text-brand-navy"
                >
                    Customer Overview
                </Title>
            </div>

            <Row
                gutter={[16, 16]}
                className="mb-5"
            >

                <Col xs={24} sm={8}>
                    <ReportCard
                        title="Total Customers"
                        value={
                            customers?.totalCustomers ?? 0
                        }
                        icon={<TeamOutlined />}
                        loading={loading}
                    />
                </Col>

                <Col xs={24} sm={8}>
                    <ReportCard
                        title="Customer Revenue"
                        value={
                            customers?.totalRevenueFromCustomers ??
                            0
                        }
                        icon={<WalletOutlined />}
                        loading={loading}
                        currency
                    />
                </Col>

                <Col xs={24} sm={8}>
                    <ReportCard
                        title="Pending Receivables"
                        value={
                            customers?.totalPendingReceivables ??
                            0
                        }
                        icon={<WarningOutlined />}
                        loading={loading}
                        currency
                        danger
                    />
                </Col>

            </Row>

            <Card
                className="rounded-2xl border-0 shadow-sm"
                title="Customer Report"
            >

                <Table
                    rowKey="customerId"
                    loading={loading}
                    dataSource={
                        customers?.items ?? []
                    }
                    columns={customerColumns}
                    scroll={{ x: 950 }}
                    pagination={{
                        pageSize: 10,
                    }}
                />

            </Card>

        </div>
    )
}

// =========================
// REPORT CARD
// =========================

function ReportCard({
    title,
    value,
    icon,
    loading,
    currency,
    growth,
    suffix,
    danger,
}: {
    title: string
    value: number
    icon: React.ReactNode
    loading?: boolean
    currency?: boolean
    growth?: number
    suffix?: string
    danger?: boolean
}) {
    return (
        <Card className="rounded-2xl border-0 shadow-sm">

            <div className="flex items-start justify-between">

                <Text type="secondary">
                    {title}
                </Text>

                <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${danger
                        ? 'bg-red-50 text-red-500'
                        : 'bg-blue-50 text-blue-600'
                        }`}
                >
                    {icon}
                </div>

            </div>

            {loading ? (
                <Skeleton
                    active
                    paragraph={false}
                    className="mt-5"
                />
            ) : (
                <>
                    <Statistic
                        className="mt-4"
                        value={value || 0}
                        precision={
                            currency ? 2 : 0
                        }
                        prefix={
                            currency ? '₹' : undefined
                        }
                        suffix={suffix}
                        valueStyle={{
                            fontWeight: 700,
                            color: danger
                                ? '#ef4444'
                                : '#102a56',
                        }}
                    />

                    {growth !== undefined && (
                        <div
                            className={`mt-2 text-sm ${growth >= 0
                                ? 'text-green-600'
                                : 'text-red-500'
                                }`}
                        >
                            {growth >= 0
                                ? '↑'
                                : '↓'}{' '}
                            {Math.abs(growth).toFixed(1)}%
                            {' '}vs previous period
                        </div>
                    )}
                </>
            )}

        </Card>
    )
}

// =========================
// CHART DATA
// =========================

function createComparisonData(
    sales: SalesReportItem[],
    purchases: PurchaseReportItem[],
) {
    const map = new Map<
        string,
        {
            date: string
            sales: number
            purchases: number
        }
    >()

    sales.forEach((item) => {
        const date =
            item.date.substring(0, 10)

        const current =
            map.get(date) ?? {
                date,
                sales: 0,
                purchases: 0,
            }

        current.sales += item.grandTotal

        map.set(date, current)
    })

    purchases.forEach((item) => {
        const date =
            item.date.substring(0, 10)

        const current =
            map.get(date) ?? {
                date,
                sales: 0,
                purchases: 0,
            }

        current.purchases += item.grandTotal

        map.set(date, current)
    })

    return Array.from(map.values())
        .sort((a, b) =>
            a.date.localeCompare(b.date),
        )
}