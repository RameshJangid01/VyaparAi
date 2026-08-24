import {
    Button,
    Card,
    Col,
    Divider,
    Empty,
    Input,
    InputNumber,
    List,
    Modal,
    Row,
    Select,
    Space,
    Tag,
    Typography,
    message,
} from 'antd'

import {
    DeleteOutlined,
    MinusOutlined,
    PlusOutlined,
    SearchOutlined,
    ShoppingCartOutlined,
    UserOutlined,
    CreditCardOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons'

import {
    useEffect,
    useMemo,
    useState,
} from 'react'
import { useNavigate } from 'react-router-dom'

const { Title, Text } = Typography

const API_URL = 'https://vyaparai-6032.onrender.com/api'

/* =========================
   TYPES
========================= */

interface Product {
    id: string
    name: string
    sku: string
    barcode?: string
    category?: string
    brand?: string

    sellingPrice: number
    purchasePrice?: number
    gstPercentage: number

    currentQuantity: number
    minimumStockLevel?: number

    unit: string
    isActive?: boolean
}

interface Customer {
    id: string
    name: string
    mobile: string
    email?: string
    address?: string

    totalPurchases?: number
    totalPaid?: number
    pendingAmount?: number
}

interface CartItem extends Product {
    cartQuantity: number
    discountPercent: number
}

interface SaleResponse {
    id: string
    invoiceNumber: string
    customerName?: string

    subtotal: number
    discountTotal: number
    gstTotal: number
    grandTotal: number

    paidAmount: number
    pendingAmount: number

    paymentMethod: string
    paymentStatus: string
}

/* =========================
   HELPERS
========================= */

const getToken = () =>
    localStorage.getItem('vyaparai_token') || ''

const money = (value: number) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2,
    }).format(value || 0)

/* =========================
   COMPONENT
========================= */

