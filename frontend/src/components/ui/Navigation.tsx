// functional component - Dummy Nav
interface NavigationProps {
  onSelectView: (view: 'admin' | 'available' | 'checked') => void;
}

const Navigation = ({ onSelectView }: NavigationProps) => {
   return (
      <nav>
         <ul>
            <li><a href="#" id="link1" 
               onClick={() => onSelectView('admin')}>Link Admin</a>
            </li>
            <li><a href="#" id="link1" 
               onClick={() => onSelectView('available')}>Link2</a>
            </li>
            <li><a href="#" id="link1" 
               onClick={() => onSelectView('checked')}>Link 3</a>
            </li>
         </ul>
      </nav>
   );
};

export default Navigation;