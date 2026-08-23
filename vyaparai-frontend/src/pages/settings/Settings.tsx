import { useEffect, useState } from 'react'
import {
    Alert,
    Avatar,
    Button,
    Card,
    Col,
    Divider,
    Form,
    Input,
    Row,
    Select,
    Skeleton,
    Space,
    Tabs,
    Tag,
    Typography,
    message,
} from 'antd'
import {
    BankOutlined,
    LockOutlined,
    MailOutlined,
    PhoneOutlined,
    SaveOutlined,
    SafetyOutlined,
    ShopOutlined,
    UserOutlined,
} from '@ant-design/icons'
import { useAuth } from '../../context/AuthContext'

const { Title, Text } = Typography

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

interface BusinessProfile {
    id: string
    businessName: string
    ownerName: string
    email: string
    mobileNumber: string
    address?: string
    gstNumber?: string
    currency: string
}

interface UserProfile {
    id: string
    ownerName: string
    email: string
    mobileNumber: string
    role: string
}

interface ApiResponse<T> {
    success: boolean
    message: string
    data: T
    errors?: unknown
}

export default function Settings() {
    const { user } = useAuth()

    const [businessForm] = Form.useForm()
    const [profileForm] = Form.useForm()
    const [passwordForm] = Form.useForm()

    const [businessLoading, setBusinessLoading] = useState(true)
    const [profileLoading, setProfileLoading] = useState(true)

    const [businessSaving, setBusinessSaving] = useState(false)
    const [profileSaving, setProfileSaving] = useState(false)
    const [passwordSaving, setPasswordSaving] = useState(false)

    const [business, setBusiness] = useState<BusinessProfile | null>(null)
    const [profile, setProfile] = useState<UserProfile | null>(null)

    const getToken = () => {
        return localStorage.getItem('vyaparai_token') ?? ''
    }

    const getHeaders = () => ({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
    })

    // -----------------------------
    // Load Business Profile
    // -----------------------------
    const loadBusinessProfile = async () => {
        try {
            setBusinessLoading(true)

            const response = await fetch(
                `${API_BASE_URL}/settings/business`,
                {
                    method: 'GET',
                    headers: getHeaders(),
                },
            )

            const result: ApiResponse<BusinessProfile> =
                await response.json()

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || 'Unable to load business profile',
                )
            }

            setBusiness(result.data)

            businessForm.setFieldsValue({
                businessName: result.data.businessName,
                ownerName: result.data.ownerName,
                mobileNumber: result.data.mobileNumber,
                email: result.data.email,
                address: result.data.address,
                gstNumber: result.data.gstNumber,
                currency: result.data.currency || 'INR',
            })
        } catch (error) {
            console.error('Business profile error:', error)
            message.error(
                error instanceof Error
                    ? error.message
                    : 'Failed to load business profile',
            )
        } finally {
            setBusinessLoading(false)
        }
    }

    // -----------------------------
    // Load User Profile
    // -----------------------------
    const loadUserProfile = async () => {
        try {
            setProfileLoading(true)

            const response = await fetch(
                `${API_BASE_URL}/settings/profile`,
                {
                    method: 'GET',
                    headers: getHeaders(),
                },
            )

            const result: ApiResponse<UserProfile> =
                await response.json()

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || 'Unable to load user profile',
                )
            }

            setProfile(result.data)

            profileForm.setFieldsValue({
                ownerName: result.data.ownerName,
                email: result.data.email,
                mobileNumber: result.data.mobileNumber,
                role: result.data.role,
            })
        } catch (error) {
            console.error('User profile error:', error)
            message.error(
                error instanceof Error
                    ? error.message
                    : 'Failed to load user profile',
            )
        } finally {
            setProfileLoading(false)
        }
    }

    useEffect(() => {
        loadBusinessProfile()
        loadUserProfile()
    }, [])

    // -----------------------------
    // Update Business
    // -----------------------------
    const handleBusinessUpdate = async (
        values: Omit<BusinessProfile, 'id' | 'email'>,
    ) => {
        try {
            setBusinessSaving(true)

            const response = await fetch(
                `${API_BASE_URL}/settings/business`,
                {
                    method: 'PUT',
                    headers: getHeaders(),
                    body: JSON.stringify({
                        businessName: values.businessName,
                        ownerName: values.ownerName,
                        mobileNumber: values.mobileNumber,
                        address: values.address || null,
                        gstNumber: values.gstNumber || null,
                        currency: values.currency,
                    }),
                },
            )

            const result: ApiResponse<BusinessProfile> =
                await response.json()

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || 'Business update failed',
                )
            }

            setBusiness(result.data)

            businessForm.setFieldsValue({
                businessName: result.data.businessName,
                ownerName: result.data.ownerName,
                mobileNumber: result.data.mobileNumber,
                email: result.data.email,
                address: result.data.address,
                gstNumber: result.data.gstNumber,
                currency: result.data.currency,
            })

            message.success('Business profile updated successfully')
        } catch (error) {
            console.error('Business update error:', error)
            message.error(
                error instanceof Error
                    ? error.message
                    : 'Failed to update business profile',
            )
        } finally {
            setBusinessSaving(false)
        }
    }

    // -----------------------------
    // Update User Profile
    // -----------------------------
    const handleProfileUpdate = async (
        values: {
            ownerName: string
            mobileNumber: string
        },
    ) => {
        try {
            setProfileSaving(true)

            const response = await fetch(
                `${API_BASE_URL}/settings/profile`,
                {
                    method: 'PUT',
                    headers: getHeaders(),
                    body: JSON.stringify({
                        ownerName: values.ownerName,
                        mobileNumber: values.mobileNumber,
                    }),
                },
            )

            const result: ApiResponse<UserProfile> =
                await response.json()

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || 'Profile update failed',
                )
            }

            setProfile(result.data)

            message.success('Profile updated successfully')
        } catch (error) {
            console.error('Profile update error:', error)
            message.error(
                error instanceof Error
                    ? error.message
                    : 'Failed to update profile',
            )
        } finally {
            setProfileSaving(false)
        }
    }

    // -----------------------------
    // Change Password
    // -----------------------------
    const handlePasswordChange = async (values: {
        currentPassword: string
        newPassword: string
        confirmPassword: string
    }) => {
        try {
            setPasswordSaving(true)

            const response = await fetch(
                `${API_BASE_URL}/settings/change-password`,
                {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify({
                        currentPassword: values.currentPassword,
                        newPassword: values.newPassword,
                    }),
                },
            )

            const result: ApiResponse<string> =
                await response.json()

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || 'Password change failed',
                )
            }

            message.success('Password changed successfully')

            passwordForm.resetFields()
        } catch (error) {
            console.error('Password change error:', error)
            message.error(
                error instanceof Error
                    ? error.message
                    : 'Failed to change password',
            )
        } finally {
            setPasswordSaving(false)
        }
    }

    return (
        <div className="min-h-full bg-gray-50 p-3 sm:p-5 lg:p-6">
            {/* Header */}
            <div className="mb-5">
                <Title
                    level={2}
                    className="!mb-1 !text-brand-navy"
                >
                    Settings
                </Title>

                <Text type="secondary">
                    Manage your business, profile and account security.
                </Text>
            </div>

            {/* Profile Header */}
            <Card className="mb-5 rounded-2xl border-0 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <Avatar
                            size={64}
                            icon={<UserOutlined />}
                            className="bg-blue-100 !text-blue-600"
                        >
                            {(
                                profile?.ownerName ||
                                user?.ownerName ||
                                'U'
                            )
                                .charAt(0)
                                .toUpperCase()}
                        </Avatar>

                        <div>
                            <Title level={4} className="!mb-0">
                                {profile?.ownerName ||
                                    user?.ownerName ||
                                    'User'}
                            </Title>

                            <Text type="secondary">
                                {profile?.email || user?.email || ''}
                            </Text>

                            <div className="mt-1">
                                <Tag color="blue">
                                    {profile?.role || 'Owner'}
                                </Tag>
                            </div>
                        </div>
                    </div>

                    <Tag
                        icon={<SafetyOutlined />}
                        color="success"
                        className="w-fit px-3 py-1"
                    >
                        Account Protected
                    </Tag>
                </div>
            </Card>

            <Tabs
                defaultActiveKey="business"
                items={[
                    {
                        key: 'business',
                        label: (
                            <span>
                                <ShopOutlined />
                                Business Profile
                            </span>
                        ),
                        children: (
                            <Card className="rounded-2xl border-0 shadow-sm">
                                {businessLoading ? (
                                    <Skeleton active paragraph={{ rows: 8 }} />
                                ) : (
                                    <>
                                        <div className="mb-5">
                                            <Title level={4} className="!mb-1">
                                                Business Information
                                            </Title>

                                            <Text type="secondary">
                                                Update the information shown on your
                                                invoices and business records.
                                            </Text>
                                        </div>

                                        <Alert
                                            className="mb-5"
                                            type="info"
                                            showIcon
                                            message="Business details"
                                            description="Keep your GST number, contact information and address updated for accurate billing."
                                        />

                                        <Form
                                            form={businessForm}
                                            layout="vertical"
                                            onFinish={handleBusinessUpdate}
                                        >
                                            <Row gutter={[16, 0]}>
                                                <Col xs={24} md={12}>
                                                    <Form.Item
                                                        label="Business Name"
                                                        name="businessName"
                                                        rules={[
                                                            {
                                                                required: true,
                                                                message:
                                                                    'Please enter business name',
                                                            },
                                                        ]}
                                                    >
                                                        <Input
                                                            size="large"
                                                            prefix={<ShopOutlined />}
                                                            placeholder="Enter business name"
                                                        />
                                                    </Form.Item>
                                                </Col>

                                                <Col xs={24} md={12}>
                                                    <Form.Item
                                                        label="Owner Name"
                                                        name="ownerName"
                                                        rules={[
                                                            {
                                                                required: true,
                                                                message:
                                                                    'Please enter owner name',
                                                            },
                                                        ]}
                                                    >
                                                        <Input
                                                            size="large"
                                                            prefix={<UserOutlined />}
                                                            placeholder="Enter owner name"
                                                        />
                                                    </Form.Item>
                                                </Col>

                                                <Col xs={24} md={12}>
                                                    <Form.Item
                                                        label="Email"
                                                        name="email"
                                                    >
                                                        <Input
                                                            size="large"
                                                            prefix={<MailOutlined />}
                                                            disabled
                                                        />
                                                    </Form.Item>
                                                </Col>

                                                <Col xs={24} md={12}>
                                                    <Form.Item
                                                        label="Mobile Number"
                                                        name="mobileNumber"
                                                        rules={[
                                                            {
                                                                max: 20,
                                                                message:
                                                                    'Maximum 20 characters allowed',
                                                            },
                                                        ]}
                                                    >
                                                        <Input
                                                            size="large"
                                                            prefix={<PhoneOutlined />}
                                                            placeholder="Enter mobile number"
                                                        />
                                                    </Form.Item>
                                                </Col>

                                                <Col xs={24} md={12}>
                                                    <Form.Item
                                                        label="GST Number"
                                                        name="gstNumber"
                                                    >
                                                        <Input
                                                            size="large"
                                                            placeholder="Enter GST number"
                                                            maxLength={20}
                                                        />
                                                    </Form.Item>
                                                </Col>

                                                <Col xs={24} md={12}>
                                                    <Form.Item
                                                        label="Currency"
                                                        name="currency"
                                                    >
                                                        <Select
                                                            size="large"
                                                            options={[
                                                                {
                                                                    value: 'INR',
                                                                    label: '₹ INR - Indian Rupee',
                                                                },
                                                                {
                                                                    value: 'USD',
                                                                    label: '$ USD - US Dollar',
                                                                },
                                                                {
                                                                    value: 'EUR',
                                                                    label: '€ EUR - Euro',
                                                                },
                                                                {
                                                                    value: 'GBP',
                                                                    label: '£ GBP - British Pound',
                                                                },
                                                            ]}
                                                        />
                                                    </Form.Item>
                                                </Col>

                                                <Col xs={24}>
                                                    <Form.Item
                                                        label="Business Address"
                                                        name="address"
                                                    >
                                                        <Input.TextArea
                                                            rows={4}
                                                            placeholder="Enter complete business address"
                                                            maxLength={300}
                                                            showCount
                                                        />
                                                    </Form.Item>
                                                </Col>
                                            </Row>

                                            <Divider />

                                            <div className="flex justify-end">
                                                <Button
                                                    type="primary"
                                                    htmlType="submit"
                                                    size="large"
                                                    loading={businessSaving}
                                                    icon={<SaveOutlined />}
                                                >
                                                    Save Business Changes
                                                </Button>
                                            </div>
                                        </Form>
                                    </>
                                )}
                            </Card>
                        ),
                    },

                    {
                        key: 'profile',
                        label: (
                            <span>
                                <UserOutlined />
                                My Profile
                            </span>
                        ),
                        children: (
                            <Card className="rounded-2xl border-0 shadow-sm">
                                {profileLoading ? (
                                    <Skeleton active paragraph={{ rows: 6 }} />
                                ) : (
                                    <>
                                        <div className="mb-5">
                                            <Title level={4} className="!mb-1">
                                                Personal Information
                                            </Title>

                                            <Text type="secondary">
                                                Manage your personal account information.
                                            </Text>
                                        </div>

                                        <Form
                                            form={profileForm}
                                            layout="vertical"
                                            onFinish={handleProfileUpdate}
                                        >
                                            <Row gutter={[16, 0]}>
                                                <Col xs={24} md={12}>
                                                    <Form.Item
                                                        label="Owner Name"
                                                        name="ownerName"
                                                        rules={[
                                                            {
                                                                required: true,
                                                                message:
                                                                    'Please enter your name',
                                                            },
                                                        ]}
                                                    >
                                                        <Input
                                                            size="large"
                                                            prefix={<UserOutlined />}
                                                        />
                                                    </Form.Item>
                                                </Col>

                                                <Col xs={24} md={12}>
                                                    <Form.Item
                                                        label="Email"
                                                        name="email"
                                                    >
                                                        <Input
                                                            size="large"
                                                            prefix={<MailOutlined />}
                                                            disabled
                                                        />
                                                    </Form.Item>
                                                </Col>

                                                <Col xs={24} md={12}>
                                                    <Form.Item
                                                        label="Mobile Number"
                                                        name="mobileNumber"
                                                    >
                                                        <Input
                                                            size="large"
                                                            prefix={<PhoneOutlined />}
                                                            maxLength={20}
                                                        />
                                                    </Form.Item>
                                                </Col>

                                                <Col xs={24} md={12}>
                                                    <Form.Item
                                                        label="Role"
                                                        name="role"
                                                    >
                                                        <Input
                                                            size="large"
                                                            disabled
                                                        />
                                                    </Form.Item>
                                                </Col>
                                            </Row>

                                            <Divider />

                                            <div className="flex justify-end">
                                                <Button
                                                    type="primary"
                                                    htmlType="submit"
                                                    size="large"
                                                    loading={profileSaving}
                                                    icon={<SaveOutlined />}
                                                >
                                                    Save Profile
                                                </Button>
                                            </div>
                                        </Form>
                                    </>
                                )}
                            </Card>
                        ),
                    },

                    {
                        key: 'security',
                        label: (
                            <span>
                                <LockOutlined />
                                Security
                            </span>
                        ),
                        children: (
                            <Card className="rounded-2xl border-0 shadow-sm">
                                <div className="mb-5">
                                    <Title level={4} className="!mb-1">
                                        Change Password
                                    </Title>

                                    <Text type="secondary">
                                        Update your account password regularly to
                                        keep your account secure.
                                    </Text>
                                </div>

                                <Alert
                                    className="mb-5"
                                    type="warning"
                                    showIcon
                                    message="Password security"
                                    description="Use at least 6 characters. Never share your password with anyone."
                                />

                                <Form
                                    form={passwordForm}
                                    layout="vertical"
                                    onFinish={handlePasswordChange}
                                    className="max-w-2xl"
                                >
                                    <Form.Item
                                        label="Current Password"
                                        name="currentPassword"
                                        rules={[
                                            {
                                                required: true,
                                                message:
                                                    'Please enter current password',
                                            },
                                        ]}
                                    >
                                        <Input.Password
                                            size="large"
                                            prefix={<LockOutlined />}
                                            placeholder="Enter current password"
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        label="New Password"
                                        name="newPassword"
                                        rules={[
                                            {
                                                required: true,
                                                message:
                                                    'Please enter new password',
                                            },
                                            {
                                                min: 6,
                                                message:
                                                    'Password must be at least 6 characters',
                                            },
                                        ]}
                                    >
                                        <Input.Password
                                            size="large"
                                            prefix={<LockOutlined />}
                                            placeholder="Enter new password"
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        label="Confirm New Password"
                                        name="confirmPassword"
                                        dependencies={['newPassword']}
                                        rules={[
                                            {
                                                required: true,
                                                message:
                                                    'Please confirm new password',
                                            },
                                            ({ getFieldValue }) => ({
                                                validator(_, value) {
                                                    if (
                                                        !value ||
                                                        getFieldValue(
                                                            'newPassword',
                                                        ) === value
                                                    ) {
                                                        return Promise.resolve()
                                                    }

                                                    return Promise.reject(
                                                        new Error(
                                                            'Passwords do not match',
                                                        ),
                                                    )
                                                },
                                            }),
                                        ]}
                                    >
                                        <Input.Password
                                            size="large"
                                            prefix={<LockOutlined />}
                                            placeholder="Confirm new password"
                                        />
                                    </Form.Item>

                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        size="large"
                                        loading={passwordSaving}
                                        icon={<LockOutlined />}
                                    >
                                        Change Password
                                    </Button>
                                </Form>
                            </Card>
                        ),
                    },
                ]}
            />
        </div>
    )
}