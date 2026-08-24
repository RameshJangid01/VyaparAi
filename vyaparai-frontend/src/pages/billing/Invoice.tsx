import {
    Button,
    Card,
    Divider,
    Table,
    Typography,
    message,
} from 'antd'

import {
    ArrowLeftOutlined,
    PrinterOutlined,
} from '@ant-design/icons'

import {
    useEffect,
    useState,
} from 'react'

import {
    useNavigate,
    useParams,
} from 'react-router-dom'

const { Title, Text } =
    Typography

const API_URL =
    'https://vyaparai-6032.onrender.com/api'

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

export default function Invoice() {
    const { id } =
        useParams()

    const navigate =
        useNavigate()

    const [invoice, setInvoice] =
        useState<any>(null)

    const [loading, setLoading] =
        useState(true)

    useEffect(() => {
        if (id) {
            loadInvoice()
        }
    }, [id])

    const loadInvoice =
        async () => {
            try {
                setLoading(true)

                const response =
                    await fetch(
                        `${API_URL}/sales/${id}/invoice`,
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${localStorage.getItem(
                                        'vyaparai_token',
                                    ) || ''
                                    }`,
                            },
                        },
                    )

                const result =
                    await response.json()

                if (!response.ok) {
                    throw new Error(
                        result?.message ||
                        'Invoice load failed',
                    )
                }

                setInvoice(
                    result?.data ??
                    result,
                )
            } catch (error: any) {
                console.error(error)

                message.error(
                    error?.message ||
                    'Invoice load nahi hua',
                )
            } finally {
                setLoading(false)
            }
        }

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                Loading invoice...
            </div>
        )
    }

    if (!invoice) {
        return (
            <div className="p-6">
                <Button
                    onClick={() =>
                        navigate('/billing')
                    }
                >
                    Back to Billing
                </Button>

                <div className="mt-6">
                    Invoice not found
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100 p-3 sm:p-6">

            {/* ACTIONS */}

            <div className="mx-auto mb-4 flex max-w-4xl justify-between print:hidden">

                <Button
                    icon={
                        <ArrowLeftOutlined />
                    }
                    onClick={() =>
                        navigate('/billing')
                    }
                >
                    Back
                </Button>

                <Button
                    type="primary"
                    icon={
                        <PrinterOutlined />
                    }
                    onClick={() =>
                        window.print()
                    }
                >
                    Print Invoice
                </Button>

            </div>

            {/* INVOICE */}

            <Card
                id="print-invoice"
                bordered={false}
                className="invoice-paper mx-auto max-w-4xl rounded-none shadow-md"
            >

                {/* BUSINESS HEADER */}

                <div className="flex flex-col justify-between gap-5 sm:flex-row">

                    <div>

                        <Title
                            level={2}
                            className="!mb-1 !text-[#102A5C]"
                        >
                            VyaparAI
                        </Title>

                        <Text type="secondary">
                            Smart Retail Management
                        </Text>

                        {invoice.businessName && (
                            <div className="mt-4">

                                <Text
                                    strong
                                    className="block"
                                >
                                    {invoice.businessName}
                                </Text>

                                {invoice.businessAddress && (
                                    <Text
                                        type="secondary"
                                        className="block"
                                    >
                                        {
                                            invoice.businessAddress
                                        }
                                    </Text>
                                )}

                                {invoice.businessMobile && (
                                    <Text
                                        type="secondary"
                                        className="block"
                                    >
                                        Mobile:{' '}
                                        {
                                            invoice.businessMobile
                                        }
                                    </Text>
                                )}

                                {invoice.businessEmail && (
                                    <Text
                                        type="secondary"
                                        className="block"
                                    >
                                        {
                                            invoice.businessEmail
                                        }
                                    </Text>
                                )}

                                {invoice.businessGstNumber && (
                                    <Text
                                        strong
                                        className="block"
                                    >
                                        GSTIN:{' '}
                                        {
                                            invoice.businessGstNumber
                                        }
                                    </Text>
                                )}

                            </div>
                        )}

                    </div>

                    <div className="sm:text-right">

                        <Title
                            level={2}
                            className="!mb-2"
                        >
                            INVOICE
                        </Title>

                        <Text className="block">
                            Invoice No:{' '}
                            <strong>
                                {
                                    invoice.invoiceNumber
                                }
                            </strong>
                        </Text>

                        <Text className="block">
                            Date:{' '}
                            {invoice.invoiceDate
                                ? new Date(
                                    invoice.invoiceDate,
                                ).toLocaleString(
                                    'en-IN',
                                )
                                : '-'}
                        </Text>

                    </div>

                </div>

                <Divider />

                {/* CUSTOMER */}

                <div className="mb-6 rounded-xl bg-gray-50 p-4">

                    <Text
                        strong
                        className="block"
                    >
                        Bill To
                    </Text>

                    <Text className="block">
                        {invoice.customerName ||
                            'Walk-in Customer'}
                    </Text>

                    {invoice.customerMobile && (
                        <Text
                            type="secondary"
                            className="block"
                        >
                            {invoice.customerMobile}
                        </Text>
                    )}

                    {invoice.customerAddress && (
                        <Text
                            type="secondary"
                            className="block"
                        >
                            {invoice.customerAddress}
                        </Text>
                    )}

                </div>

                {/* ITEMS */}

                <Table
                    rowKey={(record, index) => index ?? 0}
                    pagination={false}
                    scroll={{
                        x: 600,
                    }}
                    dataSource={
                        invoice.items || []
                    }
                    columns={[
                        {
                            title: '#',
                            width: 50,
                            render: (
                                _,
                                __,
                                index,
                            ) =>
                                index + 1,
                        },

                        {
                            title: 'Product',
                            dataIndex:
                                'productName',
                            render: value => (
                                <Text strong>
                                    {value}
                                </Text>
                            ),
                        },

                        {
                            title: 'SKU',
                            dataIndex: 'sku',
                        },

                        {
                            title: 'Qty',
                            dataIndex:
                                'quantity',
                        },

                        {
                            title: 'Rate',
                            dataIndex:
                                'unitPrice',
                            render: value =>
                                money(value),
                        },

                        {
                            title: 'GST',
                            dataIndex:
                                'gstPercent',
                            render: value =>
                                `${value}%`,
                        },

                        {
                            title: 'Total',
                            dataIndex:
                                'totalAmount',
                            render: value => (
                                <Text strong>
                                    {money(value)}
                                </Text>
                            ),
                        },
                    ]}
                />

                <Divider />

                {/* TOTALS */}

                <div className="ml-auto max-w-sm">

                    <div className="mb-2 flex justify-between">
                        <Text>
                            Subtotal
                        </Text>

                        <Text>
                            {money(
                                invoice.subtotal,
                            )}
                        </Text>
                    </div>

                    <div className="mb-2 flex justify-between">
                        <Text>
                            Discount
                        </Text>

                        <Text className="text-red-500">
                            -{' '}
                            {money(
                                invoice.discountTotal,
                            )}
                        </Text>
                    </div>

                    <div className="mb-2 flex justify-between">
                        <Text>
                            GST
                        </Text>

                        <Text>
                            {money(
                                invoice.gstTotal,
                            )}
                        </Text>
                    </div>

                    <Divider className="!my-3" />

                    <div className="mb-3 flex justify-between">

                        <Text strong>
                            Grand Total
                        </Text>

                        <Text
                            strong
                            className="text-xl"
                        >
                            {money(
                                invoice.grandTotal,
                            )}
                        </Text>

                    </div>

                    <div className="mb-2 flex justify-between">
                        <Text>
                            Paid
                        </Text>

                        <Text>
                            {money(
                                invoice.paidAmount,
                            )}
                        </Text>
                    </div>

                    <div className="flex justify-between">

                        <Text strong>
                            Balance
                        </Text>

                        <Text
                            strong
                            className="text-orange-600"
                        >
                            {money(
                                invoice.balanceAmount,
                            )}
                        </Text>

                    </div>

                </div>

                <Divider />

                {/* PAYMENT */}

                <div className="flex flex-col justify-between gap-3 sm:flex-row">

                    <div>

                        <Text
                            type="secondary"
                            className="block"
                        >
                            Payment Method
                        </Text>

                        <Text strong>
                            {
                                invoice.paymentMethod
                            }
                        </Text>

                    </div>

                    <div>

                        <Text
                            type="secondary"
                            className="block"
                        >
                            Payment Status
                        </Text>

                        <Text strong>
                            {
                                invoice.paymentStatus
                            }
                        </Text>

                    </div>

                </div>

                <Divider />

                <div className="text-center">

                    <Text type="secondary">
                        Thank you for your business!
                    </Text>

                    <br />

                    <Text
                        type="secondary"
                        className="text-xs"
                    >
                        Powered by VyaparAI
                    </Text>

                </div>

            </Card>

        </div>
    )
}