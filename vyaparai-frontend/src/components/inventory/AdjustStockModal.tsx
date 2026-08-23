import { useEffect } from 'react'
import { Form, Input, InputNumber, Modal, Radio, App as AntApp } from 'antd'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { inventoryApi } from '../../api/inventoryApi'
import type { InventoryItem } from '../../types/inventory'

interface AdjustStockModalProps {
  open: boolean
  item: InventoryItem | null
  onClose: () => void
}

interface FormValues {
  direction: 'increase' | 'decrease'
  quantity: number
  reason: string
}

export default function AdjustStockModal({ open, item, onClose }: AdjustStockModalProps) {
  const [form] = Form.useForm<FormValues>()
  const queryClient = useQueryClient()
  const { message } = AntApp.useApp()

  useEffect(() => {
    if (open) form.setFieldsValue({ direction: 'increase', quantity: 1, reason: '' })
  }, [open, form])

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      inventoryApi.adjustStock({
        productId: item!.productId,
        quantityChange: values.direction === 'increase' ? values.quantity : -values.quantity,
        reason: values.reason,
      }),
    onSuccess: () => {
      message.success('Stock adjusted successfully.')
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      onClose()
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not adjust stock. Please try again.'
      message.error(msg)
    },
  })

  return (
    <Modal
      title={`Adjust Stock — ${item?.productName ?? ''}`}
      open={open}
      onCancel={onClose}
      onOk={() => form.validateFields().then((values) => mutation.mutate(values))}
      confirmLoading={mutation.isPending}
      okText="Apply Adjustment"
      destroyOnClose
    >
      <p className="text-sm text-gray-500">
        Current quantity: <strong>{item?.currentQuantity}</strong> {item?.unit}
      </p>
      <Form form={form} layout="vertical" className="mt-2">
        <Form.Item name="direction" label="Direction" rules={[{ required: true }]}>
          <Radio.Group optionType="button" buttonStyle="solid">
            <Radio.Button value="increase">Increase</Radio.Button>
            <Radio.Button value="decrease">Decrease</Radio.Button>
          </Radio.Group>
        </Form.Item>
        <Form.Item name="quantity" label="Quantity" rules={[{ required: true, message: 'Enter a quantity' }]}>
          <InputNumber min={1} className="w-full" />
        </Form.Item>
        <Form.Item name="reason" label="Reason" rules={[{ required: true, message: 'Enter a reason' }]}>
          <Input.TextArea rows={2} placeholder="e.g. Physical stock count correction, damaged goods, etc." />
        </Form.Item>
      </Form>
    </Modal>
  )
}
