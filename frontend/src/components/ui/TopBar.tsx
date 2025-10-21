import MainLogo from './MainLogo';
import '../../styles/TopBar.css';

const TopBar = () => {
  return (
    <div className="top-bar">
      <div className="top-bar-content">
        <div className="top-bar-left">
          <MainLogo />
          <div className="breadcrumb">
            <span className="terminal-prompt">~/admin</span>
          </div>
        </div>
        
        <div className="top-bar-actions">
          <button className="terminal-button">
            <span>⚙️</span>
            Settings
          </button>
          <button className="terminal-button">
            <span>🔔</span>
            Notifications
          </button>
          <button className="terminal-button">
            <span>👤</span>
            Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopBar;