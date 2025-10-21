import { useNavigate } from "react-router-dom";

const HomePageAdmin = () => {
  const navigate = useNavigate();

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Welcome to the administration panel.</p>
      
      <div className="admin-actions" style={{ marginTop: '30px' }}>
        <h2>Quick Actions</h2>
        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
          <button 
            onClick={() => navigate('/admin/roles')} 
            style={{ 
              padding: '12px 24px', 
              fontSize: '16px', 
              backgroundColor: 'transparent',
              border: '1px solid #00ff00',
              color: '#00ff00',
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            Manage Roles
          </button>
          <button 
            onClick={() => navigate('/admin/users')} 
            style={{ 
              padding: '12px 24px', 
              fontSize: '16px', 
              backgroundColor: 'transparent',
              border: '1px solid #00ff00',
              color: '#00ff00',
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            Manage Users
          </button>
        </div>
      </div>
    </div>
  );
};
export default HomePageAdmin;
