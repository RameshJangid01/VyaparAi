import { useState } from 'react'
import { Card, Col, Input, Row, Statistic, Table, Tag, Typography, Button } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { SearchOutlined, SwapOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { inventoryApi } from '../../api/inventoryApi'
import AdjustStockModal from '../../components/inventory/AdjustStockModal'
import StockStatusTag from '../../components/common/StockStatusTag'
import type { InventoryItem } from '../../types/inventory'

const { Title, Text } = Typography

export default function InventoryPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null)
  const [transactionsPage, setTransactionsPage] = useState(1)

  const { data: summary } = useQuery({
    queryKey: ['inventory', 'summary'],
    queryFn: () => inventoryApi.summary(),
  })

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['inventory', 'overview', { search, page, pageSize }],
    queryFn: () => inventoryApi.overview({ search, page, pageSize }),
  })

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['inventory', 'transactions', { transactionsPage }],
    queryFn: () => inventoryApi.transactions({ page: transactionsPage, pageSize: 8 }),
  })

  const columns: ColumnsType<InventoryItem> = [
    {
      title: 'Product',
      dataIndex: 'productName',
      render: (_, record) => (
        <div>
          <div className="font-medium text-brand-navy">{record.productName}</div>
          <Text type="secondary" className="text-xs">
            {record.sku} · {record.category}
          </Text>
        </div>
      ),
    },
    {
      title: 'Current Stock',
      dataIndex: 'currentQuantity',
      render: (_, record) => (
        <span>
          {record.currentQuantity} {record.unit}
        </span>
      ),
    },
    { title: 'Min. Level', dataIndex: 'minimumStockLevel', responsive: ['md'] },
    { title: 'Status', dataIndex: 'stockStatus', render: (status) => <StockStatusTag status={status} /> },
    {
      title: 'Stock Value',
      dataIndex: 'stockValue',
      responsive: ['lg'],
      render: (v: number) => `₹${v.toLocaleString('en-IN')}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button size="small" icon={<SwapOutlined />} onClick={() => setAdjustItem(record)}>
          Adjust
        </Button>
      ),
    },
  ]

  const txnTypeColor: Record<string, string> = {
    PURCHASE: 'green',
    SALE: 'blue',
    ADJUSTMENT: 'orange',
    RETURN: 'red',
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Title level={3} className="!mb-0 !text-brand-navy">
          Inventory
        </Title>
        <Text type="secondary">Live stock levels with a full, explainable movement history.</Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Card className="rounded-xl shadow-sm">
            <Statistic title="Total Products" value={summary?.totalProducts ?? 0} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="rounded-xl shadow-sm">
            <Statistic
              title="Low Stock"
              value={summary?.lowStockCount ?? 0}
              valueStyle={{ color: '#d48806' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="rounded-xl shadow-sm">
            <Statistic
              title="Out of Stock"
              value={summary?.outOfStockCount ?? 0}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="rounded-xl shadow-sm">
            <Statistic
              title="Total Stock Value"
              value={summary?.totalStockValue ?? 0}
              prefix="₹"
              precision={0}
            />
          </Card>
        </Col>
      </Row>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <Input
          allowClear
          prefix={<SearchOutlined className="text-gray-400" />}
          placeholder="Search by name or SKU"
          className="mb-3 md:w-72"
          onChange={(e) => {
            setPage(1)
            setSearch(e.target.value)
          }}
        />
        <Table
          rowKey="productId"
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
        />
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <Title level={5} className="!text-brand-navy">
          Recent Stock Movements
        </Title>
        <Table
          rowKey="id"
          size="small"
          loading={transactionsLoading}
          dataSource={transactions?.items}
          scroll={{ x: true }}
          columns={[
            { title: 'Product', dataIndex: 'productName' },
            {
              title: 'Type',
              dataIndex: 'type',
              render: (type: string) => <Tag color={txnTypeColor[type] ?? 'default'}>{type}</Tag>,
            },
            {
              title: 'Change',
              dataIndex: 'quantity',
              render: (q: number) => (q > 0 ? `+${q}` : q),
            },
            { title: 'New Qty', dataIndex: 'newQuantity' },
            { title: 'Reference', dataIndex: 'referenceType' },
            {
              title: 'Date',
              dataIndex: 'date',
              render: (d: string) => new Date(d).toLocaleString('en-IN'),
            },
          ]}
          pagination={{
            current: transactionsPage,
            pageSize: 8,
            total: transactions?.totalCount ?? 0,
            onChange: (p) => setTransactionsPage(p),
          }}
        />
      </div>

      <AdjustStockModal open={!!adjustItem} item={adjustItem} onClose={() => setAdjustItem(null)} />
    </div>
  )
}
