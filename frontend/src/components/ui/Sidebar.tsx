import { Tooltip, UnstyledButton, Stack, Box, Text } from '@mantine/core';
import {
  IconHome,
  IconLayoutDashboard,
  IconUsers,
  IconKey,
} from '@tabler/icons-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  onNavigate?: () => void;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.FC<{ size?: number; stroke?: number }>;
}

const navItems: NavItem[] = [
  { path: '/',            label: 'Home',             icon: IconHome },
  { path: '/admin',       label: 'Admin Dashboard',  icon: IconLayoutDashboard },
  { path: '/admin/users', label: 'User Management',  icon: IconUsers },
  { path: '/admin/roles', label: 'Role Management',  icon: IconKey },
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

const Sidebar = ({ onNavigate }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const handleNav = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', paddingTop: '16px' }}>
      <Stack gap="xs" align="center" style={{ flex: 1 }}>
        {navItems.map((item) => (
          <NavIcon
            key={item.path}
            item={item}
            active={isActive(item.path)}
            onClick={() => handleNav(item.path)}
          />
        ))}
      </Stack>

      <Box pb="md">
        <Tooltip label="Connected" position="right" withArrow
          styles={{
            tooltip: { backgroundColor: '#0A1B1F', color: '#CCAC31', border: '1px solid rgba(204, 172, 49, 0.3)', fontFamily: "'Vollkorn', serif" },
          }}
        >
          <Text size="xs" style={{ color: '#265D73', cursor: 'default' }}>
            <span style={{ animation: 'pulse 2s infinite', display: 'inline-block', color: '#CCAC31' }}>●</span>
          </Text>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default Sidebar;
