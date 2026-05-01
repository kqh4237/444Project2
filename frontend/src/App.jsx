import { Routes, Route, Navigate } from 'react-router-dom'
import Nav from './components/Nav.jsx'
import MenuPage from './pages/MenuPage.jsx'
import OrdersPage from './pages/OrdersPage.jsx'

export default function App() {
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/"        element={<Navigate to="/menu" replace />} />
        <Route path="/menu"    element={<MenuPage />} />
        <Route path="/orders"  element={<OrdersPage />} />
      </Routes>
    </>
  )
}