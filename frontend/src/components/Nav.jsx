import { NavLink } from 'react-router-dom'

export default function Nav() {
  return (
    <header className="nav">
      <div className="nav-inner">
        <div className="nav-brand">
<span className="nav-brand-text">Pizza <span>Planet</span></span>
        </div>
        <nav className="nav-links">
          <NavLink to="/menu"   className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>Menu</NavLink>
          <NavLink to="/orders" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>Orders</NavLink>
        </nav>

      </div>
    </header>
  )
}