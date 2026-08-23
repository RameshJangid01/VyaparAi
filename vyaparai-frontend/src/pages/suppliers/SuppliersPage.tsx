import { useState } from 'react'
import { Button, Input, Table, Tag, Typography, Popconfirm, App as AntApp } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, SearchOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supplierApi } from '../../api/supplierApi'
import SupplierFormModal from '../../components/common/SupplierFormModal'
import type { Supplier } from '../../types/supplier'

const { Title, Text } = Typography

export default function SuppliersPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)

  const queryClient = useQueryClient()
  const { message } = AntApp.useApp()

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['suppliers', { search, page, pageSize }],
    queryFn: () => supplierApi.list({ search, page, pageSize }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => supplierApi.remove(id),
    onSuccess: () => {
      message.success('Supplier deleted successfully.')
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not delete this supplier.'
      message.error(msg)
    },
  })

  const columns: ColumnsType<Supplier> = [
    {
      title: 'Supplier',
      dataIndex: 'supplierName',
      render: (_, record) => (
        <div>
          <div className="font-medium text-brand-navy">{record.supplierName}</div>
          <Text type="secondary" className="text-xs">
            {record.contactPerson ? `${record.contactPerson} · ` : ''}
            {record.mobile}
          </Text>
        </div>
      ),
    },
    { title: 'GST No.', dataIndex: 'gstNumber', responsive: ['md'], render: (v) => v ?? '—' },
    {
      title: 'Total Purchases',
      dataIndex: 'totalPurchases',
      render: (v: number) => `₹${v.toLocaleString('en-IN')}`,
    },
    {
      title: 'Pending',
      dataIndex: 'pending',
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
              setEditingSupplier(record)
              setModalOpen(true)
            }}
          />
          <Popconfirm
            title="Delete this supplier?"
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
            Suppliers
          </Title>
          <Text type="secondary">Manage vendors and track purchase balances.</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingSupplier(null)
            setModalOpen(true)
          }}
        >
          Add Supplier
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
          locale={{ emptyText: 'No suppliers yet. Click "Add Supplier" to create your first one.' }}
        />
      </div>

      <SupplierFormModal open={modalOpen} supplier={editingSupplier} onClose={() => setModalOpen(false)} />
    </div>
  )
}
