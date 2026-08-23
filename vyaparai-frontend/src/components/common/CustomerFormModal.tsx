import { useEffect } from 'react'
import { Form, Input, Modal, App as AntApp } from 'antd'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { customerApi } from '../../api/customerApi'
import type { Customer, CustomerFormValues } from '../../types/customer'

interface CustomerFormModalProps {
  open: boolean
  customer: Customer | null
  onClose: () => void
}

export default function CustomerFormModal({ open, customer, onClose }: CustomerFormModalProps) {
  const [form] = Form.useForm<CustomerFormValues>()
  const queryClient = useQueryClient()
  const { message } = AntApp.useApp()
  const isEdit = !!customer

  useEffect(() => {
    if (!open) return
    if (customer) {
      form.setFieldsValue({
        name: customer.name,
        mobile: customer.mobile,
        email: customer.email ?? undefined,
        address: customer.address ?? undefined,
      })
    } else {
      form.resetFields()
    }
  }, [open, customer, form])

  const mutation = useMutation({
    mutationFn: (values: CustomerFormValues) =>
      isEdit ? customerApi.update(customer!.id, values) : customerApi.create(values),
    onSuccess: () => {
      message.success(isEdit ? 'Customer updated successfully.' : 'Customer added successfully.')
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      onClose()
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Something went wrong. Please try again.'
      message.error(msg)
    },
  })

  return (
    <Modal
      title={isEdit ? 'Edit Customer' : 'Add Customer'}
      open={open}
      onCancel={onClose}
      onOk={() => form.validateFields().then((values) => mutation.mutate(values))}
      confirmLoading={mutation.isPending}
      okText={isEdit ? 'Save Changes' : 'Add Customer'}
      destroyOnClose
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Enter customer name' }]}>
          <Input placeholder="e.g. Ramesh Kumar" />
        </Form.Item>
        <Form.Item
          name="mobile"
          label="Mobile Number"
          rules={[
            { required: true, message: 'Enter mobile number' },
            { pattern: /^[6-9]\d{9}$/, message: 'Enter a valid 10-digit mobile number' },
          ]}
        >
          <Input placeholder="e.g. 9876543210" maxLength={10} />
        </Form.Item>
        <Form.Item name="email" label="Email (optional)" rules={[{ type: 'email', message: 'Enter a valid email' }]}>
          <Input placeholder="e.g. ramesh@example.com" />
        </Form.Item>
        <Form.Item name="address" label="Address (optional)">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
