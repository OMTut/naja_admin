import MainLogo from "../../components/ui/MainLogo";
import Navigation from "../../components/ui/Navigation";
import { useNavigate } from "react-router-dom";

const HomePageAdmin = () => {
  const navigate = useNavigate();

  return (
    <div>
      <MainLogo />
      <p>This is the Admin Home page.</p>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => navigate('/admin/roles')} style={{ padding: '10px 20px', fontSize: '16px', marginRight: '10px' }}>
          Manage Roles
        </button>
        <button onClick={() => navigate('/admin/users')} style={{ padding: '10px 20px', fontSize: '16px' }}>
          Manage Users
        </button>
      </div>
      <Navigation onSelectView={(view) => console.log(view)} />
    </div>
  );
};
export default HomePageAdmin;
