import { useState } from 'react'
import { Button, Input, Select, Switch, Table, Tag, Typography, Popconfirm, App as AntApp } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, SearchOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { productApi } from '../../api/productApi'
import ProductFormModal from '../../components/inventory/ProductFormModal'
import StockStatusTag from '../../components/common/StockStatusTag'
import type { Product } from '../../types/product'

const { Title, Text } = Typography

export default function ProductsPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string | undefined>(undefined)
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const queryClient = useQueryClient()
  const { message } = AntApp.useApp()

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['products', { search, category, lowStockOnly, page, pageSize }],
    queryFn: () => productApi.list({ search, category, lowStockOnly, page, pageSize }),
  })

  const { data: categories } = useQuery({
    queryKey: ['product-categories'],
    queryFn: () => productApi.getCategories(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productApi.remove(id),
    onSuccess: () => {
      message.success('Product deleted successfully.')
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
    onError: () => message.error('Could not delete this product. Please try again.'),
  })

  const openCreate = () => {
    setEditingProduct(null)
    setModalOpen(true)
  }

  const openEdit = (product: Product) => {
    setEditingProduct(product)
    setModalOpen(true)
  }

  const columns: ColumnsType<Product> = [
    {
      title: 'Product',
      dataIndex: 'name',
      render: (_, record) => (
        <div>
          <div className="font-medium text-brand-navy">{record.name}</div>
          <Text type="secondary" className="text-xs">
            SKU: {record.sku}
            {record.brand ? ` · ${record.brand}` : ''}
          </Text>
        </div>
      ),
    },
    { title: 'Category', dataIndex: 'category', render: (c) => <Tag>{c}</Tag>, responsive: ['md'] },
    {
      title: 'Stock',
      dataIndex: 'currentQuantity',
      render: (_, record) => (
        <span>
          {record.currentQuantity} {record.unit}
        </span>
      ),
    },
    { title: 'Status', dataIndex: 'stockStatus', render: (status) => <StockStatusTag status={status} /> },
    {
      title: 'Price',
      dataIndex: 'sellingPrice',
      responsive: ['lg'],
      render: (_, record) => (
        <div className="text-sm">
          <div>Sell: ₹{record.sellingPrice}</div>
          <Text type="secondary">Cost: ₹{record.purchasePrice}</Text>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div className="flex gap-2">
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm
            title="Delete this product?"
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
            Products
          </Title>
          <Text type="secondary">Manage your catalog, pricing and stock levels.</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Add Product
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm md:flex-row md:items-center">
        <Input
          allowClear
          prefix={<SearchOutlined className="text-gray-400" />}
          placeholder="Search by name or SKU"
          className="md:w-72"
          onChange={(e) => {
            setPage(1)
            setSearch(e.target.value)
          }}
        />
        <Select
          allowClear
          placeholder="All Categories"
          className="md:w-48"
          value={category}
          onChange={(value) => {
            setPage(1)
            setCategory(value)
          }}
          options={categories?.map((c) => ({ value: c, label: c }))}
        />
        <div className="flex items-center gap-2">
          <Switch
            checked={lowStockOnly}
            onChange={(checked) => {
              setPage(1)
              setLowStockOnly(checked)
            }}
          />
          <Text>Low stock only</Text>
        </div>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data?.items}
        loading={isLoading || isFetching}
        scroll={{ x: true }}
        className="overflow-hidden rounded-xl bg-white shadow-sm"
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
        locale={{ emptyText: 'No products yet. Click "Add Product" to create your first one.' }}
      />

      <ProductFormModal open={modalOpen} product={editingProduct} onClose={() => setModalOpen(false)} />
    </div>
  )
}
