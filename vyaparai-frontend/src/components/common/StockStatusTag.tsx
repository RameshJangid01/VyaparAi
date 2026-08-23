import { Tag } from 'antd'
import type { StockStatus } from '../../types/product'

const CONFIG: Record<StockStatus, { color: string; label: string }> = {
  OK: { color: 'success', label: 'In Stock' },
  LOW: { color: 'warning', label: 'Low Stock' },
  OUT: { color: 'error', label: 'Out of Stock' },
}

export default function StockStatusTag({ status }: { status: StockStatus }) {
  const config = CONFIG[status] ?? CONFIG.OK
  return <Tag color={config.color}>{config.label}</Tag>
}
