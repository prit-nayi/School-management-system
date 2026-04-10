import { NavLink } from 'react-router-dom'

type NavbarProps = {
  onRefresh?: () => void
  onLogout: () => void
}

export default function Navbar({ onRefresh, onLogout }: NavbarProps) {
  return (
    <div className="navbar">
      <div className="navbar-links">
        <NavLink to="/" className={({ isActive }) => `btn nav-btn ${isActive ? 'active' : ''}`}>
          Dashboard
        </NavLink>
        <NavLink to="/students" className={({ isActive }) => `btn nav-btn ${isActive ? 'active' : ''}`}>
          Students
        </NavLink>
        <NavLink to="/tasks" className={({ isActive }) => `btn nav-btn ${isActive ? 'active' : ''}`}>
          Tasks
        </NavLink>
      </div>
      <div className="navbar-actions">
        {onRefresh ? (
          <button className="btn" onClick={onRefresh}>
            Refresh
          </button>
        ) : null}
        <button className="btn danger" onClick={onLogout}>
          Logout
        </button>
      </div>
    </div>
  )
}

