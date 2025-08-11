import { useNavigate } from 'react-router-dom';

// functional component - Navigation with React Router
interface NavigationProps {
  onSelectView?: (view: 'admin' | 'available' | 'checked') => void;
}

const Navigation = ({ onSelectView }: NavigationProps) => {
  const navigate = useNavigate();

  const handleAdminClick = () => {
    navigate('/admin');
    if (onSelectView) onSelectView('admin');
  };

  const handleLink2Click = () => {
    if (onSelectView) onSelectView('available');
  };

  const handleLink3Click = () => {
    if (onSelectView) onSelectView('checked');
  };

   return (
      <nav>
         <ul>
            <li><a href="#" 
               onClick={(e) => { e.preventDefault(); handleAdminClick(); }}>Link Admin</a>
            </li>
            <li><a href="#" 
               onClick={(e) => { e.preventDefault(); handleLink2Click(); }}>Link2</a>
            </li>
            <li><a href="#" 
               onClick={(e) => { e.preventDefault(); handleLink3Click(); }}>Link 3</a>
            </li>
         </ul>
      </nav>
   );
};

export default Navigation;