import { useState } from 'react'
import { Button, Input, Table, Tag, Typography, Popconfirm, App as AntApp } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, SearchOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { customerApi } from '../../api/customerApi'
import CustomerFormModal from '../../components/common/CustomerFormModal'
import type { Customer } from '../../types/customer'

const { Title, Text } = Typography

export default function CustomersPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)

  const queryClient = useQueryClient()
  const { message } = AntApp.useApp()

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['customers', { search, page, pageSize }],
    queryFn: () => customerApi.list({ search, page, pageSize }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customerApi.remove(id),
    onSuccess: () => {
      message.success('Customer deleted successfully.')
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
    onError: () => message.error('Could not delete this customer. Please try again.'),
  })

  const columns: ColumnsType<Customer> = [
    {
      title: 'Customer',
      dataIndex: 'name',
      render: (_, record) => (
        <div>
          <div className="font-medium text-brand-navy">{record.name}</div>
          <Text type="secondary" className="text-xs">
            {record.mobile}
          </Text>
        </div>
      ),
    },
    { title: 'Email', dataIndex: 'email', responsive: ['md'], render: (v) => v ?? '—' },
    {
      title: 'Total Purchases',
      dataIndex: 'totalPurchases',
      render: (v: number) => `₹${v.toLocaleString('en-IN')}`,
    },
    {
      title: 'Pending',
      dataIndex: 'pendingAmount',
      render: (v: number) =>
        v > 0 ? <Tag color="orange">₹{v.toLocaleString('en-IN')}</Tag> : <Tag color="green">Settled</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingCustomer(record)
              setModalOpen(true)
            }}
          />
          <Popconfirm
            title="Delete this customer?"
            description="This cannot be undone."
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <Title level={3} className="!mb-0 !text-brand-navy">
            Customers
          </Title>
          <Text type="secondary">Track customer purchases and pending balances.</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingCustomer(null)
            setModalOpen(true)
          }}
        >
          Add Customer
        </Button>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <Input
          allowClear
          prefix={<SearchOutlined className="text-gray-400" />}
          placeholder="Search by name or mobile"
          className="mb-3 md:w-72"
          onChange={(e) => {
            setPage(1)
            setSearch(e.target.value)
          }}
        />
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data?.items}
          loading={isLoading || isFetching}
          scroll={{ x: true }}
          pagination={{
            current: page,
            pageSize,
            total: data?.totalCount ?? 0,
            showSizeChanger: true,
            onChange: (p, ps) => {
              setPage(p)
              setPageSize(ps)
            },
          }}
          locale={{ emptyText: 'No customers yet. Click "Add Customer" to create your first one.' }}
        />
      </div>

      <CustomerFormModal open={modalOpen} customer={editingCustomer} onClose={() => setModalOpen(false)} />
    </div>
  )
}
