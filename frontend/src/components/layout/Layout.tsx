import { type ReactNode } from 'react';
import { SidebarProvider } from '../../contexts/SidebarContext';
import Sidebar from '../ui/Sidebar';
import TopBar from '../ui/TopBar';
import '../../styles/Layout.css';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <SidebarProvider>
      <div className="app-layout">
        <TopBar />
        <div className="layout-body">
          <Sidebar />
          <main className="main-content">
            <div className="content-wrapper">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};


export default Layout;