export default function Billing() {
    const navigate = useNavigate()
    const [products, setProducts] = useState<Product[]>([])


    const [customers, setCustomers] =
        useState<Customer[]>([])

    const [cart, setCart] =
        useState<CartItem[]>([])

    const [search, setSearch] =
        useState('')

    const [customerId, setCustomerId] =
        useState<string>()

    const [customerName, setCustomerName] =
        useState('')

    const [customerMobile, setCustomerMobile] =
        useState('')

    const [additionalDiscount, setAdditionalDiscount] =
        useState(0)

    const [paidAmount, setPaidAmount] =
        useState(0)

    const [paymentMethod, setPaymentMethod] =
        useState('Cash')

    const [loading, setLoading] =
        useState(false)

    const [productsLoading, setProductsLoading] =
        useState(false)

    const [customersLoading, setCustomersLoading] =
        useState(false)

    const [sale, setSale] =
        useState<SaleResponse | null>(null)

    const [showCustomerModal, setShowCustomerModal] =
        useState(false)

    /* =========================
       LOAD PRODUCTS
    ========================= */

    useEffect(() => {
        loadProducts()
        loadCustomers()
    }, [])

    const loadProducts = async () => {
        try {
            setProductsLoading(true)

            const response = await fetch(
                `${API_URL}/products`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${getToken()}`,
                    },
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
                result?.data ?? result

            const items =
                Array.isArray(data)
                    ? data
                    : data?.items ?? []

            setProducts(items)
        } catch (error) {
            console.error(error)

            message.error(
                'Products load nahi ho paaye',
            )
        } finally {
            setProductsLoading(false)
        }
    }

    /* =========================
       LOAD CUSTOMERS
    ========================= */

    const loadCustomers = async () => {
        try {
            setCustomersLoading(true)

            const response = await fetch(
                `${API_URL}/customers`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${getToken()}`,
                    },
                },
            )

            if (!response.ok) {
                throw new Error(
                    `Customers API failed: ${response.status}`,
                )
            }

            const result =
                await response.json()

            const data =
                result?.data ?? result

            const items =
                Array.isArray(data)
                    ? data
                    : data?.items ?? []

            setCustomers(items)
        } catch (error) {
            console.error(error)

            message.error(
                'Customers load nahi ho paaye',
            )
        } finally {
            setCustomersLoading(false)
        }
    }

    /* =========================
       SEARCH PRODUCTS
    ========================= */

    const filteredProducts = useMemo(() => {
        const value =
            search.trim().toLowerCase()

        if (!value) {
            return products.slice(0, 12)
        }

        return products
            .filter(product => {
                return (
                    product.name
                        .toLowerCase()
                        .includes(value) ||
                    product.sku
                        .toLowerCase()
                        .includes(value) ||
                    product.barcode
                        ?.toLowerCase()
                        .includes(value)
                )
            })
            .slice(0, 12)
    }, [products, search])

    /* =========================
       ADD PRODUCT
    ========================= */

    const addToCart = (
        product: Product,
    ) => {
        if (product.currentQuantity <= 0) {
            message.error(
                `${product.name} out of stock hai`,
            )
            return
        }

        setCart(current => {
            const existing =
                current.find(
                    item =>
                        item.id === product.id,
                )

            if (existing) {
                if (
                    existing.cartQuantity >=
                    product.currentQuantity
                ) {
                    message.warning(
                        'Available stock se zyada quantity nahi le sakte',
                    )

                    return current
                }

                return current.map(item =>
                    item.id === product.id
                        ? {
                            ...item,
                            cartQuantity:
                                item.cartQuantity + 1,
                        }
                        : item,
                )
            }

            return [
                ...current,
                {
                    ...product,
                    cartQuantity: 1,
                    discountPercent: 0,
                },
            ]
        })

        setSearch('')
    }

    /* =========================
       QUANTITY
    ========================= */

    const increaseQuantity = (
        productId: string,
    ) => {
        setCart(current =>
            current.map(item => {
                if (item.id !== productId) {
                    return item
                }

                if (
                    item.cartQuantity >=
                    item.currentQuantity
                ) {
                    message.warning(
                        `Stock available: ${item.currentQuantity}`,
                    )

                    return item
                }

                return {
                    ...item,
                    cartQuantity:
                        item.cartQuantity + 1,
                }
            }),
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
                            cartQuantity:
                                item.cartQuantity - 1,
                        }
                        : item,
                )
                .filter(
                    item =>
                        item.cartQuantity > 0,
                ),
        )
    }

    const removeItem = (
        productId: string,
    ) => {
        setCart(current =>
            current.filter(
                item =>
                    item.id !== productId,
            ),
        )
    }

    /* =========================
       ITEM DISCOUNT
    ========================= */

    const updateItemDiscount = (
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
                                Math.max(0, value),
                            ),
                    }
                    : item,
            ),
        )
    }

    /* =========================
       CALCULATIONS
    ========================= */

    const subtotal = useMemo(() => {
        return cart.reduce(
            (total, item) =>
                total +
                item.sellingPrice *
                item.cartQuantity,
            0,
        )
    }, [cart])

    const itemDiscountTotal = useMemo(() => {
        return cart.reduce(
            (total, item) => {
                const amount =
                    item.sellingPrice *
                    item.cartQuantity

                return (
                    total +
                    amount *
                    (item.discountPercent / 100)
                )
            },
            0,
        )
    }, [cart])

    const afterItemDiscount =
        Math.max(
            0,
            subtotal -
            itemDiscountTotal,
        )

    const overallDiscount =
        Math.min(
            additionalDiscount,
            afterItemDiscount,
        )

    const taxableAmount =
        Math.max(
            0,
            afterItemDiscount -
            overallDiscount,
        )

    const gstAmount = useMemo(() => {
        return cart.reduce(
            (total, item) => {
                const amount =
                    item.sellingPrice *
                    item.cartQuantity

                const itemDiscount =
                    amount *
                    (item.discountPercent / 100)

                const proportion =
                    subtotal > 0
                        ? taxableAmount / subtotal
                        : 0

                const taxableItem =
                    Math.max(
                        0,
                        amount -
                        itemDiscount,
                    ) * proportion

                return (
                    total +
                    taxableItem *
                    (item.gstPercentage / 100)
                )
            },
            0,
        )
    }, [
        cart,
        subtotal,
        taxableAmount,
    ])

    const grandTotal =
        taxableAmount +
        gstAmount

    const pendingAmount =
        Math.max(
            0,
            grandTotal -
            paidAmount,
        )

    const totalItems =
        cart.reduce(
            (total, item) =>
                total + item.cartQuantity,
            0,
        )

    /* =========================
       COMPLETE SALE
    ========================= */

    const completeSale = async () => {
        if (cart.length === 0) {
            message.warning(
                'Pehle product add karo',
            )
            return
        }

        if (paidAmount > grandTotal) {
            message.error(
                'Paid amount total se zyada nahi ho sakta',
            )
            return
        }

        try {
            setLoading(true)

            const request = {
                customerId:
                    customerId || null,

                customerName:
                    customerId
                        ? undefined
                        : customerName ||
                        'Walk-in Customer',

                customerMobile:
                    customerId
                        ? undefined
                        : customerMobile,

                items: cart.map(item => ({
                    productId: item.id,

                    quantity:
                        item.cartQuantity,

                    unitPrice:
                        item.sellingPrice,

                    discountPercent:
                        item.discountPercent,

                    gstPercent:
                        item.gstPercentage,
                })),

                additionalDiscount:
                    additionalDiscount,

                paymentMethod:
                    paymentMethod,

                paidAmount:
                    paidAmount,

                clientRequestId:
                    crypto.randomUUID(),
            }

            const response =
                await fetch(
                    `${API_URL}/sales`,
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json',

                            Authorization:
                                `Bearer ${getToken()}`,
                        },

                        body:
                            JSON.stringify(request),
                    },
                )

            const result =
                await response.json()

            if (!response.ok) {
                throw new Error(
                    result?.message ||
                    result?.errors ||
                    'Sale create nahi hui',
                )
            }

            const data =
                result?.data ?? result

            setSale(data)

            message.success(
                'Bill successfully create ho gaya',
            )

            setCart([])
            setSearch('')
            setCustomerId(undefined)
            setCustomerName('')
            setCustomerMobile('')
            setAdditionalDiscount(0)
            setPaidAmount(0)
            setPaymentMethod('Cash')

            await loadProducts()
            await loadCustomers()
        } catch (error: any) {
            console.error(
                'Create sale error:',
                error,
            )

            message.error(
                error?.message ||
                'Bill create nahi ho paya',
            )
        } finally {
            setLoading(false)
        }
    }

    /* =========================
       CLEAR BILL
    ========================= */

    const clearBill = () => {
        setCart([])
        setSearch('')
        setCustomerId(undefined)
        setCustomerName('')
        setCustomerMobile('')
        setAdditionalDiscount(0)
        setPaidAmount(0)
        setPaymentMethod('Cash')
    }

    /* =========================
       CUSTOMER SELECT
    ========================= */

    const selectedCustomer =
        customers.find(
            customer =>
                customer.id === customerId,
        )

    /* =========================
       UI
    ========================= */


    return (
        <div className="min-h-full bg-[#f6f8fb] p-3 sm:p-4 lg:p-6">

            {/* HEADER */}
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                <div>
                    <Title
                        level={3}
                        className="!mb-1 !text-[#102A5C]"
                    >
                        Billing
                    </Title>

                    <Text type="secondary">
                        Create and manage your sales bills
                    </Text>
                </div>

                <Button
                    danger
                    size="large"
                    onClick={clearBill}
                    disabled={cart.length === 0}
                >
                    Clear Bill
                </Button>
            </div>

            <Row gutter={[16, 16]}>

                {/* =====================
            PRODUCTS
        ====================== */}

                <Col xs={24} xl={15}>

                    <Card
                        bordered={false}
                        className="rounded-2xl shadow-sm"
                    >

                        <div className="mb-4">

                            <Input
                                size="large"
                                value={search}
                                onChange={e =>
                                    setSearch(
                                        e.target.value,
                                    )
                                }
                                placeholder="Search product by name, SKU or barcode..."
                                prefix={
                                    <SearchOutlined />
                                }
                                allowClear
                            />

                        </div>

                        <div className="mb-4 flex items-center justify-between">

                            <div>
                                <Text strong>
                                    Products
                                </Text>

                                <Text
                                    type="secondary"
                                    className="ml-2 text-xs"
                                >
                                    {products.length} products
                                </Text>
                            </div>

                            <Button
                                size="small"
                                onClick={loadProducts}
                                loading={
                                    productsLoading
                                }
                            >
                                Refresh
                            </Button>

                        </div>

                        {filteredProducts.length === 0 ? (
                            <Empty
                                description={
                                    productsLoading
                                        ? 'Loading products...'
                                        : 'No product found'
                                }
                            />
                        ) : (
                            <Row gutter={[12, 12]}>

                                {filteredProducts.map(
                                    product => (
                                        <Col
                                            xs={24}
                                            sm={12}
                                            lg={8}
                                            key={product.id}
                                        >

                                            <Card
                                                hoverable
                                                size="small"
                                                className="h-full rounded-xl transition-all hover:-translate-y-0.5"
                                                onClick={() =>
                                                    addToCart(product)
                                                }
                                            >

                                                <div className="mb-2 flex items-start justify-between gap-2">

                                                    <div className="min-w-0">

                                                        <Text
                                                            strong
                                                            className="block"
                                                        >
                                                            {product.name}
                                                        </Text>

                                                        <Text
                                                            type="secondary"
                                                            className="text-xs"
                                                        >
                                                            SKU: {product.sku}
                                                        </Text>

                                                    </div>

                                                    <Tag
                                                        color={
                                                            product.currentQuantity > (product.minimumStockLevel ?? 0)
                                                                ? 'green'
                                                                : product.currentQuantity > 0
                                                                    ? 'orange'
                                                                    : 'red'
                                                        }
                                                    >
                                                        {product.currentQuantity}
                                                    </Tag>

                                                </div>

                                                <div className="mb-3">
                                                    <Text
                                                        type="secondary"
                                                        className="text-xs"
                                                    >
                                                        {product.category ||
                                                            'General'}
                                                    </Text>
                                                </div>

                                                <div className="flex items-center justify-between">

                                                    <div>
                                                        <Text
                                                            strong
                                                            className="text-base"
                                                        >
                                                            {money(
                                                                product.sellingPrice,
                                                            )}
                                                        </Text>

                                                        <Text
                                                            type="secondary"
                                                            className="ml-1 text-xs"
                                                        >
                                                            + GST{' '}
                                                            {
                                                                product.gstPercentage
                                                            }%
                                                        </Text>
                                                    </div>

                                                    <Button
                                                        type="primary"
                                                        size="small"
                                                        icon={
                                                            <PlusOutlined />
                                                        }
                                                        disabled={
                                                            product.currentQuantity <=
                                                            0
                                                        }
                                                    >
                                                        Add
                                                    </Button>

                                                </div>

                                            </Card>

                                        </Col>
                                    ),
                                )}

                            </Row>
                        )}

                    </Card>
                </Col>

                {/* =====================
            BILL
        ====================== */}

                <Col xs={24} xl={9}>

                    <Card
                        bordered={false}
                        className="rounded-2xl shadow-sm"
                        title={
                            <div className="flex items-center justify-between">

                                <div className="flex items-center gap-2">

                                    <ShoppingCartOutlined className="text-blue-600" />

                                    <Text strong>
                                        Current Bill
                                    </Text>

                                </div>

                                <Tag color="blue">
                                    {totalItems} items
                                </Tag>

                            </div>
                        }
                    >

                        {/* CART */}

                        {cart.length === 0 ? (

                            <div className="py-8">
                                <Empty
                                    image={
                                        <ShoppingCartOutlined className="text-5xl text-gray-300" />
                                    }
                                    description="Your cart is empty"
                                />
                            </div>

                        ) : (

                            <div className="max-h-[380px] overflow-y-auto pr-1">

                                <List
                                    dataSource={cart}
                                    split
                                    renderItem={item => {

                                        const lineTotal =
                                            item.sellingPrice *
                                            item.cartQuantity

                                        return (
                                            <List.Item>

                                                <div className="w-full">

                                                    <div className="flex items-start justify-between gap-2">

                                                        <div className="min-w-0">

                                                            <Text
                                                                strong
                                                                className="block"
                                                            >
                                                                {item.name}
                                                            </Text>

                                                            <Text
                                                                type="secondary"
                                                                className="text-xs"
                                                            >
                                                                {money(
                                                                    item.sellingPrice,
                                                                )}{' '}
                                                                / {item.unit}
                                                            </Text>

                                                        </div>

                                                        <Button
                                                            danger
                                                            type="text"
                                                            size="small"
                                                            icon={
                                                                <DeleteOutlined />
                                                            }
                                                            onClick={() =>
                                                                removeItem(
                                                                    item.id,
                                                                )
                                                            }
                                                        />

                                                    </div>

                                                    <div className="mt-3 flex items-center justify-between gap-2">

                                                        <Space.Compact>

                                                            <Button
                                                                size="small"
                                                                icon={
                                                                    <MinusOutlined />
                                                                }
                                                                onClick={() =>
                                                                    decreaseQuantity(
                                                                        item.id,
                                                                    )
                                                                }
                                                            />

                                                            <Button
                                                                size="small"
                                                            >
                                                                {item.cartQuantity}
                                                            </Button>

                                                            <Button
                                                                size="small"
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

                                                        <Text strong>
                                                            {money(
                                                                lineTotal,
                                                            )}
                                                        </Text>

                                                    </div>

                                                    <div className="mt-2 flex items-center justify-between">

                                                        <Text
                                                            type="secondary"
                                                            className="text-xs"
                                                        >
                                                            Discount
                                                        </Text>

                                                        <InputNumber
                                                            size="small"
                                                            min={0}
                                                            max={100}
                                                            value={
                                                                item.discountPercent
                                                            }
                                                            formatter={value =>
                                                                `${value}%`
                                                            }
                                                            parser={value =>
                                                                Number(
                                                                    String(
                                                                        value,
                                                                    ).replace(
                                                                        '%',
                                                                        '',
                                                                    ),
                                                                ) as 0
                                                            }
                                                            onChange={value =>
                                                                updateItemDiscount(
                                                                    item.id,
                                                                    Number(
                                                                        value || 0,
                                                                    ),
                                                                )
                                                            }
                                                        />

                                                    </div>

                                                </div>

                                            </List.Item>
                                        )
                                    }}
                                />

                            </div>

                        )}

                        <Divider />

                        {/* CUSTOMER */}

                        <div className="mb-4">

                            <div className="mb-2 flex items-center justify-between">

                                <Text strong>
                                    Customer
                                </Text>

                                <Button
                                    type="link"
                                    size="small"
                                    onClick={() =>
                                        setShowCustomerModal(
                                            true,
                                        )
                                    }
                                >
                                    Walk-in Customer
                                </Button>

                            </div>

                            <Select
                                showSearch
                                allowClear
                                loading={
                                    customersLoading
                                }
                                value={customerId}
                                onChange={value =>
                                    setCustomerId(value)
                                }
                                placeholder="Select customer"
                                className="w-full"
                                optionFilterProp="label"
                                options={customers.map(
                                    customer => ({
                                        value:
                                            customer.id,
                                        label:
                                            `${customer.name} - ${customer.mobile}`,
                                    }),
                                )}
                                suffixIcon={
                                    <UserOutlined />
                                }
                            />

                            {selectedCustomer && (
                                <div className="mt-2 rounded-lg bg-blue-50 p-2">

                                    <Text className="block text-xs">
                                        {selectedCustomer.name}
                                    </Text>

                                    <Text
                                        type="secondary"
                                        className="text-xs"
                                    >
                                        {selectedCustomer.mobile}
                                    </Text>

                                </div>
                            )}

                        </div>

                        {/* SUMMARY */}

                        <div className="space-y-2">

                            <div className="flex justify-between">
                                <Text>
                                    Subtotal
                                </Text>

                                <Text>
                                    {money(subtotal)}
                                </Text>
                            </div>

                            <div className="flex justify-between">
                                <Text>
                                    Item Discount
                                </Text>

                                <Text className="text-red-500">
                                    - {money(
                                        itemDiscountTotal,
                                    )}
                                </Text>
                            </div>

                            <div className="flex items-center justify-between">

                                <Text>
                                    Additional Discount
                                </Text>

                                <InputNumber
                                    size="small"
                                    min={0}
                                    max={
                                        afterItemDiscount
                                    }
                                    value={
                                        additionalDiscount
                                    }
                                    prefix="₹"
                                    onChange={value =>
                                        setAdditionalDiscount(
                                            Number(
                                                value || 0,
                                            ),
                                        )
                                    }
                                />

                            </div>

                            <div className="flex justify-between">
                                <Text>
                                    GST
                                </Text>

                                <Text>
                                    {money(gstAmount)}
                                </Text>
                            </div>

                            <Divider className="!my-3" />

                            <div className="flex items-center justify-between">

                                <Text strong>
                                    Grand Total
                                </Text>

                                <Text
                                    strong
                                    className="text-2xl !text-[#102A5C]"
                                >
                                    {money(grandTotal)}
                                </Text>

                            </div>

                        </div>

                        <Divider />

                        {/* PAYMENT */}

                        <div className="mb-4">

                            <Text
                                strong
                                className="mb-2 block"
                            >
                                Payment Method
                            </Text>

                            <Select
                                value={paymentMethod}
                                onChange={
                                    setPaymentMethod
                                }
                                className="w-full"
                                size="large"
                                options={[
                                    {
                                        value: 'Cash',
                                        label: '💵 Cash',
                                    },
                                    {
                                        value: 'UPI',
                                        label: '📱 UPI',
                                    },
                                    {
                                        value: 'Card',
                                        label: '💳 Card',
                                    },
                                    {
                                        value: 'Credit',
                                        label: '🧾 Credit',
                                    },
                                ]}
                                suffixIcon={
                                    <CreditCardOutlined />
                                }
                            />

                        </div>

                        {/* PAID */}

                        <div className="mb-4">

                            <Text
                                strong
                                className="mb-2 block"
                            >
                                Paid Amount
                            </Text>

                            <InputNumber
                                size="large"
                                className="w-full"
                                min={0}
                                max={grandTotal}
                                value={paidAmount}
                                prefix="₹"
                                onChange={value =>
                                    setPaidAmount(
                                        Number(
                                            value || 0,
                                        ),
                                    )
                                }
                            />

                        </div>

                        {/* PENDING */}

                        <div className="mb-4 rounded-xl bg-orange-50 p-4">

                            <div className="flex justify-between">

                                <Text>
                                    Pending Amount
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

                            <div className="mt-1">

                                <Tag
                                    color={
                                        pendingAmount === 0
                                            ? 'green'
                                            : paidAmount > 0
                                                ? 'orange'
                                                : 'red'
                                    }
                                >
                                    {pendingAmount === 0
                                        ? 'Paid'
                                        : paidAmount > 0
                                            ? 'Partial'
                                            : 'Unpaid'}
                                </Tag>

                            </div>

                        </div>

                        {/* COMPLETE */}

                        <Button
                            type="primary"
                            size="large"
                            block
                            loading={loading}
                            disabled={
                                cart.length === 0
                            }
                            icon={
                                <CheckCircleOutlined />
                            }
                            onClick={
                                completeSale
                            }
                        >
                            Complete Sale
                        </Button>

                    </Card>
                </Col>
            </Row>

            {/* =========================
          WALK-IN CUSTOMER MODAL
      ========================= */}

            <Modal
                title="Walk-in Customer"
                open={
                    showCustomerModal
                }
                onCancel={() =>
                    setShowCustomerModal(
                        false,
                    )
                }
                onOk={() => {
                    setCustomerId(undefined)
                    setShowCustomerModal(
                        false,
                    )
                }}
            >

                <div className="space-y-4">

                    <Input
                        placeholder="Customer name"
                        prefix={
                            <UserOutlined />
                        }
                        value={customerName}
                        onChange={e =>
                            setCustomerName(
                                e.target.value,
                            )
                        }
                    />

                    <Input
                        placeholder="Mobile number"
                        value={customerMobile}
                        onChange={e =>
                            setCustomerMobile(
                                e.target.value,
                            )
                        }
                    />

                </div>

            </Modal>

            {/* =========================
          SALE SUCCESS MODAL
      ========================= */}

            <Modal
                centered
                open={!!sale}
                footer={null}
                closable={false}
                width={420}
            >

                <div className="py-5 text-center">

                    <CheckCircleOutlined className="text-6xl text-green-500" />

                    <Title
                        level={3}
                        className="!mb-1 !mt-4"
                    >
                        Sale Completed
                    </Title>

                    <Text type="secondary">
                        Your invoice has been generated
                    </Text>

                    <div className="my-5 rounded-xl bg-gray-50 p-4 text-left">

                        <div className="mb-2 flex justify-between">
                            <Text>
                                Invoice Number
                            </Text>

                            <Text strong>
                                {sale?.invoiceNumber}
                            </Text>
                        </div>

                        <div className="mb-2 flex justify-between">
                            <Text>
                                Grand Total
                            </Text>

                            <Text strong>
                                {money(
                                    sale?.grandTotal ||
                                    0,
                                )}
                            </Text>
                        </div>

                        <div className="mb-2 flex justify-between">
                            <Text>
                                Paid
                            </Text>

                            <Text>
                                {money(
                                    sale?.paidAmount ||
                                    0,
                                )}
                            </Text>
                        </div>

                        <div className="flex justify-between">
                            <Text>
                                Balance
                            </Text>

                            <Text
                                strong
                                className="text-orange-600"
                            >
                                {money(
                                    sale?.pendingAmount ||
                                    0,
                                )}
                            </Text>
                        </div>

                    </div>

                    <Space wrap>

                        <Button
                            onClick={() => {
                                if (sale?.id) {
                                    setSale(null)
                                    navigate(`/invoice/${sale.id}`)
                                }
                            }}
                        >
                            View Invoice
                        </Button>

                        <Button
                            type="primary"
                            onClick={() =>
                                setSale(null)
                            }
                        >
                            New Bill
                        </Button>

                    </Space>

                </div>

            </Modal>

        </div>
    )
}