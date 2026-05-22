import { useMediaQuery } from '@mantine/hooks';
import logoBanner from '../../assets/logo_banner.svg';
import logoOnly from '../../assets/logo_only_background_resaved2.svg';
import '../../styles/MainLogo.css';

const MainLogo = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <div className="main-logo">
      <img
        src={isMobile ? logoOnly : logoBanner}
        alt="Naja Admin Logo"
        className={`logo-image ${isMobile ? 'logo-mobile' : 'logo-desktop'}`}
      />
    </div>
  );
};

export default MainLogo;
