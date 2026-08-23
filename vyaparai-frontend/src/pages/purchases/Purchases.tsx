import {
    Button,
    Card,
    Col,
    DatePicker,
    Divider,
    Empty,
    Input,
    InputNumber,
    List,
    Modal,
    Row,
    Select,
    Space,
    Statistic,
    Table,
    Tag,
    Typography,
    message,
} from 'antd'

import {
    CalendarOutlined,
    DeleteOutlined,
    EyeOutlined,
    MinusOutlined,
    PlusOutlined,
    ReloadOutlined,
    SearchOutlined,
    ShoppingOutlined,
    TruckOutlined,
} from '@ant-design/icons'

import {
    useEffect,
    useMemo,
    useState,
} from 'react'

import dayjs, {
    Dayjs,
} from 'dayjs'

const { Title, Text } = Typography

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL

/* =========================================================
   TYPES
========================================================= */

interface Product {
    id: string
    name: string
    sku: string
    barcode?: string
    category?: string
    brand?: string

    purchasePrice: number
    sellingPrice?: number
    gstPercentage: number

    currentQuantity: number
    minimumStockLevel?: number

    unit: string
    isActive?: boolean
}

interface Supplier {
    id: string
    supplierName: string
    mobile: string
    email?: string
    address?: string

    totalPurchases?: number
    paid?: number
    pending?: number
}

interface PurchaseItem {
    productId: string
    productName: string
    sku: string
    quantity: number
    purchasePrice: number
    gstPercent: number
    discountPercent: number
    totalAmount: number
}

interface CartItem extends Product {
    purchaseQuantity: number
    purchasePriceInput: number
    discountPercent: number
    gstPercentInput: number
}

interface PurchaseResponse {
    id: string
    businessId: string
    supplierId: string
    supplierName: string
    invoiceNumber: string
    purchaseDate: string
    items: PurchaseItem[]

    subtotal: number
    discountTotal: number
    gstTotal: number
    grandTotal: number

    paidAmount: number
    pendingAmount: number

    paymentStatus: string
    notes?: string
    createdAt: string
}

interface PagedResult<T> {
    items: T[]
    totalCount: number
    page: number
    pageSize: number
}

interface ApiResponse<T> {
    success: boolean
    message?: string
    data: T
    errors?: unknown
}

/* =========================================================
   HELPERS
========================================================= */

const getToken = () =>
    localStorage.getItem('vyaparai_token') || ''

const money = (
    value: number,
) =>
    new Intl.NumberFormat(
        'en-IN',
        {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2,
        },
    ).format(value || 0)

const getApiData = <T,>(
    result: T | ApiResponse<T>,
): T => {
    if (
        result &&
        typeof result === 'object' &&
        'data' in result
    ) {
        return (
            result as ApiResponse<T>
        ).data
    }

    return result as T
}

/* =========================================================
   COMPONENT
========================================================= */

