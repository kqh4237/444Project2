import { useState, useEffect } from 'react'
import { ordersApi, menuApi } from '../api.js'
import Modal from '../components/Modal.jsx'
import { Toast, useToast } from '../components/Toast.jsx'

const STATUSES = ['pending', 'in-progress', 'completed', 'cancelled']

const STATUS_LABELS = {
  pending:     'Pending',
  'in-progress': 'In Progress',
  completed:   'Completed',
  cancelled:   'Cancelled',
}

export default function OrdersPage() {
  const [orders, setOrders]       = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('all')
  const [modal, setModal]         = useState(null)   // 'create' | 'detail' | 'status' | 'delete'
  const [selected, setSelected]   = useState(null)
  const [detail, setDetail]       = useState(null)
  const [saving, setSaving]       = useState(false)
  const { toast, showToast }      = useToast()

  // Create order form
  const [customerName, setCustomerName] = useState('')
  const [notes, setNotes]               = useState('')
  const [cart, setCart]                 = useState([])   // [{ menu_item_id, quantity }]

  const load = async () => {
    try {
      const [o, m] = await Promise.all([ordersApi.getAll(), menuApi.getAll()])
      setOrders(Array.isArray(o) ? o : [])
      setMenuItems(Array.isArray(m) ? m.filter(i => i.available) : [])
    } catch {
      showToast('Failed to load data', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setCustomerName('')
    setNotes('')
    setCart([])
    setModal('create')
  }

  const openDetail = async (order) => {
    try {
      const data = await ordersApi.getOne(order.id)
      setDetail(data)
      setModal('detail')
    } catch {
      showToast('Could not load order details', 'error')
    }
  }

  const openStatus = (order) => {
    setSelected(order)
    setModal('status')
  }

  const openDelete = (order) => {
    setSelected(order)
    setModal('delete')
  }

  const closeModal = () => {
    setModal(null)
    setSelected(null)
    setDetail(null)
  }

  // Cart helpers
  const cartQty = (id) => cart.find(c => c.menu_item_id === id)?.quantity ?? 0

  const setQty = (id, qty) => {
    setCart(prev => {
      if (qty <= 0) return prev.filter(c => c.menu_item_id !== id)
      const exists = prev.find(c => c.menu_item_id === id)
      if (exists) return prev.map(c => c.menu_item_id === id ? { ...c, quantity: qty } : c)
      return [...prev, { menu_item_id: id, quantity: qty }]
    })
  }

  const cartTotal = cart.reduce((sum, c) => {
    const item = menuItems.find(m => m.id === c.menu_item_id)
    return sum + (item ? parseFloat(item.price) * c.quantity : 0)
  }, 0)

  const handleCreate = async (e) => {
    e.preventDefault()
    if (cart.length === 0) { showToast('Add at least one item', 'error'); return }
    setSaving(true)
    try {
      await ordersApi.create({ customer_name: customerName, notes, items: cart })
      showToast('Order created successfully')
      await load()
      closeModal()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusUpdate = async (newStatus) => {
    if (!selected) return
    setSaving(true)
    try {
      await ordersApi.update(selected.id, {
        customer_name: selected.customer_name,
        status: newStatus,
        total_price: selected.total_price,
        notes: selected.notes,
      })
      showToast('Status updated')
      await load()
      closeModal()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await ordersApi.remove(selected.id)
      showToast('Order deleted')
      await load()
      closeModal()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const fmtDate = (d) => {
    if (!d) return '—'
    return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = orders.filter(o => o.status === s).length
    return acc
  }, {})

  return (
    <div className="page-wrapper fade-in">
      <div className="page-header">
        <div>
          <h1>Orders <span>Board</span></h1>
          <p>{orders.length} total orders</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          New Order
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="filter-tabs">
        <button className={`filter-tab${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>
          All <span className="filter-count">{orders.length}</span>
        </button>
        {STATUSES.map(s => (
          <button key={s} className={`filter-tab${filter === s ? ' active' : ''}`} onClick={() => setFilter(s)}>
            {STATUS_LABELS[s]} <span className="filter-count">{counts[s] ?? 0}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="spinner-wrap"><div className="spinner" /><span>Loading orders...</span></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">—</div>
          <h3>{filter === 'all' ? 'No orders yet' : `No ${STATUS_LABELS[filter].toLowerCase()} orders`}</h3>
          <p>{filter === 'all' ? 'Create a new order to get started.' : 'Try a different filter.'}</p>
        </div>
      ) : (
        <div className="orders-list">
          {filtered.map(order => (
            <div key={order.id} className="order-card card">
              <div className="order-card-inner">
                <div className="order-meta">
                  <span className="order-id">#{order.id}</span>
                  <span className={`badge badge-${order.status}`}>{STATUS_LABELS[order.status]}</span>
                </div>
                <div className="order-main">
                  <div>
                    <h3 className="order-name">{order.customer_name}</h3>
                    <span className="order-date">{fmtDate(order.order_date)}</span>
                  </div>
                  <div className="order-price">${parseFloat(order.total_price).toFixed(2)}</div>
                </div>
                {order.notes && <p className="order-notes">{order.notes}</p>}
                <div className="order-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => openDetail(order)}>View Details</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => openStatus(order)}>Update Status</button>
                  <button className="btn btn-danger btn-sm" onClick={() => openDelete(order)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create order modal */}
      {modal === 'create' && (
        <Modal title="New Order" onClose={closeModal} wide>
          <form onSubmit={handleCreate} className="modal-form">
            <div className="form-row">
              <div className="form-group">
                <label>Customer Name</label>
                <input
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                />
              </div>
              <div className="form-group">
                <label>Notes (optional)</label>
                <input
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Any special requests..."
                />
              </div>
            </div>

            <div className="form-group">
              <label>Select Items</label>
              <div className="item-picker">
                {menuItems.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No available menu items.</p>
                )}
                {['Pizza', 'Sides', 'Drinks'].map(cat => {
                  const list = menuItems.filter(m => m.category === cat)
                  if (!list.length) return null
                  return (
                    <div key={cat} className="picker-section">
                      <h4 className="picker-category">{cat}</h4>
                      {list.map(item => (
                        <div key={item.id} className="picker-row">
                          <div className="picker-info">
                            <span className="picker-name">{item.name}</span>
                            <span className="picker-price">${parseFloat(item.price).toFixed(2)}</span>
                          </div>
                          <div className="qty-control">
                            <button
                              type="button"
                              className="qty-btn"
                              onClick={() => setQty(item.id, cartQty(item.id) - 1)}
                              disabled={cartQty(item.id) === 0}
                            >-</button>
                            <span className="qty-val">{cartQty(item.id)}</span>
                            <button
                              type="button"
                              className="qty-btn"
                              onClick={() => setQty(item.id, cartQty(item.id) + 1)}
                            >+</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>

            {cart.length > 0 && (
              <div className="cart-summary">
                <span>
                  {cart.reduce((s, c) => s + c.quantity, 0)} item{cart.reduce((s, c) => s + c.quantity, 0) !== 1 ? 's' : ''}
                </span>
                <span className="cart-total">Total: ${cartTotal.toFixed(2)}</span>
              </div>
            )}

            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving || cart.length === 0}>
                {saving ? 'Creating...' : 'Place Order'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Order detail modal */}
      {modal === 'detail' && detail && (
        <Modal title={`Order #${detail.id}`} onClose={closeModal}>
          <div className="detail-grid">
            <div className="detail-row">
              <span className="detail-label">Customer</span>
              <span className="detail-value">{detail.customer_name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Status</span>
              <span className={`badge badge-${detail.status}`}>{STATUS_LABELS[detail.status]}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Date</span>
              <span className="detail-value">{fmtDate(detail.order_date)}</span>
            </div>
            {detail.notes && (
              <div className="detail-row">
                <span className="detail-label">Notes</span>
                <span className="detail-value">{detail.notes}</span>
              </div>
            )}
          </div>

          {detail.items && detail.items.length > 0 && (
            <div className="detail-items">
              <h4 className="detail-items-title">Items</h4>
              {detail.items.map((item, i) => (
                <div key={i} className="detail-item-row">
                  <span className="detail-item-name">{item.name}</span>
                  <span className="detail-item-qty">x{item.quantity}</span>
                  <span className="detail-item-price">${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="detail-item-total">
                <span>Total</span>
                <span>${parseFloat(detail.total_price).toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={closeModal}>Close</button>
            <button className="btn btn-primary" onClick={() => { closeModal(); openStatus(detail) }}>
              Update Status
            </button>
          </div>
        </Modal>
      )}

      {/* Update status modal */}
      {modal === 'status' && selected && (
        <Modal title="Update Status" onClose={closeModal}>
          <p className="confirm-text" style={{ marginBottom: 20 }}>
            Order <strong>#{selected.id}</strong> for <strong>{selected.customer_name}</strong>
          </p>
          <div className="status-grid">
            {STATUSES.map(s => (
              <button
                key={s}
                className={`status-option${selected.status === s ? ' current' : ''}`}
                onClick={() => handleStatusUpdate(s)}
                disabled={saving}
              >
                <span className={`badge badge-${s}`}>{STATUS_LABELS[s]}</span>
              </button>
            ))}
          </div>
          <div className="modal-actions" style={{ marginTop: 24 }}>
            <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
          </div>
        </Modal>
      )}

      {/* Delete confirmation modal */}
      {modal === 'delete' && selected && (
        <Modal title="Delete Order" onClose={closeModal}>
          <p className="confirm-text">
            Are you sure you want to delete order <strong>#{selected.id}</strong> for{' '}
            <strong>{selected.customer_name}</strong>? This cannot be undone.
          </p>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>
              {saving ? 'Deleting...' : 'Delete Order'}
            </button>
          </div>
        </Modal>
      )}

      <Toast toast={toast} />
    </div>
  )
}