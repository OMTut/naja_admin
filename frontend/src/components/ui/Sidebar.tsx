import { useNavigate, useLocation } from 'react-router-dom';
import { useSidebar } from '../../contexts/SidebarContext';
import '../../styles/Sidebar.css';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isOpen, isMobile, closeSidebar } = useSidebar();

  const menuItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/admin', label: 'Admin Dashboard', icon: '🛠️' },
    { path: '/admin/users', label: 'User Management', icon: '👥' },
    { path: '/admin/roles', label: 'Role Management', icon: '🔑' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    // Close sidebar on mobile after navigation
    if (isMobile) {
      closeSidebar();
    }
  };

  const isActivePath = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Don't render sidebar on mobile when closed
  if (isMobile && !isOpen) {
    return null;
  }

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar} />
      )}
      
      <aside className={`sidebar ${isMobile ? 'sidebar-mobile' : ''} ${isOpen || !isMobile ? 'sidebar-open' : ''}`}>
        <nav className="sidebar-nav">
        <ul className="nav-list">
          {menuItems.map((item) => (
            <li key={item.path} className="nav-item">
              <button
                className={`nav-button ${isActivePath(item.path) ? 'active' : ''}`}
                onClick={() => handleNavigation(item.path)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="sidebar-footer">
        <div className="terminal-status">
          <span className="status-indicator">●</span>
          <span className="status-text">Connected</span>
        </div>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;