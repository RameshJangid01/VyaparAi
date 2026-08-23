import { useEffect } from 'react'
import { Form, Input, Modal, App as AntApp } from 'antd'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supplierApi } from '../../api/supplierApi'
import type { Supplier, SupplierFormValues } from '../../types/supplier'

interface SupplierFormModalProps {
  open: boolean
  supplier: Supplier | null
  onClose: () => void
}

export default function SupplierFormModal({ open, supplier, onClose }: SupplierFormModalProps) {
  const [form] = Form.useForm<SupplierFormValues>()
  const queryClient = useQueryClient()
  const { message } = AntApp.useApp()
  const isEdit = !!supplier

  useEffect(() => {
    if (!open) return
    if (supplier) {
      form.setFieldsValue({
        supplierName: supplier.supplierName,
        contactPerson: supplier.contactPerson ?? undefined,
        mobile: supplier.mobile,
        email: supplier.email ?? undefined,
        address: supplier.address ?? undefined,
        gstNumber: supplier.gstNumber ?? undefined,
      })
    } else {
      form.resetFields()
    }
  }, [open, supplier, form])

  const mutation = useMutation({
    mutationFn: (values: SupplierFormValues) =>
      isEdit ? supplierApi.update(supplier!.id, values) : supplierApi.create(values),
    onSuccess: () => {
      message.success(isEdit ? 'Supplier updated successfully.' : 'Supplier added successfully.')
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
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
      title={isEdit ? 'Edit Supplier' : 'Add Supplier'}
      open={open}
      onCancel={onClose}
      onOk={() => form.validateFields().then((values) => mutation.mutate(values))}
      confirmLoading={mutation.isPending}
      okText={isEdit ? 'Save Changes' : 'Add Supplier'}
      destroyOnClose
      width={560}
    >
      <Form form={form} layout="vertical" className="mt-4">
        <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
          <Form.Item
            name="supplierName"
            label="Supplier Name"
            rules={[{ required: true, message: 'Enter supplier name' }]}
          >
            <Input placeholder="e.g. Sharma Distributors" />
          </Form.Item>
          <Form.Item name="contactPerson" label="Contact Person">
            <Input placeholder="e.g. Vikas Sharma" />
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
          <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Enter a valid email' }]}>
            <Input placeholder="e.g. contact@supplier.com" />
          </Form.Item>
          <Form.Item name="gstNumber" label="GST Number (optional)">
            <Input placeholder="e.g. 27ABCDE1234F1Z5" />
          </Form.Item>
        </div>
        <Form.Item name="address" label="Address (optional)">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
