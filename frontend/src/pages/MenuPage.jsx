import { useState, useEffect } from 'react'
import { menuApi } from '../api.js'
import Modal from '../components/Modal.jsx'
import { Toast, useToast } from '../components/Toast.jsx'

const CATEGORIES = ['All', 'Pizza', 'Sides', 'Drinks']

const EMPTY_FORM = { name: '', category: 'Pizza', description: '', price: '', available: true }

export default function MenuPage() {
  const [items, setItems]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('All')
  const [modal, setModal]         = useState(null)   // 'add' | 'edit' | 'delete'
  const [selected, setSelected]   = useState(null)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const { toast, showToast }      = useToast()

  const load = async () => {
    try {
      const data = await menuApi.getAll()
      setItems(Array.isArray(data) ? data : [])
    } catch {
      showToast('Failed to load menu', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openAdd = () => {
    setForm(EMPTY_FORM)
    setModal('add')
  }

  const openEdit = (item) => {
    setSelected(item)
    setForm({
      name: item.name,
      category: item.category,
      description: item.description,
      price: item.price,
      available: Boolean(item.available),
    })
    setModal('edit')
  }

  const openDelete = (item) => {
    setSelected(item)
    setModal('delete')
  }

  const closeModal = () => {
    setModal(null)
    setSelected(null)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const body = { ...form, price: parseFloat(form.price), available: form.available ? 1 : 0 }
      if (modal === 'add') {
        await menuApi.create(body)
        showToast('Item added successfully')
      } else {
        await menuApi.update(selected.id, body)
        showToast('Item updated successfully')
      }
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
      await menuApi.remove(selected.id)
      showToast('Item deleted')
      await load()
      closeModal()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const visible = filter === 'All' ? items : items.filter(i => i.category === filter)

  const grouped = CATEGORIES.slice(1).reduce((acc, cat) => {
    const list = visible.filter(i => i.category === cat)
    if (list.length) acc[cat] = list
    return acc
  }, {})

  return (
    <div className="page-wrapper fade-in">
      <div className="page-header">
        <div>
          <h1>Menu <span>Items</span></h1>
          <p>{items.length} items across {CATEGORIES.slice(1).length} categories</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Add Item
        </button>
      </div>

      {/* Category tabs */}
      <div className="filter-tabs">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`filter-tab${filter === cat ? ' active' : ''}`}
            onClick={() => setFilter(cat)}
          >
            {cat}
            <span className="filter-count">
              {cat === 'All' ? items.length : items.filter(i => i.category === cat).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="spinner-wrap"><div className="spinner" /><span>Loading menu...</span></div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">—</div>
          <h3>No items yet</h3>
          <p>Add your first menu item to get started.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([cat, list]) => (
          <section key={cat} className="menu-section">
            <div className="menu-section-header">
              <h2 className="menu-section-title">
                <span className={`badge badge-${cat.toLowerCase()}`}>{cat}</span>
              </h2>
              <span className="menu-section-count">{list.length} item{list.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="menu-grid">
              {list.map(item => (
                <div key={item.id} className="menu-card card">
                  <div className="menu-card-body">
                    <div className="menu-card-top">
                      <h3 className="menu-card-name">{item.name}</h3>
                      <span className={`badge badge-${item.available ? 'available' : 'unavailable'}`}>
                        {item.available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    <p className="menu-card-desc">{item.description}</p>
                    <div className="menu-card-footer">
                      <span className="menu-card-price">${parseFloat(item.price).toFixed(2)}</span>
                      <div className="menu-card-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(item)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => openDelete(item)}>Delete</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}

      {/* Add / Edit modal */}
      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Add Menu Item' : 'Edit Menu Item'} onClose={closeModal}>
          <form onSubmit={handleSave} className="modal-form">
            <div className="form-row">
              <div className="form-group">
                <label>Name</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Pepperoni Pizza"
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  <option>Pizza</option>
                  <option>Sides</option>
                  <option>Drinks</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                required
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe the item..."
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Price ($)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label>Availability</label>
                <select
                  value={form.available ? '1' : '0'}
                  onChange={e => setForm(f => ({ ...f, available: e.target.value === '1' }))}
                >
                  <option value="1">Available</option>
                  <option value="0">Unavailable</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : modal === 'add' ? 'Add Item' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirmation modal */}
      {modal === 'delete' && selected && (
        <Modal title="Delete Item" onClose={closeModal}>
          <p className="confirm-text">
            Are you sure you want to delete <strong>{selected.name}</strong>? This cannot be undone.
          </p>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>
              {saving ? 'Deleting...' : 'Delete Item'}
            </button>
          </div>
        </Modal>
      )}

      <Toast toast={toast} />
    </div>
  )
}