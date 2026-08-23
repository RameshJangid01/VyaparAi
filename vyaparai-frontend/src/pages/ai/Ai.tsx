import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
    Alert,
    Avatar,
    Badge,
    Button,
    Card,
    Col,
    Divider,
    Empty,
    Input,
    Progress,
    Row,
    Skeleton,
    Space,
    Statistic,
    Table,
    Tag,
    Typography,
    message,
} from 'antd'

import {
    BulbOutlined,
    CalendarOutlined,
    CheckCircleOutlined,
    DollarOutlined,
    FireOutlined,
    InboxOutlined,
    LineChartOutlined,
    MessageOutlined,
    RobotOutlined,
    SendOutlined,
    ShoppingCartOutlined,
    ThunderboltOutlined,
    WarningOutlined,
    ReloadOutlined,
    DeleteOutlined,
} from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// --------------------------------------------------
// Types
// --------------------------------------------------

interface PurchasePlanItem {
    productId: string
    productName: string
    category: string
    supplierId?: string
    supplierName?: string
    currentStock: number
    suggestedQuantity: number
    unitPurchasePrice: number
    totalCost: number
    reason: string
    confidencePercent: number
    productLink?: string
}

interface AiChatResponse {
    response: string
    language: string
    recommendedPurchasePlan?: PurchasePlanItem[]
    estimatedPurchaseCost?: number
    remainingBudget?: number
    suggestedFollowUps?: string[]
}

interface AiInsight {
    id: string
    title: string
    description: string
    category: string
    severity: string
    actionText?: string
    actionLink?: string
    createdAt: string
}

interface ProductForecast {
    productId: string
    productName: string
    category: string
    currentStock: number
    averageDailySales: number
    forecastedDemandNext15Days: number
    forecastedDemandNext30Days: number
    recommendedReorderQuantity: number
    estimatedCost: number
    festivalMultiplier: number
    urgency: string
}

interface ForecastResponse {
    upcomingFestival: string
    daysToFestival: number
    forecasts: ProductForecast[]
}

interface PurchasePlanResponse {
    budgetAllocated: number
    totalEstimatedCost: number
    budgetRemaining: number
    totalItemsCount: number
    items: PurchasePlanItem[]
    summary: string
}

interface ApiResponse<T> {
    success: boolean
    message: string
    data: T
    errors?: unknown
}

// --------------------------------------------------
// Helpers
// --------------------------------------------------

const getToken = () =>
    localStorage.getItem('vyaparai_token') || ''

const getHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
})

// Chat history is scoped per business so switching accounts on the same
// browser never shows one shop owner another owner's conversation.
const getChatHistoryKey = (businessId?: string) =>
    `vyaparai_chat_history_${businessId || 'guest'}`

const formatCurrency = (value: number = 0) =>
    `₹${value.toLocaleString('en-IN', {
        maximumFractionDigits: 2,
    })}`

// Renders **bold** segments inside a single line of text as real <strong> tags.
const renderInlineBold = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i}>{part.slice(2, -2)}</strong>
        }
        return <span key={i}>{part}</span>
    })
}

// Turns the AI's lightweight markdown (bold + "* " / "- " bullet lines) into
// real JSX instead of showing raw ** and * characters in the chat bubble.
const formatAiMessage = (text: string) => {
    const lines = text.split('\n')
    const elements: JSX.Element[] = []
    let currentList: string[] = []

    const flushList = () => {
        if (currentList.length > 0) {
            elements.push(
                <ul
                    key={`ul-${elements.length}`}
                    className="my-1 list-disc space-y-1 pl-5"
                >
                    {currentList.map((item, i) => (
                        <li key={i}>{renderInlineBold(item)}</li>
                    ))}
                </ul>,
            )
            currentList = []
        }
    }

    lines.forEach((rawLine, idx) => {
        const trimmed = rawLine.trim()

        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
            currentList.push(trimmed.slice(2))
            return
        }

        flushList()

        if (trimmed === '') {
            elements.push(<div key={`sp-${idx}`} className="h-2" />)
        } else {
            elements.push(
                <p key={`p-${idx}`} className="mb-1 last:mb-0">
                    {renderInlineBold(trimmed)}
                </p>,
            )
        }
    })

    flushList()

    return elements
}