export default function Purchases() {
    /* =========================
       DATA
    ========================= */

    const [products, setProducts] =
        useState<Product[]>([])

    const [suppliers, setSuppliers] =
        useState<Supplier[]>([])

    const [purchases, setPurchases] =
        useState<PurchaseResponse[]>([])

    /* =========================
       PURCHASE CART
    ========================= */

    const [cart, setCart] =
        useState<CartItem[]>([])

    const [supplierId, setSupplierId] =
        useState<string>()

    const [invoiceNumber, setInvoiceNumber] =
        useState('')

    const [purchaseDate, setPurchaseDate] =
        useState<Dayjs>(dayjs())

    const [paidAmount, setPaidAmount] =
        useState(0)

    const [notes, setNotes] =
        useState('')

    const [productSearch, setProductSearch] =
        useState('')

    /* =========================
       UI STATE
    ========================= */

    const [loading, setLoading] =
        useState(false)

    const [productsLoading, setProductsLoading] =
        useState(false)

    const [suppliersLoading, setSuppliersLoading] =
        useState(false)

    const [purchasesLoading, setPurchasesLoading] =
        useState(false)

    const [showPurchaseModal, setShowPurchaseModal] =
        useState(false)

    const [selectedPurchase, setSelectedPurchase] =
        useState<PurchaseResponse | null>(null)

    /* =========================
       HISTORY FILTERS
    ========================= */

    const [historyPage, setHistoryPage] =
        useState(1)

    const [historyPageSize, setHistoryPageSize] =
        useState(10)

    const [historyTotal, setHistoryTotal] =
        useState(0)

    const [filterSupplierId, setFilterSupplierId] =
        useState<string>()

    const [fromDate, setFromDate] =
        useState<Dayjs | null>(null)

    const [toDate, setToDate] =
        useState<Dayjs | null>(null)

    /* =========================================================
       LOAD INITIAL DATA
    ========================================================= */

    useEffect(() => {
        loadProducts()
        loadSuppliers()
        loadPurchases()
    }, [])

    /* =========================================================
       API HEADERS
    ========================================================= */

    const getHeaders = () => ({
        Authorization:
            `Bearer ${getToken()}`,
        'Content-Type':
            'application/json',
    })

    /* =========================================================
       LOAD PRODUCTS
    ========================================================= */

    const loadProducts = async () => {
        try {
            setProductsLoading(true)

            const response =
                await fetch(
                    `${API_BASE_URL}/products`,
                    {
                        headers: getHeaders(),
                    },
                )

            if (!response.ok) {
                throw new Error(
                    `Products API failed: ${response.status}`,
                )
            }

            const result =
                await response.json()

            const data =
                getApiData<any>(result)

            const items =
                Array.isArray(data)
                    ? data
                    : data?.items ?? []

            setProducts(items)
        } catch (error) {
            console.error(
                'Products error:',
                error,
            )

            message.error(
                'Products load nahi ho paaye',
            )
        } finally {
            setProductsLoading(false)
        }
    }

    /* =========================================================
       LOAD SUPPLIERS
    ========================================================= */

    const loadSuppliers = async () => {
        try {
            setSuppliersLoading(true)

            const response =
                await fetch(
                    `${API_BASE_URL}/suppliers`,
                    {
                        headers: getHeaders(),
                    },
                )

            if (!response.ok) {
                throw new Error(
                    `Suppliers API failed: ${response.status}`,
                )
            }

            const result =
                await response.json()

            const data =
                getApiData<any>(result)

            const items =
                Array.isArray(data)
                    ? data
                    : data?.items ?? []

            setSuppliers(items)
        } catch (error) {
            console.error(
                'Suppliers error:',
                error,
            )

            message.error(
                'Suppliers load nahi ho paaye',
            )
        } finally {
            setSuppliersLoading(false)
        }
    }

    /* =========================================================
       LOAD PURCHASE HISTORY
    ========================================================= */

    const loadPurchases = async (
        page = historyPage,
    ) => {
        try {
            setPurchasesLoading(true)

            const params =
                new URLSearchParams()

            params.set(
                'page',
                String(page),
            )

            params.set(
                'pageSize',
                String(historyPageSize),
            )

            if (filterSupplierId) {
                params.set(
                    'supplierId',
                    filterSupplierId,
                )
            }

            if (fromDate) {
                params.set(
                    'fromDate',
                    fromDate
                        .startOf('day')
                        .toISOString(),
                )
            }

            if (toDate) {
                params.set(
                    'toDate',
                    toDate
                        .endOf('day')
                        .toISOString(),
                )
            }

            const response =
                await fetch(
                    `${API_BASE_URL}/purchases?${params.toString()}`,
                    {
                        headers: getHeaders(),
                    },
                )

            if (!response.ok) {
                throw new Error(
                    `Purchases API failed: ${response.status}`,
                )
            }

            const result =
                await response.json()

            const data =
                getApiData<
                    PagedResult<PurchaseResponse>
                >(result)

            setPurchases(
                data?.items ?? [],
            )

            setHistoryTotal(
                data?.totalCount ?? 0,
            )
        } catch (error) {
            console.error(
                'Purchases error:',
                error,
            )

            message.error(
                'Purchase history load nahi ho payi',
            )
        } finally {
            setPurchasesLoading(false)
        }
    }

    /* =========================================================
       PRODUCT SEARCH
    ========================================================= */

    const filteredProducts =
        useMemo(() => {
            const value =
                productSearch
                    .trim()
                    .toLowerCase()

            if (!value) {
                return products.slice(0, 12)
            }

            return products
                .filter(product =>
                    product.name
                        .toLowerCase()
                        .includes(value) ||
                    product.sku
                        .toLowerCase()
                        .includes(value) ||
                    product.barcode
                        ?.toLowerCase()
                        .includes(value),
                )
                .slice(0, 12)
        }, [
            products,
            productSearch,
        ])

    /* =========================================================
       ADD PRODUCT
    ========================================================= */

    const addProduct = (
        product: Product,
    ) => {
        setCart(current => {
            const existing =
                current.find(
                    item =>
                        item.id === product.id,
                )

            if (existing) {
                return current.map(item =>
                    item.id === product.id
                        ? {
                            ...item,
                            purchaseQuantity:
                                item.purchaseQuantity +
                                1,
                        }
                        : item,
                )
            }

            return [
                ...current,
                {
                    ...product,
                    purchaseQuantity: 1,
                    purchasePriceInput:
                        product.purchasePrice || 0,
                    discountPercent: 0,
                    gstPercentInput:
                        product.gstPercentage || 0,
                },
            ]
        })

        setProductSearch('')
    }

    /* =========================================================
       QUANTITY
    ========================================================= */

    const increaseQuantity = (
        productId: string,
    ) => {
        setCart(current =>
            current.map(item =>
                item.id === productId
                    ? {
                        ...item,
                        purchaseQuantity:
                            item.purchaseQuantity +
                            1,
                    }
                    : item,
            ),
        )
    }

    const decreaseQuantity = (
        productId: string,
    ) => {
        setCart(current =>
            current
                .map(item =>
                    item.id === productId
                        ? {
                            ...item,
                            purchaseQuantity:
                                item.purchaseQuantity -
                                1,
                        }
                        : item,
                )
                .filter(
                    item =>
                        item.purchaseQuantity >
                        0,
                ),
        )
    }

    const removeProduct = (
        productId: string,
    ) => {
        setCart(current =>
            current.filter(
                item =>
                    item.id !== productId,
            ),
        )
    }

    /* =========================================================
       UPDATE PRICE
    ========================================================= */

    const updatePurchasePrice = (
        productId: string,
        value: number,
    ) => {
        setCart(current =>
            current.map(item =>
                item.id === productId
                    ? {
                        ...item,
                        purchasePriceInput:
                            Math.max(
                                0,
                                value,
                            ),
                    }
                    : item,
            ),
        )
    }

    /* =========================================================
       UPDATE GST
    ========================================================= */

    const updateGst = (
        productId: string,
        value: number,
    ) => {
        setCart(current =>
            current.map(item =>
                item.id === productId
                    ? {
                        ...item,
                        gstPercentInput:
                            Math.min(
                                100,
                                Math.max(
                                    0,
                                    value,
                                ),
                            ),
                    }
                    : item,
            ),
        )
    }

    /* =========================================================
       UPDATE DISCOUNT
    ========================================================= */

    const updateDiscount = (
        productId: string,
        value: number,
    ) => {
        setCart(current =>
            current.map(item =>
                item.id === productId
                    ? {
                        ...item,
                        discountPercent:
                            Math.min(
                                100,
                                Math.max(
                                    0,
                                    value,
                                ),
                            ),
                    }
                    : item,
            ),
        )
    }

    /* =========================================================
       CALCULATIONS
    ========================================================= */

    const subtotal =
        useMemo(() => {
            return cart.reduce(
                (sum, item) =>
                    sum +
                    item.purchasePriceInput *
                    item.purchaseQuantity,
                0,
            )
        }, [cart])

    const discountTotal =
        useMemo(() => {
            return cart.reduce(
                (sum, item) => {
                    const base =
                        item.purchasePriceInput *
                        item.purchaseQuantity

                    return (
                        sum +
                        base *
                        (item.discountPercent /
                            100)
                    )
                },
                0,
            )
        }, [cart])

    const gstTotal =
        useMemo(() => {
            return cart.reduce(
                (sum, item) => {
                    const base =
                        item.purchasePriceInput *
                        item.purchaseQuantity

                    const discount =
                        base *
                        (item.discountPercent /
                            100)

                    const taxable =
                        base - discount

                    return (
                        sum +
                        taxable *
                        (item.gstPercentInput /
                            100)
                    )
                },
                0,
            )
        }, [cart])

    const grandTotal =
        Math.round(
            Math.max(
                0,
                subtotal -
                discountTotal +
                gstTotal,
            ) * 100,
        ) / 100

    const safePaidAmount =
        Math.min(
            Math.max(
                0,
                paidAmount,
            ),
            grandTotal,
        )

    const pendingAmount =
        Math.round(
            Math.max(
                0,
                grandTotal -
                safePaidAmount,
            ) * 100,
        ) / 100

    const paymentStatus =
        pendingAmount <= 0
            ? 'Paid'
            : safePaidAmount > 0
                ? 'Partial'
                : 'Unpaid'

    /* =========================================================
       RESET PURCHASE
    ========================================================= */

    const resetPurchase = () => {
        setCart([])
        setSupplierId(undefined)
        setInvoiceNumber('')
        setPurchaseDate(dayjs())
        setPaidAmount(0)
        setNotes('')
        setProductSearch('')
    }

    /* =========================================================
       CREATE PURCHASE
    ========================================================= */

    const createPurchase =
        async () => {
            if (!supplierId) {
                message.warning(
                    'Supplier select karo',
                )
                return
            }

            if (cart.length === 0) {
                message.warning(
                    'Kam se kam ek product add karo',
                )
                return
            }

            try {
                setLoading(true)

                const payload = {
                    supplierId,

                    invoiceNumber:
                        invoiceNumber.trim() ||
                        undefined,

                    purchaseDate:
                        purchaseDate
                            ? purchaseDate
                                .startOf('day')
                                .toISOString()
                            : undefined,

                    items: cart.map(
                        item => ({
                            productId:
                                item.id,

                            quantity:
                                item.purchaseQuantity,

                            purchasePrice:
                                item.purchasePriceInput,

                            gstPercent:
                                item.gstPercentInput,

                            discountPercent:
                                item.discountPercent,
                        }),
                    ),

                    paidAmount:
                        safePaidAmount,

                    notes:
                        notes.trim() ||
                        undefined,
                }

                const response =
                    await fetch(
                        `${API_BASE_URL}/purchases`,
                        {
                            method: 'POST',

                            headers:
                                getHeaders(),

                            body:
                                JSON.stringify(
                                    payload,
                                ),
                        },
                    )

                const result =
                    await response.json()

                if (!response.ok) {
                    throw new Error(
                        result?.message ||
                        'Purchase create nahi ho payi',
                    )
                }

                const purchase =
                    getApiData<PurchaseResponse>(
                        result,
                    )

                message.success(
                    `Purchase ${purchase.invoiceNumber} successfully create ho gayi`,
                )

                resetPurchase()

                setShowPurchaseModal(
                    false,
                )

                await Promise.all([
                    loadProducts(),
                    loadSuppliers(),
                    loadPurchases(1),
                ])

                setHistoryPage(1)
            } catch (error: any) {
                console.error(
                    'Create purchase error:',
                    error,
                )

                message.error(
                    error?.message ||
                    'Purchase create nahi ho payi',
                )
            } finally {
                setLoading(false)
            }
        }

    /* =========================================================
       VIEW PURCHASE
    ========================================================= */

    const viewPurchase =
        async (
            purchaseId: string,
        ) => {
            try {
                const response =
                    await fetch(
                        `${API_BASE_URL}/purchases/${purchaseId}`,
                        {
                            headers:
                                getHeaders(),
                        },
                    )

                const result =
                    await response.json()

                if (!response.ok) {
                    throw new Error(
                        result?.message ||
                        'Purchase details load failed',
                    )
                }

                setSelectedPurchase(
                    getApiData<PurchaseResponse>(
                        result,
                    ),
                )
            } catch (error: any) {
                console.error(error)

                message.error(
                    error?.message ||
                    'Purchase details load nahi ho paayi',
                )
            }
        }

    /* =========================================================
       FILTER
    ========================================================= */

    const applyFilters = () => {
        setHistoryPage(1)
        loadPurchases(1)
    }

    const clearFilters = () => {
        setFilterSupplierId(
            undefined,
        )
        setFromDate(null)
        setToDate(null)
        setHistoryPage(1)

        setTimeout(() => {
            loadPurchases(1)
        }, 0)
    }

    /* =========================================================
       PURCHASE TABLE
    ========================================================= */

    const columns = [
        {
            title: 'Invoice',
            dataIndex:
                'invoiceNumber',
            key: 'invoiceNumber',
            render: (
                value: string,
            ) => (
                <Text strong>
                    {value}
                </Text>
            ),
        },

        {
            title: 'Supplier',
            dataIndex:
                'supplierName',
            key: 'supplierName',
            render: (
                value: string,
            ) => (
                <div>
                    <Text strong>
                        {value}
                    </Text>
                </div>
            ),
        },

        {
            title: 'Date',
            dataIndex:
                'purchaseDate',
            key: 'purchaseDate',
            render: (
                value: string,
            ) =>
                dayjs(value).format(
                    'DD MMM YYYY',
                ),
        },

        {
            title: 'Items',
            key: 'items',
            render: (
                _: unknown,
                record: PurchaseResponse,
            ) =>
                record.items.reduce(
                    (
                        total,
                        item,
                    ) =>
                        total +
                        item.quantity,
                    0,
                ),
        },

        {
            title: 'Grand Total',
            dataIndex:
                'grandTotal',
            key: 'grandTotal',
            render: (
                value: number,
            ) => (
                <Text strong>
                    {money(value)}
                </Text>
            ),
        },

        {
            title: 'Paid',
            dataIndex:
                'paidAmount',
            key: 'paidAmount',
            render: (
                value: number,
            ) => (
                <Text className="text-green-600">
                    {money(value)}
                </Text>
            ),
        },

        {
            title: 'Pending',
            dataIndex:
                'pendingAmount',
            key: 'pendingAmount',
            render: (
                value: number,
            ) => (
                <Text
                    className={
                        value > 0
                            ? 'text-orange-600'
                            : 'text-green-600'
                    }
                >
                    {money(value)}
                </Text>
            ),
        },

        {
            title: 'Status',
            dataIndex:
                'paymentStatus',
            key: 'paymentStatus',
            render: (
                value: string,
            ) => (
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

        {
            title: 'Action',
            key: 'action',
            render: (
                _: unknown,
                record: PurchaseResponse,
            ) => (
                <Button
                    type="text"
                    icon={
                        <EyeOutlined />
                    }
                    onClick={() =>
                        viewPurchase(
                            record.id,
                        )
                    }
                >
                    View
                </Button>
            ),
        },
    ]

    /* =========================================================
       RENDER
    ========================================================= */

    return (
        <div className="min-h-full bg-[#f6f8fb] p-3 sm:p-4 lg:p-6">

            {/* =====================================================
          HEADER
      ===================================================== */}

            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                <div>
                    <Title
                        level={3}
                        className="!mb-1 !text-[#102A5C]"
                    >
                        Purchases
                    </Title>

                    <Text type="secondary">
                        Manage purchases, suppliers and stock
                    </Text>
                </div>

                <Button
                    type="primary"
                    size="large"
                    icon={
                        <ShoppingOutlined />
                    }
                    onClick={() => {
                        resetPurchase()
                        setShowPurchaseModal(
                            true,
                        )
                    }}
                >
                    New Purchase
                </Button>

            </div>

            {/* =====================================================
          STATS
      ===================================================== */}

            <Row
                gutter={[16, 16]}
                className="mb-5"
            >

                <Col
                    xs={24}
                    sm={12}
                    lg={8}
                >
                    <Card
                        bordered={false}
                        className="rounded-2xl shadow-sm"
                    >
                        <Statistic
                            title="Total Purchases"
                            value={
                                historyTotal
                            }
                            prefix={
                                <ShoppingOutlined />
                            }
                        />
                    </Card>
                </Col>

                <Col
                    xs={24}
                    sm={12}
                    lg={8}
                >
                    <Card
                        bordered={false}
                        className="rounded-2xl shadow-sm"
                    >
                        <Statistic
                            title="Suppliers"
                            value={
                                suppliers.length
                            }
                            prefix={
                                <TruckOutlined />
                            }
                        />
                    </Card>
                </Col>

                <Col
                    xs={24}
                    sm={12}
                    lg={8}
                >
                    <Card
                        bordered={false}
                        className="rounded-2xl shadow-sm"
                    >
                        <Statistic
                            title="Products"
                            value={
                                products.length
                            }
                            prefix={
                                <ShoppingOutlined />
                            }
                        />
                    </Card>
                </Col>

            </Row>

            {/* =====================================================
          HISTORY
      ===================================================== */}

            <Card
                bordered={false}
                className="rounded-2xl shadow-sm"
            >

                {/* FILTER HEADER */}

                <div className="mb-4 flex flex-col gap-3">

                    <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">

                        <div>
                            <Title
                                level={5}
                                className="!mb-1"
                            >
                                Purchase History
                            </Title>

                            <Text type="secondary">
                                View and filter all purchase records
                            </Text>
                        </div>

                        <Button
                            icon={
                                <ReloadOutlined />
                            }
                            onClick={() =>
                                loadPurchases(
                                    historyPage,
                                )
                            }
                            loading={
                                purchasesLoading
                            }
                        >
                            Refresh
                        </Button>

                    </div>

                    <Row gutter={[12, 12]}>

                        <Col
                            xs={24}
                            sm={12}
                            lg={7}
                        >
                            <Select
                                allowClear
                                showSearch
                                className="w-full"
                                placeholder="Filter by supplier"
                                optionFilterProp="label"
                                value={
                                    filterSupplierId
                                }
                                onChange={value =>
                                    setFilterSupplierId(
                                        value,
                                    )
                                }
                                options={suppliers.map(
                                    supplier => ({
                                        value:
                                            supplier.id,
                                        label:
                                            supplier.supplierName,
                                    }),
                                )}
                            />
                        </Col>

                        <Col
                            xs={24}
                            sm={12}
                            lg={6}
                        >
                            <DatePicker
                                className="w-full"
                                placeholder="From date"
                                value={
                                    fromDate
                                }
                                onChange={value =>
                                    setFromDate(
                                        value,
                                    )
                                }
                                suffixIcon={
                                    <CalendarOutlined />
                                }
                            />
                        </Col>

                        <Col
                            xs={24}
                            sm={12}
                            lg={6}
                        >
                            <DatePicker
                                className="w-full"
                                placeholder="To date"
                                value={
                                    toDate
                                }
                                onChange={value =>
                                    setToDate(
                                        value,
                                    )
                                }
                                suffixIcon={
                                    <CalendarOutlined />
                                }
                            />
                        </Col>

                        <Col
                            xs={24}
                            sm={12}
                            lg={5}
                        >
                            <Space className="w-full">
                                <Button
                                    type="primary"
                                    onClick={
                                        applyFilters
                                    }
                                >
                                    Apply
                                </Button>

                                <Button
                                    onClick={
                                        clearFilters
                                    }
                                >
                                    Clear
                                </Button>
                            </Space>
                        </Col>

                    </Row>

                </div>

                {/* TABLE */}

                {purchases.length === 0 &&
                    !purchasesLoading ? (
                    <Empty
                        description="No purchase records found"
                    />
                ) : (
                    <Table
                        rowKey="id"
                        loading={
                            purchasesLoading
                        }
                        columns={
                            columns
                        }
                        dataSource={
                            purchases
                        }
                        scroll={{
                            x: 1000,
                        }}
                        pagination={{
                            current:
                                historyPage,
                            pageSize:
                                historyPageSize,
                            total:
                                historyTotal,
                            showSizeChanger:
                                true,
                            showTotal:
                                total =>
                                    `Total ${total} purchases`,
                            onChange: (
                                page,
                                pageSize,
                            ) => {
                                setHistoryPage(
                                    page,
                                )
                                setHistoryPageSize(
                                    pageSize,
                                )
                                loadPurchases(
                                    page,
                                )
                            },
                        }}
                    />
                )}

            </Card>

            {/* =====================================================
          NEW PURCHASE MODAL
      ===================================================== */}

            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <ShoppingOutlined />
                        <span>
                            Create New Purchase
                        </span>
                    </div>
                }
                open={
                    showPurchaseModal
                }
                onCancel={() => {
                    if (!loading) {
                        setShowPurchaseModal(
                            false,
                        )
                    }
                }}
                footer={null}
                width={1100}
                centered
                destroyOnClose
            >

                <div className="space-y-5">

                    {/* SUPPLIER / INVOICE */}

                    <Row gutter={[12, 12]}>

                        <Col
                            xs={24}
                            md={8}
                        >
                            <Text
                                strong
                                className="mb-2 block"
                            >
                                Supplier
                            </Text>

                            <Select
                                showSearch
                                allowClear
                                loading={
                                    suppliersLoading
                                }
                                className="w-full"
                                size="large"
                                placeholder="Select supplier"
                                optionFilterProp="label"
                                value={
                                    supplierId
                                }
                                onChange={value =>
                                    setSupplierId(
                                        value,
                                    )
                                }
                                options={suppliers.map(
                                    supplier => ({
                                        value:
                                            supplier.id,
                                        label:
                                            `${supplier.supplierName} - ${supplier.mobile}`,
                                    }),
                                )}
                            />
                        </Col>

                        <Col
                            xs={24}
                            md={8}
                        >
                            <Text
                                strong
                                className="mb-2 block"
                            >
                                Supplier Invoice Number
                            </Text>

                            <Input
                                size="large"
                                placeholder="Optional invoice number"
                                value={
                                    invoiceNumber
                                }
                                onChange={e =>
                                    setInvoiceNumber(
                                        e.target.value,
                                    )
                                }
                            />
                        </Col>

                        <Col
                            xs={24}
                            md={8}
                        >
                            <Text
                                strong
                                className="mb-2 block"
                            >
                                Purchase Date
                            </Text>

                            <DatePicker
                                size="large"
                                className="w-full"
                                value={
                                    purchaseDate
                                }
                                onChange={value =>
                                    value &&
                                    setPurchaseDate(
                                        value,
                                    )
                                }
                            />
                        </Col>

                    </Row>

                    <Divider className="!my-2" />

                    {/* PRODUCT SEARCH */}

                    <div>

                        <Text
                            strong
                            className="mb-2 block"
                        >
                            Add Products
                        </Text>

                        <Input
                            size="large"
                            prefix={
                                <SearchOutlined />
                            }
                            placeholder="Search product by name, SKU or barcode..."
                            value={
                                productSearch
                            }
                            onChange={e =>
                                setProductSearch(
                                    e.target.value,
                                )
                            }
                            allowClear
                        />

                        <div className="mt-3">

                            {filteredProducts.length ===
                                0 ? (
                                <Empty
                                    image={
                                        Empty.PRESENTED_IMAGE_SIMPLE
                                    }
                                    description={
                                        productsLoading
                                            ? 'Loading products...'
                                            : 'No product found'
                                    }
                                />
                            ) : (
                                <Row
                                    gutter={[
                                        8,
                                        8,
                                    ]}
                                >

                                    {filteredProducts.map(
                                        product => (
                                            <Col
                                                xs={24}
                                                sm={12}
                                                lg={8}
                                                key={
                                                    product.id
                                                }
                                            >

                                                <Card
                                                    size="small"
                                                    hoverable
                                                    className="rounded-xl"
                                                    onClick={() =>
                                                        addProduct(
                                                            product,
                                                        )
                                                    }
                                                >

                                                    <div className="flex items-start justify-between gap-2">

                                                        <div className="min-w-0">

                                                            <Text
                                                                strong
                                                                className="block truncate"
                                                            >
                                                                {
                                                                    product.name
                                                                }
                                                            </Text>

                                                            <Text
                                                                type="secondary"
                                                                className="text-xs"
                                                            >
                                                                SKU:{' '}
                                                                {
                                                                    product.sku
                                                                }
                                                            </Text>

                                                        </div>

                                                        <Tag color="blue">
                                                            Add
                                                        </Tag>

                                                    </div>

                                                    <div className="mt-2 flex justify-between">

                                                        <Text>
                                                            Cost:{' '}
                                                            {money(
                                                                product.purchasePrice,
                                                            )}
                                                        </Text>

                                                        <Text type="secondary">
                                                            Stock:{' '}
                                                            {
                                                                product.currentQuantity
                                                            }
                                                        </Text>

                                                    </div>

                                                </Card>

                                            </Col>
                                        ),
                                    )}

                                </Row>
                            )}

                        </div>

                    </div>

                    {/* CART */}

                    <Card
                        size="small"
                        className="rounded-xl"
                        title={
                            <div className="flex justify-between">
                                <Text strong>
                                    Purchase Items
                                </Text>

                                <Tag color="blue">
                                    {
                                        cart.length
                                    } products
                                </Tag>
                            </div>
                        }
                    >

                        {cart.length === 0 ? (
                            <Empty
                                image={
                                    Empty.PRESENTED_IMAGE_SIMPLE
                                }
                                description="No products added"
                            />
                        ) : (

                            <div className="space-y-3">

                                {cart.map(
                                    item => {
                                        const base =
                                            item.purchasePriceInput *
                                            item.purchaseQuantity

                                        const discount =
                                            base *
                                            (item.discountPercent /
                                                100)

                                        const taxable =
                                            base -
                                            discount

                                        const gst =
                                            taxable *
                                            (item.gstPercentInput /
                                                100)

                                        const total =
                                            taxable + gst

                                        return (
                                            <div
                                                key={
                                                    item.id
                                                }
                                                className="rounded-xl border border-gray-100 bg-gray-50 p-3"
                                            >

                                                <div className="flex flex-col gap-3">

                                                    <div className="flex items-start justify-between gap-2">

                                                        <div>

                                                            <Text strong>
                                                                {
                                                                    item.name
                                                                }
                                                            </Text>

                                                            <Text
                                                                type="secondary"
                                                                className="ml-2 text-xs"
                                                            >
                                                                {
                                                                    item.sku
                                                                }
                                                            </Text>

                                                        </div>

                                                        <Button
                                                            danger
                                                            type="text"
                                                            icon={
                                                                <DeleteOutlined />
                                                            }
                                                            onClick={() =>
                                                                removeProduct(
                                                                    item.id,
                                                                )
                                                            }
                                                        />

                                                    </div>

                                                    <Row
                                                        gutter={[
                                                            8,
                                                            8,
                                                        ]}
                                                    >

                                                        {/* QTY */}

                                                        <Col
                                                            xs={12}
                                                            sm={6}
                                                        >

                                                            <Text
                                                                type="secondary"
                                                                className="mb-1 block text-xs"
                                                            >
                                                                Quantity
                                                            </Text>

                                                            <Space.Compact>

                                                                <Button
                                                                    icon={
                                                                        <MinusOutlined />
                                                                    }
                                                                    onClick={() =>
                                                                        decreaseQuantity(
                                                                            item.id,
                                                                        )
                                                                    }
                                                                />

                                                                <Button>
                                                                    {
                                                                        item.purchaseQuantity
                                                                    }
                                                                </Button>

                                                                <Button
                                                                    icon={
                                                                        <PlusOutlined />
                                                                    }
                                                                    onClick={() =>
                                                                        increaseQuantity(
                                                                            item.id,
                                                                        )
                                                                    }
                                                                />

                                                            </Space.Compact>

                                                        </Col>

                                                        {/* PRICE */}

                                                        <Col
                                                            xs={12}
                                                            sm={6}
                                                        >

                                                            <Text
                                                                type="secondary"
                                                                className="mb-1 block text-xs"
                                                            >
                                                                Purchase Price
                                                            </Text>

                                                            <InputNumber
                                                                className="w-full"
                                                                min={0}
                                                                value={
                                                                    item.purchasePriceInput
                                                                }
                                                                onChange={
                                                                    value =>
                                                                        updatePurchasePrice(
                                                                            item.id,
                                                                            Number(
                                                                                value ||
                                                                                0,
                                                                            ),
                                                                        )
                                                                }
                                                            />

                                                        </Col>

                                                        {/* GST */}

                                                        <Col
                                                            xs={12}
                                                            sm={5}
                                                        >

                                                            <Text
                                                                type="secondary"
                                                                className="mb-1 block text-xs"
                                                            >
                                                                GST %
                                                            </Text>

                                                            <InputNumber
                                                                className="w-full"
                                                                min={0}
                                                                max={100}
                                                                value={
                                                                    item.gstPercentInput
                                                                }
                                                                onChange={
                                                                    value =>
                                                                        updateGst(
                                                                            item.id,
                                                                            Number(
                                                                                value ||
                                                                                0,
                                                                            ),
                                                                        )
                                                                }
                                                            />

                                                        </Col>

                                                        {/* DISCOUNT */}

                                                        <Col
                                                            xs={12}
                                                            sm={5}
                                                        >

                                                            <Text
                                                                type="secondary"
                                                                className="mb-1 block text-xs"
                                                            >
                                                                Discount %
                                                            </Text>

                                                            <InputNumber
                                                                className="w-full"
                                                                min={0}
                                                                max={100}
                                                                value={
                                                                    item.discountPercent
                                                                }
                                                                onChange={
                                                                    value =>
                                                                        updateDiscount(
                                                                            item.id,
                                                                            Number(
                                                                                value ||
                                                                                0,
                                                                            ),
                                                                        )
                                                                }
                                                            />

                                                        </Col>

                                                        {/* TOTAL */}

                                                        <Col
                                                            xs={24}
                                                            sm={2}
                                                            className="flex items-end justify-end"
                                                        >

                                                            <div className="text-right">

                                                                <Text
                                                                    type="secondary"
                                                                    className="block text-xs"
                                                                >
                                                                    Total
                                                                </Text>

                                                                <Text strong>
                                                                    {money(
                                                                        total,
                                                                    )}
                                                                </Text>

                                                            </div>

                                                        </Col>

                                                    </Row>

                                                </div>

                                            </div>
                                        )
                                    },
                                )}

                            </div>

                        )}

                    </Card>

                    {/* TOTAL + PAYMENT */}

                    <Row gutter={[16, 16]}>

                        <Col
                            xs={24}
                            md={14}
                        >

                            <Card
                                size="small"
                                className="rounded-xl"
                                title="Notes"
                            >

                                <Input.TextArea
                                    rows={4}
                                    placeholder="Add purchase notes..."
                                    value={
                                        notes
                                    }
                                    onChange={e =>
                                        setNotes(
                                            e.target.value,
                                        )
                                    }
                                />

                            </Card>

                        </Col>

                        <Col
                            xs={24}
                            md={10}
                        >

                            <Card
                                size="small"
                                className="rounded-xl"
                            >

                                <div className="space-y-3">

                                    <div className="flex justify-between">
                                        <Text>
                                            Subtotal
                                        </Text>

                                        <Text>
                                            {money(
                                                subtotal,
                                            )}
                                        </Text>
                                    </div>

                                    <div className="flex justify-between">
                                        <Text>
                                            Discount
                                        </Text>

                                        <Text className="text-red-500">
                                            -{' '}
                                            {money(
                                                discountTotal,
                                            )}
                                        </Text>
                                    </div>

                                    <div className="flex justify-between">
                                        <Text>
                                            GST
                                        </Text>

                                        <Text>
                                            {money(
                                                gstTotal,
                                            )}
                                        </Text>
                                    </div>

                                    <Divider className="!my-2" />

                                    <div className="flex justify-between">

                                        <Text strong>
                                            Grand Total
                                        </Text>

                                        <Text
                                            strong
                                            className="text-xl !text-[#102A5C]"
                                        >
                                            {money(
                                                grandTotal,
                                            )}
                                        </Text>

                                    </div>

                                    <div>

                                        <Text
                                            strong
                                            className="mb-1 block"
                                        >
                                            Paid Amount
                                        </Text>

                                        <InputNumber
                                            size="large"
                                            className="w-full"
                                            min={0}
                                            max={
                                                grandTotal
                                            }
                                            value={
                                                paidAmount
                                            }
                                            prefix="₹"
                                            onChange={
                                                value =>
                                                    setPaidAmount(
                                                        Number(
                                                            value ||
                                                            0,
                                                        ),
                                                    )
                                            }
                                        />

                                    </div>

                                    <div className="rounded-xl bg-orange-50 p-3">

                                        <div className="flex justify-between">

                                            <Text>
                                                Pending
                                            </Text>

                                            <Text
                                                strong
                                                className="text-orange-600"
                                            >
                                                {money(
                                                    pendingAmount,
                                                )}
                                            </Text>

                                        </div>

                                        <Tag
                                            className="mt-2"
                                            color={
                                                paymentStatus ===
                                                    'Paid'
                                                    ? 'green'
                                                    : paymentStatus ===
                                                        'Partial'
                                                        ? 'orange'
                                                        : 'red'
                                            }
                                        >
                                            {
                                                paymentStatus
                                            }
                                        </Tag>

                                    </div>

                                </div>

                            </Card>

                        </Col>

                    </Row>

                    {/* ACTIONS */}

                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">

                        <Button
                            size="large"
                            onClick={() =>
                                resetPurchase()
                            }
                            disabled={
                                loading
                            }
                        >
                            Clear
                        </Button>

                        <Button
                            type="primary"
                            size="large"
                            loading={
                                loading
                            }
                            disabled={
                                !supplierId ||
                                cart.length ===
                                0
                            }
                            onClick={
                                createPurchase
                            }
                        >
                            Save Purchase
                        </Button>

                    </div>

                </div>

            </Modal>

            {/* =====================================================
          PURCHASE DETAILS MODAL
      ===================================================== */}

            <Modal
                title="Purchase Details"
                open={
                    !!selectedPurchase
                }
                onCancel={() =>
                    setSelectedPurchase(
                        null,
                    )
                }
                footer={
                    <Button
                        onClick={() =>
                            setSelectedPurchase(
                                null,
                            )
                        }
                    >
                        Close
                    </Button>
                }
                width={850}
            >

                {selectedPurchase && (
                    <div>

                        {/* HEADER */}

                        <div className="mb-5 grid grid-cols-1 gap-4 rounded-xl bg-gray-50 p-4 sm:grid-cols-3">

                            <div>
                                <Text
                                    type="secondary"
                                    className="block text-xs"
                                >
                                    Invoice Number
                                </Text>

                                <Text strong>
                                    {
                                        selectedPurchase.invoiceNumber
                                    }
                                </Text>
                            </div>

                            <div>
                                <Text
                                    type="secondary"
                                    className="block text-xs"
                                >
                                    Supplier
                                </Text>

                                <Text strong>
                                    {
                                        selectedPurchase.supplierName
                                    }
                                </Text>
                            </div>

                            <div>
                                <Text
                                    type="secondary"
                                    className="block text-xs"
                                >
                                    Date
                                </Text>

                                <Text strong>
                                    {dayjs(
                                        selectedPurchase.purchaseDate,
                                    ).format(
                                        'DD MMM YYYY',
                                    )}
                                </Text>
                            </div>

                        </div>

                        {/* ITEMS */}

                        <Table
                            rowKey={record =>
                                record.productId
                            }
                            pagination={false}
                            scroll={{
                                x: 650,
                            }}
                            dataSource={
                                selectedPurchase.items
                            }
                            columns={[
                                {
                                    title: 'Product',
                                    dataIndex:
                                        'productName',
                                },
                                {
                                    title: 'SKU',
                                    dataIndex:
                                        'sku',
                                },
                                {
                                    title: 'Qty',
                                    dataIndex:
                                        'quantity',
                                },
                                {
                                    title: 'Price',
                                    dataIndex:
                                        'purchasePrice',
                                    render:
                                        value =>
                                            money(value),
                                },
                                {
                                    title: 'GST',
                                    dataIndex:
                                        'gstPercent',
                                    render:
                                        value =>
                                            `${value}%`,
                                },
                                {
                                    title: 'Discount',
                                    dataIndex:
                                        'discountPercent',
                                    render:
                                        value =>
                                            `${value}%`,
                                },
                                {
                                    title: 'Total',
                                    dataIndex:
                                        'totalAmount',
                                    render:
                                        value => (
                                            <Text strong>
                                                {money(
                                                    value,
                                                )}
                                            </Text>
                                        ),
                                },
                            ]}
                        />

                        <Divider />

                        {/* TOTALS */}

                        <div className="ml-auto max-w-sm space-y-2">

                            <div className="flex justify-between">
                                <Text>
                                    Subtotal
                                </Text>

                                <Text>
                                    {money(
                                        selectedPurchase.subtotal,
                                    )}
                                </Text>
                            </div>

                            <div className="flex justify-between">
                                <Text>
                                    Discount
                                </Text>

                                <Text className="text-red-500">
                                    -{' '}
                                    {money(
                                        selectedPurchase.discountTotal,
                                    )}
                                </Text>
                            </div>

                            <div className="flex justify-between">
                                <Text>
                                    GST
                                </Text>

                                <Text>
                                    {money(
                                        selectedPurchase.gstTotal,
                                    )}
                                </Text>
                            </div>

                            <Divider className="!my-2" />

                            <div className="flex justify-between">
                                <Text strong>
                                    Grand Total
                                </Text>

                                <Text
                                    strong
                                    className="text-lg"
                                >
                                    {money(
                                        selectedPurchase.grandTotal,
                                    )}
                                </Text>
                            </div>

                            <div className="flex justify-between">
                                <Text>
                                    Paid
                                </Text>

                                <Text className="text-green-600">
                                    {money(
                                        selectedPurchase.paidAmount,
                                    )}
                                </Text>
                            </div>

                            <div className="flex justify-between">
                                <Text>
                                    Pending
                                </Text>

                                <Text className="text-orange-600">
                                    {money(
                                        selectedPurchase.pendingAmount,
                                    )}
                                </Text>
                            </div>

                            <div className="flex justify-between">

                                <Text>
                                    Status
                                </Text>

                                <Tag
                                    color={
                                        selectedPurchase.paymentStatus ===
                                            'Paid'
                                            ? 'green'
                                            : selectedPurchase.paymentStatus ===
                                                'Partial'
                                                ? 'orange'
                                                : 'red'
                                    }
                                >
                                    {
                                        selectedPurchase.paymentStatus
                                    }
                                </Tag>

                            </div>

                        </div>

                        {selectedPurchase.notes && (
                            <>
                                <Divider />

                                <div>
                                    <Text
                                        strong
                                        className="block"
                                    >
                                        Notes
                                    </Text>

                                    <Text type="secondary">
                                        {
                                            selectedPurchase.notes
                                        }
                                    </Text>
                                </div>
                            </>
                        )}

                    </div>
                )}

            </Modal>

        </div>
    )
}