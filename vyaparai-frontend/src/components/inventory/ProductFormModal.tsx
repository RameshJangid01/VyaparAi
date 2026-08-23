import { useEffect } from 'react'
import { Form, Input, InputNumber, Modal, Select, DatePicker, Switch, App as AntApp } from 'antd'
import dayjs from 'dayjs'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { productApi } from '../../api/productApi'
import { supplierApi } from '../../api/supplierApi'
import type { Product, ProductFormValues } from '../../types/product'

const UNITS = ['pcs', 'kg', 'g', 'litre', 'ml', 'box', 'packet', 'dozen']

interface ProductFormModalProps {
  open: boolean
  product: Product | null // null = create mode
  onClose: () => void
}

export default function ProductFormModal({ open, product, onClose }: ProductFormModalProps) {
  const [form] = Form.useForm<ProductFormValues>()
  const queryClient = useQueryClient()
  const { message } = AntApp.useApp()
  const isEdit = !!product

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers', 'for-select'],
    queryFn: () => supplierApi.list({ page: 1, pageSize: 100 }),
    enabled: open,
  })

  useEffect(() => {
    if (!open) return
    if (product) {
      form.setFieldsValue({
        name: product.name,
        sku: product.sku,
        barcode: product.barcode ?? undefined,
        category: product.category,
        brand: product.brand ?? undefined,
        purchasePrice: product.purchasePrice,
        sellingPrice: product.sellingPrice,
        gstPercentage: product.gstPercentage,
        minimumStockLevel: product.minimumStockLevel,
        supplierId: product.supplierId ?? undefined,
        expiryDate: product.expiryDate ? (dayjs(product.expiryDate) as unknown as string) : undefined,
        unit: product.unit,
        isActive: product.isActive,
      })
    } else {
      form.resetFields()
      form.setFieldsValue({ unit: 'pcs', gstPercentage: 0, currentQuantity: 0, minimumStockLevel: 5, isActive: true })
    }
  }, [open, product, form])

  const mutation = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      const payload = {
        ...values,
        expiryDate: values.expiryDate
          ? (dayjs(values.expiryDate as unknown as dayjs.Dayjs).format('YYYY-MM-DD') as string)
          : undefined,
      }
      return isEdit ? productApi.update(product!.id, payload) : productApi.create(payload)
    },
    onSuccess: () => {
      message.success(isEdit ? 'Product updated successfully.' : 'Product added successfully.')
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product-categories'] })
      onClose()
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Something went wrong. Please try again.'
      message.error(msg)
    },
  })

  const handleOk = () => {
    form.validateFields().then((values) => mutation.mutate(values))
  }

  return (
    <Modal
      title={isEdit ? 'Edit Product' : 'Add Product'}
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      confirmLoading={mutation.isPending}
      okText={isEdit ? 'Save Changes' : 'Add Product'}
      destroyOnClose
      width={640}
    >
      <Form form={form} layout="vertical" className="mt-4">
        <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
          <Form.Item name="name" label="Product Name" rules={[{ required: true, message: 'Enter product name' }]}>
            <Input placeholder="e.g. Parle-G Biscuit 100g" />
          </Form.Item>
          <Form.Item name="sku" label="SKU" rules={[{ required: true, message: 'Enter SKU' }]}>
            <Input placeholder="e.g. PGB-100" />
          </Form.Item>

          <Form.Item name="category" label="Category" rules={[{ required: true, message: 'Enter category' }]}>
            <Input placeholder="e.g. Snacks" />
          </Form.Item>
          <Form.Item name="brand" label="Brand">
            <Input placeholder="e.g. Parle" />
          </Form.Item>

          <Form.Item name="barcode" label="Barcode (optional)">
            <Input placeholder="Scan or enter barcode" />
          </Form.Item>
          <Form.Item name="supplierId" label="Supplier (optional)">
            <Select
              allowClear
              placeholder="Select supplier"
              options={suppliers?.items.map((s) => ({ value: s.id, label: s.supplierName }))}
            />
          </Form.Item>

          <Form.Item
            name="purchasePrice"
            label="Purchase Price (₹)"
            rules={[{ required: true, message: 'Enter purchase price' }]}
          >
            <InputNumber min={0} className="w-full" />
          </Form.Item>
          <Form.Item
            name="sellingPrice"
            label="Selling Price (₹)"
            rules={[{ required: true, message: 'Enter selling price' }]}
          >
            <InputNumber min={0} className="w-full" />
          </Form.Item>

          <Form.Item name="gstPercentage" label="GST %" rules={[{ required: true }]}>
            <InputNumber min={0} max={100} className="w-full" />
          </Form.Item>
          <Form.Item name="unit" label="Unit" rules={[{ required: true }]}>
            <Select options={UNITS.map((u) => ({ value: u, label: u }))} />
          </Form.Item>

          {!isEdit && (
            <Form.Item name="currentQuantity" label="Opening Quantity">
              <InputNumber min={0} className="w-full" />
            </Form.Item>
          )}
          <Form.Item
            name="minimumStockLevel"
            label="Minimum Stock Level"
            rules={[{ required: true, message: 'Enter minimum stock level' }]}
          >
            <InputNumber min={0} className="w-full" />
          </Form.Item>

          <Form.Item name="expiryDate" label="Expiry Date (optional)">
            <DatePicker className="w-full" />
          </Form.Item>
          {isEdit && (
            <Form.Item name="isActive" label="Active" valuePropName="checked">
              <Switch />
            </Form.Item>
          )}
        </div>
        {!isEdit && (
          <p className="-mt-2 text-xs text-gray-400">
            Opening quantity is recorded as an ADJUSTMENT in the inventory ledger. To change stock later, use
            Inventory → Adjust Stock.
          </p>
        )}
      </Form>
    </Modal>
  )
}
