import { Tooltip, UnstyledButton, Stack, Box, Text } from '@mantine/core';
import {
  IconHome,
  IconLayoutDashboard,
  IconUsers,
  IconKey,
  IconBooks,
  IconPackage,
} from '@tabler/icons-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';

interface SidebarProps {
  onNavigate?: () => void;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.FC<{ size?: number; stroke?: number }>;
  requiredRoles?: string[];
  showOnlyUnder?: string;
}

const navItems: NavItem[] = [
  { path: '/',              label: 'Home',            icon: IconHome },
  { path: '/blueprints',    label: 'Blueprints',      icon: IconBooks },
  { path: '/inventory',    label: 'Inventory',        icon: IconPackage },
  { path: '/admin',         label: 'Admin Dashboard', icon: IconLayoutDashboard,  requiredRoles: ['Role 1', 'App Admin'] },
  { path: '/admin/users',   label: 'User Management', icon: IconUsers,            requiredRoles: ['Role 1', 'App Admin'], showOnlyUnder: '/admin' },
  { path: '/admin/roles',   label: 'Role Management', icon: IconKey,              requiredRoles: ['Role 1', 'App Admin'], showOnlyUnder: '/admin' },
];

interface NavIconProps {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}

const NavIcon = ({ item, active, onClick }: NavIconProps) => (
  <Tooltip label={item.label} position="right" withArrow arrowSize={6}
    styles={{
      tooltip: {
        backgroundColor: '#0A1B1F',
        color: '#CCAC31',
        border: '1px solid rgba(204, 172, 49, 0.3)',
        fontFamily: "'Vollkorn', serif",
        fontSize: '14px',
      },
      arrow: { borderColor: 'rgba(204, 172, 49, 0.3)' },
    }}
  >
    <UnstyledButton
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
        borderRadius: 6,
        color: active ? '#CCAC31' : '#DDD3BA',
        backgroundColor: active ? 'rgba(204, 172, 49, 0.15)' : 'transparent',
        borderLeft: active ? '2px solid #CCAC31' : '2px solid transparent',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(38, 93, 115, 0.2)';
          (e.currentTarget as HTMLButtonElement).style.color = '#CCAC31';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
          (e.currentTarget as HTMLButtonElement).style.color = '#DDD3BA';
        }
      }}
    >
      <item.icon size={22} stroke={1.5} />
    </UnstyledButton>
  </Tooltip>
);

const GIBBS_HEALTH_URL = import.meta.env.VITE_GIBBS_HEALTH_URL as string;
const POLL_INTERVAL_MS = Number(import.meta.env.VITE_GIBBS_POLL_INTERVAL_MS) || 30000;

const Sidebar = ({ onNavigate }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const userRoles = user?.roles ?? [];
  const [gibbsOnline, setGibbsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(GIBBS_HEALTH_URL, { credentials: 'include', signal: AbortSignal.timeout(5000) });
        setGibbsOnline(res.ok);
      } catch {
        setGibbsOnline(false);
      }
    };
    check();
    const id = setInterval(check, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const handleNav = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', paddingTop: '16px' }}>
      <Stack gap="xs" align="center" style={{ flex: 1 }}>
        {navItems
          .filter(item => !item.requiredRoles || item.requiredRoles.some(r => userRoles.includes(r)))
          .filter(item => !item.showOnlyUnder || location.pathname.startsWith(item.showOnlyUnder))
          .map((item) => (
            <NavIcon
              key={item.path}
              item={item}
              active={isActive(item.path)}
              onClick={() => handleNav(item.path)}
            />
          ))}
      </Stack>

      <Box pb="md">
        <Tooltip
          label={gibbsOnline === null ? 'Gibbs: Checking...' : gibbsOnline ? 'Gibbs: Online' : 'Gibbs: Offline'}
          position="right"
          withArrow
          styles={{
            tooltip: { backgroundColor: '#0A1B1F', color: '#CCAC31', border: '1px solid rgba(204, 172, 49, 0.3)', fontFamily: "'Vollkorn', serif" },
          }}
        >
          <Text size="xs" style={{ color: '#265D73', cursor: 'default' }}>
            <span style={{
              animation: gibbsOnline ? 'pulse 2s infinite' : undefined,
              display: 'inline-block',
              color: gibbsOnline === null ? '#265D73' : gibbsOnline ? '#CCAC31' : '#C0392B',
            }}>●</span>
          </Text>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default Sidebar;
