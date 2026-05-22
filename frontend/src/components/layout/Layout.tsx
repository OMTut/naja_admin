import { type ReactNode } from 'react';
import { AppShell } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Sidebar from '../ui/Sidebar';
import TopBar from '../ui/TopBar';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [opened, { toggle, close }] = useDisclosure();

  return (
    <AppShell
      header={{ height: 80 }}
      navbar={{ width: 72, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      bg="#0E2226"
    >
      <AppShell.Header bg="#0E2226" style={{ borderBottom: '1px solid rgba(0, 255, 0, 0.2)' }}>
        <TopBar opened={opened} toggle={toggle} />
      </AppShell.Header>

      <AppShell.Navbar bg="#0A1B1F" style={{ borderRight: '1px solid rgba(0, 255, 0, 0.2)' }}>
        <Sidebar onNavigate={close} />
      </AppShell.Navbar>

      <AppShell.Main bg="#0E2226">
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
          {children}
        </div>
      </AppShell.Main>
    </AppShell>
  );
};

export default Layout;
