import { useState, useEffect } from 'react';
import { useSidebar } from '../../contexts/SidebarContext';
import logoBanner from '../../assets/logo_banner.svg';
import logoOnly from '../../assets/logo_only_background_resaved2.svg';
import '../../styles/MainLogo.css';

const MainLogo = () => {
   const { isMobile, toggleSidebar } = useSidebar();

   const handleLogoClick = () => {
      if (isMobile) {
         toggleSidebar();
      }
   };

   return (
      <div 
         className={`main-logo ${isMobile ? 'clickable' : ''}`}
         onClick={handleLogoClick}
      >
         <img 
            src={isMobile ? logoOnly : logoBanner}
            alt="Naja Admin Logo"
            className={`logo-image ${isMobile ? 'logo-mobile' : 'logo-desktop'}`}
         />
      </div>
   );
};

export default MainLogo;