// --------------------------------------------------
// Component
// --------------------------------------------------

export default function Ai() {
    const { user } = useAuth()
    const chatHistoryKey = getChatHistoryKey(user?.businessId)

    const [chatInput, setChatInput] = useState('')
    const [chatLoading, setChatLoading] = useState(false)

    const [messages, setMessages] = useState<
        {
            role: 'user' | 'ai'
            text: string
            data?: AiChatResponse
        }[]
    >([])

    const [insights, setInsights] = useState<AiInsight[]>([])
    const [insightsLoading, setInsightsLoading] =
        useState(true)

    const [forecast, setForecast] =
        useState<ForecastResponse | null>(null)

    const [forecastLoading, setForecastLoading] =
        useState(true)

    const [budget, setBudget] = useState('')
    const [festivalFocus, setFestivalFocus] = useState('')
    const [planLoading, setPlanLoading] = useState(false)

    const [purchasePlan, setPurchasePlan] =
        useState<PurchasePlanResponse | null>(null)

    // --------------------------------------------------
    // Load Insights
    // --------------------------------------------------

    const loadInsights = async () => {
        try {
            setInsightsLoading(true)

            const response = await fetch(
                `${API_BASE_URL}/ai/insights`,
                {
                    headers: getHeaders(),
                },
            )

            const result: ApiResponse<AiInsight[]> =
                await response.json()

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || 'Failed to load AI insights',
                )
            }

            setInsights(result.data || [])
        } catch (error) {
            console.error('Insights error:', error)

            message.error(
                error instanceof Error
                    ? error.message
                    : 'Failed to load AI insights',
            )
        } finally {
            setInsightsLoading(false)
        }
    }

    // --------------------------------------------------
    // Load Forecast
    // --------------------------------------------------

    const loadForecast = async () => {
        try {
            setForecastLoading(true)

            const response = await fetch(
                `${API_BASE_URL}/ai/forecast`,
                {
                    headers: getHeaders(),
                },
            )

            const result: ApiResponse<ForecastResponse> =
                await response.json()

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || 'Failed to load forecast',
                )
            }

            setForecast(result.data)
        } catch (error) {
            console.error('Forecast error:', error)

            message.error(
                error instanceof Error
                    ? error.message
                    : 'Failed to load demand forecast',
            )
        } finally {
            setForecastLoading(false)
        }
    }

    // --------------------------------------------------
    // Initial Load
    // --------------------------------------------------

    useEffect(() => {
        loadInsights()
        loadForecast()

        // Restore previous conversation if one exists for this business,
        // so navigating away and coming back (or refreshing) doesn't lose it.
        const saved = localStorage.getItem(chatHistoryKey)
        let restored = false

        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setMessages(parsed)
                    restored = true
                }
            } catch (error) {
                console.error('Failed to parse saved chat history:', error)
            }
        }

        if (!restored) {
            setMessages([
                {
                    role: 'ai',
                    text:
                        "Namaste! 👋 Main VyaparAI hoon — aapka intelligent retail business copilot.\n\nAap mujhse sales, profit, stock, festivals aur purchase planning ke baare mein kuch bhi pooch sakte hain.",
                },
            ])
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Persist the conversation to localStorage every time it changes, so
    // it survives navigating to another page or refreshing the browser.
    useEffect(() => {
        if (messages.length === 0) return

        try {
            localStorage.setItem(
                chatHistoryKey,
                JSON.stringify(messages),
            )
        } catch (error) {
            console.error('Failed to save chat history:', error)
        }
    }, [messages, chatHistoryKey])

    // --------------------------------------------------
    // Ask AI
    // --------------------------------------------------

    const askAi = async (question?: string) => {
        const text = (question ?? chatInput).trim()

        if (!text) {
            message.warning('Please enter a question.')
            return
        }

        setChatInput('')

        setMessages((prev) => [
            ...prev,
            {
                role: 'user',
                text,
            },
        ])

        try {
            setChatLoading(true)

            const response = await fetch(
                `${API_BASE_URL}/ai/ask`,
                {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify({
                        message: text,
                    }),
                },
            )

            const result: ApiResponse<AiChatResponse> =
                await response.json()

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || 'AI request failed',
                )
            }

            const aiData = result.data

            setMessages((prev) => [
                ...prev,
                {
                    role: 'ai',
                    text: aiData.response,
                    data: aiData,
                },
            ])
        } catch (error) {
            console.error('AI chat error:', error)

            setMessages((prev) => [
                ...prev,
                {
                    role: 'ai',
                    text:
                        'Sorry, AI response nahi aa paaya. Please try again.',
                },
            ])

            message.error(
                error instanceof Error
                    ? error.message
                    : 'AI request failed',
            )
        } finally {
            setChatLoading(false)
        }
    }

    // --------------------------------------------------
    // Purchase Plan
    // --------------------------------------------------

    const generatePurchasePlan = async () => {
        const amount = Number(budget)

        if (!amount || amount < 100) {
            message.warning(
                'Budget must be at least ₹100.',
            )
            return
        }

        try {
            setPlanLoading(true)

            const response = await fetch(
                `${API_BASE_URL}/ai/purchase-plan`,
                {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify({
                        budget: amount,
                        festivalFocus:
                            festivalFocus.trim() || null,
                        planHorizonDays: 30,
                    }),
                },
            )

            const result: ApiResponse<PurchasePlanResponse> =
                await response.json()

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message ||
                    'Failed to generate purchase plan',
                )
            }

            setPurchasePlan(result.data)

            message.success(
                'AI purchase plan generated successfully.',
            )
        } catch (error) {
            console.error('Purchase plan error:', error)

            message.error(
                error instanceof Error
                    ? error.message
                    : 'Failed to generate purchase plan',
            )
        } finally {
            setPlanLoading(false)
        }
    }

    // --------------------------------------------------
    // Refresh
    // --------------------------------------------------

    const refreshAiData = async () => {
        await Promise.all([
            loadInsights(),
            loadForecast(),
        ])

        message.success('AI data refreshed.')
    }

    // --------------------------------------------------
    // Clear Chat
    // --------------------------------------------------

    const clearChatHistory = () => {
        localStorage.removeItem(chatHistoryKey)
        setMessages([
            {
                role: 'ai',
                text:
                    "Namaste! 👋 Main VyaparAI hoon — aapka intelligent retail business copilot.\n\nAap mujhse sales, profit, stock, festivals aur purchase planning ke baare mein kuch bhi pooch sakte hain.",
            },
        ])
        message.success('Chat history cleared.')
    }

    // --------------------------------------------------
    // Quick Questions
    // --------------------------------------------------

    const quickQuestions = [
        'Aaj ki sale kitni hui?',
        'Low stock products dikhao',
        'Sabse jyada kya bik raha hai?',
        'Mera profit kitna hai?',
        'Mere paas ₹30,000 hain, kya purchase karu?',
        'Upcoming festival ke liye kya stock karu?',
    ]

    // --------------------------------------------------
    // Insight helpers
    // --------------------------------------------------

    const getInsightIcon = (severity: string) => {
        if (severity === 'warning') {
            return <WarningOutlined />
        }

        if (severity === 'success') {
            return <CheckCircleOutlined />
        }

        return <BulbOutlined />
    }

    const getInsightColor = (severity: string) => {
        if (severity === 'warning') return 'warning'
        if (severity === 'success') return 'success'
        return 'processing'
    }

    // --------------------------------------------------
    // Forecast columns
    // --------------------------------------------------

    const forecastColumns = [
        {
            title: 'Product',
            key: 'product',
            render: (_: unknown, record: ProductForecast) => (
                <div>
                    <Text strong>{record.productName}</Text>
                    <br />
                    <Text type="secondary" className="text-xs">
                        {record.category}
                    </Text>
                </div>
            ),
        },

        {
            title: 'Current Stock',
            dataIndex: 'currentStock',
            key: 'currentStock',
            render: (value: number) => (
                <Tag
                    color={value <= 0 ? 'red' : value < 10 ? 'orange' : 'blue'}
                >
                    {value}
                </Tag>
            ),
        },

        {
            title: 'Daily Sales',
            dataIndex: 'averageDailySales',
            key: 'averageDailySales',
        },

        {
            title: '15 Days Demand',
            dataIndex: 'forecastedDemandNext15Days',
            key: 'forecastedDemandNext15Days',
        },

        {
            title: '30 Days Demand',
            dataIndex: 'forecastedDemandNext30Days',
            key: 'forecastedDemandNext30Days',
        },

        {
            title: 'Reorder',
            dataIndex: 'recommendedReorderQuantity',
            key: 'recommendedReorderQuantity',
            render: (value: number) => (
                <Text strong className="!text-blue-600">
                    {value}
                </Text>
            ),
        },

        {
            title: 'Urgency',
            dataIndex: 'urgency',
            key: 'urgency',
            render: (value: string) => {
                const color =
                    value === 'High'
                        ? 'red'
                        : value === 'Medium'
                            ? 'orange'
                            : 'green'

                return <Tag color={color}>{value}</Tag>
            },
        },
    ]

    // --------------------------------------------------
    // Purchase Plan Columns
    // --------------------------------------------------

    const purchaseColumns = [
        {
            title: 'Product',
            key: 'product',
            render: (_: unknown, record: PurchasePlanItem) => (
                <div>
                    {record.productLink ? (
                        <Button
                            type="link"
                            className="!h-auto !p-0 !font-semibold"
                            onClick={() => {
                                window.location.href =
                                    record.productLink as string
                            }}
                        >
                            {record.productName}
                        </Button>
                    ) : (
                        <Text strong>{record.productName}</Text>
                    )}
                    <br />
                    <Text type="secondary">
                        {record.category}
                    </Text>
                </div>
            ),
        },

        {
            title: 'Current Stock',
            dataIndex: 'currentStock',
            key: 'currentStock',
        },

        {
            title: 'Suggested Qty',
            dataIndex: 'suggestedQuantity',
            key: 'suggestedQuantity',
            render: (value: number) => (
                <Tag color="blue">{value}</Tag>
            ),
        },

        {
            title: 'Purchase Price',
            dataIndex: 'unitPurchasePrice',
            key: 'unitPurchasePrice',
            render: (value: number) =>
                formatCurrency(value),
        },

        {
            title: 'Total Cost',
            dataIndex: 'totalCost',
            key: 'totalCost',
            render: (value: number) => (
                <Text strong>{formatCurrency(value)}</Text>
            ),
        },

        {
            title: 'Confidence',
            dataIndex: 'confidencePercent',
            key: 'confidencePercent',
            width: 160,
            render: (value: number) => (
                <Progress
                    percent={value}
                    size="small"
                    format={(percent) => `${percent}%`}
                />
            ),
        },

        {
            title: 'Reason',
            dataIndex: 'reason',
            key: 'reason',
            render: (value: string) => (
                <Text type="secondary">{value}</Text>
            ),
        },
    ]

    return (
        <div className="min-h-full bg-gray-50 p-3 sm:p-5 lg:p-6">

            {/* =====================================================
          HEADER
      ====================================================== */}

            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <Avatar
                            size={52}
                            icon={<RobotOutlined />}
                            className="bg-blue-100 !text-blue-600"
                        />

                        <div>
                            <Title
                                level={2}
                                className="!mb-0 !text-brand-navy"
                            >
                                VyaparAI
                            </Title>

                            <Text type="secondary">
                                Your intelligent retail business copilot
                            </Text>
                        </div>
                    </div>
                </div>

                <Space>
                    <Button
                        size="large"
                        icon={<DeleteOutlined />}
                        onClick={clearChatHistory}
                    >
                        Clear Chat
                    </Button>

                    <Button
                        size="large"
                        icon={<ReloadOutlined />}
                        onClick={refreshAiData}
                    >
                        Refresh AI
                    </Button>
                </Space>
            </div>

            {/* =====================================================
          AI CHAT
      ====================================================== */}

            <Card
                className="mb-6 overflow-hidden rounded-2xl border-0 shadow-sm"
                styles={{
                    body: {
                        padding: 0,
                    },
                }}
            >
                {/* Chat header */}
                <div className="border-b border-gray-100 bg-white p-4 sm:p-5">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-blue-50 p-3">
                            <MessageOutlined className="text-xl text-blue-600" />
                        </div>

                        <div>
                            <Text strong className="text-base">
                                Ask VyaparAI
                            </Text>

                            <div>
                                <Text type="secondary" className="text-xs">
                                    Ask anything about your business
                                </Text>
                            </div>
                        </div>

                        <Badge
                            status="success"
                            text="AI Online"
                            className="ml-auto"
                        />
                    </div>
                </div>

                {/* Messages */}
                <div className="max-h-[520px] min-h-[300px] overflow-y-auto bg-gray-50 p-4 sm:p-6">
                    {messages.map((item, index) => (
                        <div
                            key={index}
                            className={`mb-5 flex ${item.role === 'user'
                                ? 'justify-end'
                                : 'justify-start'
                                }`}
                        >
                            {item.role === 'ai' && (
                                <Avatar
                                    size={38}
                                    icon={<RobotOutlined />}
                                    className="mr-2 shrink-0 bg-blue-100 !text-blue-600"
                                />
                            )}

                            <div
                                className={`max-w-[90%] rounded-2xl px-4 py-3 sm:max-w-[75%] ${item.role === 'user'
                                    ? 'whitespace-pre-line rounded-br-sm bg-blue-600 text-white'
                                    : 'rounded-bl-sm bg-white text-gray-700 shadow-sm'
                                    }`}
                            >
                                {item.role === 'ai'
                                    ? formatAiMessage(item.text)
                                    : item.text}

                                {/* AI purchase recommendation */}
                                {item.data?.recommendedPurchasePlan &&
                                    item.data.recommendedPurchasePlan.length >
                                    0 && (
                                        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3">
                                            <Text strong>
                                                🛒 Recommended Purchase Plan
                                            </Text>

                                            <div className="mt-2 space-y-2">
                                                {item.data.recommendedPurchasePlan
                                                    .slice(0, 5)
                                                    .map((product) => (
                                                        <div
                                                            key={product.productId}
                                                            className="flex items-center justify-between rounded-lg bg-white p-2"
                                                        >
                                                            <div>
                                                                {product.productLink ? (
                                                                    <Button
                                                                        type="link"
                                                                        className="!h-auto !p-0 !font-semibold"
                                                                        onClick={() => {
                                                                            window.location.href =
                                                                                product.productLink as string
                                                                        }}
                                                                    >
                                                                        {product.productName}
                                                                    </Button>
                                                                ) : (
                                                                    <Text strong>
                                                                        {product.productName}
                                                                    </Text>
                                                                )}

                                                                <div className="text-xs text-gray-500">
                                                                    Stock: {product.currentStock}
                                                                </div>
                                                            </div>

                                                            <Tag color="blue">
                                                                +{product.suggestedQuantity}
                                                            </Tag>
                                                        </div>
                                                    ))}
                                            </div>

                                            {item.data.estimatedPurchaseCost !=
                                                null && (
                                                    <div className="mt-3 flex justify-between">
                                                        <Text>
                                                            Estimated Cost
                                                        </Text>

                                                        <Text strong>
                                                            {formatCurrency(
                                                                item.data
                                                                    .estimatedPurchaseCost,
                                                            )}
                                                        </Text>
                                                    </div>
                                                )}

                                            {item.data.remainingBudget !=
                                                null && (
                                                    <div className="flex justify-between">
                                                        <Text>
                                                            Remaining Budget
                                                        </Text>

                                                        <Text strong className="!text-green-600">
                                                            {formatCurrency(
                                                                item.data.remainingBudget,
                                                            )}
                                                        </Text>
                                                    </div>
                                                )}
                                        </div>
                                    )}

                                {/* Follow ups */}
                                {item.data?.suggestedFollowUps &&
                                    item.data.suggestedFollowUps.length >
                                    0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {item.data.suggestedFollowUps.map(
                                                (followUp) => (
                                                    <Button
                                                        key={followUp}
                                                        size="small"
                                                        onClick={() =>
                                                            askAi(followUp)
                                                        }
                                                    >
                                                        {followUp}
                                                    </Button>
                                                ),
                                            )}
                                        </div>
                                    )}
                            </div>
                        </div>
                    ))}

                    {chatLoading && (
                        <div className="flex items-center gap-2">
                            <Avatar
                                size={38}
                                icon={<RobotOutlined />}
                                className="bg-blue-100 !text-blue-600"
                            />

                            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                                <Skeleton
                                    active
                                    paragraph={false}
                                    title={{ width: 100 }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Quick questions */}
                <div className="border-t border-gray-100 bg-white p-4">
                    <Text
                        type="secondary"
                        className="mb-2 block text-xs"
                    >
                        Quick questions
                    </Text>

                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {quickQuestions.map((question) => (
                            <Button
                                key={question}
                                size="small"
                                className="shrink-0"
                                onClick={() => askAi(question)}
                            >
                                {question}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Input */}
                <div className="border-t border-gray-100 bg-white p-4 sm:p-5">
                    <div className="flex gap-2">
                        <TextArea
                            value={chatInput}
                            onChange={(e) =>
                                setChatInput(e.target.value)
                            }
                            onPressEnter={(e) => {
                                if (!e.shiftKey) {
                                    e.preventDefault()
                                    askAi()
                                }
                            }}
                            autoSize={{ minRows: 1, maxRows: 4 }}
                            placeholder="Ask VyaparAI... e.g. Aaj ki sale kitni hui?"
                        />

                        <Button
                            type="primary"
                            icon={<SendOutlined />}
                            loading={chatLoading}
                            onClick={() => askAi()}
                            className="h-auto min-h-[40px]"
                        >
                            <span className="hidden sm:inline">
                                Ask
                            </span>
                        </Button>
                    </div>
                </div>
            </Card>

            {/* =====================================================
          AI INSIGHTS
      ====================================================== */}

            <div className="mb-6">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <Title level={3} className="!mb-0">
                            AI Insights
                        </Title>

                        <Text type="secondary">
                            Smart recommendations based on your business
                        </Text>
                    </div>

                    <BulbOutlined className="text-2xl text-yellow-500" />
                </div>

                {insightsLoading ? (
                    <Row gutter={[16, 16]}>
                        {[1, 2, 3].map((item) => (
                            <Col xs={24} md={12} lg={8} key={item}>
                                <Card>
                                    <Skeleton active />
                                </Card>
                            </Col>
                        ))}
                    </Row>
                ) : insights.length === 0 ? (
                    <Card className="rounded-2xl border-0 shadow-sm">
                        <Empty description="No AI insights available right now." />
                    </Card>
                ) : (
                    <Row gutter={[16, 16]}>
                        {insights.map((insight) => (
                            <Col xs={24} md={12} lg={8} key={insight.id}>
                                <Card className="h-full rounded-2xl border-0 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                                    <div className="flex gap-3">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                            {getInsightIcon(
                                                insight.severity,
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="mb-1 flex items-start justify-between gap-2">
                                                <Text strong>
                                                    {insight.title}
                                                </Text>

                                                <Tag
                                                    color={getInsightColor(
                                                        insight.severity,
                                                    )}
                                                >
                                                    {insight.category}
                                                </Tag>
                                            </div>

                                            <Paragraph
                                                type="secondary"
                                                className="!mb-3"
                                            >
                                                {insight.description}
                                            </Paragraph>

                                            {insight.actionText && (
                                                <Button
                                                    type="link"
                                                    className="!px-0"
                                                    onClick={() => {
                                                        if (insight.actionLink) {
                                                            window.location.href =
                                                                insight.actionLink
                                                        }
                                                    }}
                                                >
                                                    {insight.actionText} →
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </div>

            {/* =====================================================
          FESTIVAL + FORECAST SUMMARY
      ====================================================== */}

            <Row gutter={[16, 16]} className="mb-6">
                <Col xs={24} lg={8}>
                    <Card className="h-full rounded-2xl border-0 shadow-sm">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="rounded-xl bg-purple-50 p-3">
                                <CalendarOutlined className="text-xl text-purple-600" />
                            </div>

                            <div>
                                <Text strong>
                                    Upcoming Festival
                                </Text>

                                <div>
                                    <Text type="secondary">
                                        AI demand intelligence
                                    </Text>
                                </div>
                            </div>
                        </div>

                        {forecastLoading ? (
                            <Skeleton active />
                        ) : forecast?.upcomingFestival ? (
                            <>
                                <Title level={3} className="!mb-1">
                                    🎉 {forecast.upcomingFestival}
                                </Title>

                                <Text type="secondary">
                                    {forecast.daysToFestival} days remaining
                                </Text>

                                <Divider />

                                <Alert
                                    type="info"
                                    showIcon
                                    message="Prepare inventory early"
                                    description="AI will consider festival demand while generating your purchase recommendations."
                                />
                            </>
                        ) : (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="No upcoming festival"
                            />
                        )}
                    </Card>
                </Col>

                <Col xs={24} lg={16}>
                    <Card className="h-full rounded-2xl border-0 shadow-sm">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="rounded-xl bg-green-50 p-3">
                                <LineChartOutlined className="text-xl text-green-600" />
                            </div>

                            <div>
                                <Text strong>
                                    Demand Forecast
                                </Text>

                                <div>
                                    <Text type="secondary">
                                        AI-powered inventory prediction
                                    </Text>
                                </div>
                            </div>
                        </div>

                        {forecastLoading ? (
                            <Skeleton active paragraph={{ rows: 4 }} />
                        ) : (
                            <Row gutter={[12, 12]}>
                                <Col xs={12} sm={6}>
                                    <Statistic
                                        title="Products Forecasted"
                                        value={
                                            forecast?.forecasts.length || 0
                                        }
                                        prefix={<InboxOutlined />}
                                    />
                                </Col>

                                <Col xs={12} sm={6}>
                                    <Statistic
                                        title="High Urgency"
                                        value={
                                            forecast?.forecasts.filter(
                                                (x) => x.urgency === 'High',
                                            ).length || 0
                                        }
                                        prefix={<WarningOutlined />}
                                    />
                                </Col>

                                <Col xs={12} sm={6}>
                                    <Statistic
                                        title="Festival Days"
                                        value={
                                            forecast?.daysToFestival || 0
                                        }
                                        prefix={<CalendarOutlined />}
                                    />
                                </Col>

                                <Col xs={12} sm={6}>
                                    <Statistic
                                        title="30D Demand"
                                        value={
                                            forecast?.forecasts.reduce(
                                                (sum, item) =>
                                                    sum +
                                                    item.forecastedDemandNext30Days,
                                                0,
                                            ) || 0
                                        }
                                        prefix={<ThunderboltOutlined />}
                                    />
                                </Col>
                            </Row>
                        )}
                    </Card>
                </Col>
            </Row>

            {/* =====================================================
          FORECAST TABLE
      ====================================================== */}

            <Card className="mb-6 rounded-2xl border-0 shadow-sm">
                <div className="mb-4">
                    <Title level={4} className="!mb-1">
                        Product Demand Forecast
                    </Title>

                    <Text type="secondary">
                        Recommended stock levels based on sales velocity,
                        current stock and festival demand.
                    </Text>
                </div>

                {forecastLoading ? (
                    <Skeleton active />
                ) : (
                    <Table
                        rowKey="productId"
                        columns={forecastColumns}
                        dataSource={forecast?.forecasts || []}
                        scroll={{ x: 900 }}
                        pagination={{
                            pageSize: 8,
                            showSizeChanger: false,
                        }}
                        size="middle"
                    />
                )}
            </Card>

            {/* =====================================================
          PURCHASE PLANNER
      ====================================================== */}

            <Card className="mb-6 rounded-2xl border-0 shadow-sm">
                <div className="mb-5 flex items-start gap-3">
                    <div className="rounded-xl bg-orange-50 p-3">
                        <ShoppingCartOutlined className="text-xl text-orange-600" />
                    </div>

                    <div>
                        <Title level={4} className="!mb-1">
                            AI Purchase Planner
                        </Title>

                        <Text type="secondary">
                            Tell VyaparAI your budget and it will create an
                            optimized purchase plan.
                        </Text>
                    </div>
                </div>

                <Row gutter={[16, 16]} align="bottom">
                    <Col xs={24} md={8}>
                        <Text strong className="mb-2 block">
                            Available Budget
                        </Text>

                        <Input
                            size="large"
                            prefix={<DollarOutlined />}
                            placeholder="e.g. 30000"
                            value={budget}
                            onChange={(e) =>
                                setBudget(e.target.value)
                            }
                            type="number"
                        />
                    </Col>

                    <Col xs={24} md={8}>
                        <Text strong className="mb-2 block">
                            Festival Focus
                        </Text>

                        <Input
                            size="large"
                            prefix={<CalendarOutlined />}
                            placeholder="e.g. Diwali"
                            value={festivalFocus}
                            onChange={(e) =>
                                setFestivalFocus(e.target.value)
                            }
                        />
                    </Col>

                    <Col xs={24} md={8}>
                        <Button
                            type="primary"
                            size="large"
                            block
                            icon={<ThunderboltOutlined />}
                            loading={planLoading}
                            onClick={generatePurchasePlan}
                        >
                            Generate AI Purchase Plan
                        </Button>
                    </Col>
                </Row>

                {purchasePlan && (
                    <>
                        <Divider />

                        <Row gutter={[16, 16]} className="mb-5">
                            <Col xs={12} md={6}>
                                <Card className="rounded-xl bg-blue-50">
                                    <Statistic
                                        title="Budget"
                                        value={purchasePlan.budgetAllocated}
                                        prefix="₹"
                                        precision={0}
                                    />
                                </Card>
                            </Col>

                            <Col xs={12} md={6}>
                                <Card className="rounded-xl bg-green-50">
                                    <Statistic
                                        title="Estimated Cost"
                                        value={
                                            purchasePlan.totalEstimatedCost
                                        }
                                        prefix="₹"
                                        precision={0}
                                    />
                                </Card>
                            </Col>

                            <Col xs={12} md={6}>
                                <Card className="rounded-xl bg-orange-50">
                                    <Statistic
                                        title="Remaining"
                                        value={
                                            purchasePlan.budgetRemaining
                                        }
                                        prefix="₹"
                                        precision={0}
                                    />
                                </Card>
                            </Col>

                            <Col xs={12} md={6}>
                                <Card className="rounded-xl bg-purple-50">
                                    <Statistic
                                        title="Products"
                                        value={
                                            purchasePlan.totalItemsCount
                                        }
                                    />
                                </Card>
                            </Col>
                        </Row>

                        <Alert
                            className="mb-5"
                            type="success"
                            showIcon
                            message="AI Recommendation"
                            description={purchasePlan.summary}
                        />

                        <Table
                            rowKey="productId"
                            columns={purchaseColumns}
                            dataSource={purchasePlan.items}
                            scroll={{ x: 1100 }}
                            pagination={false}
                        />
                    </>
                )}
            </Card>
        </div>
    )
}