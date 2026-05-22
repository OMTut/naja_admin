import { Group, Burger, Text, ActionIcon, Tooltip, Menu } from '@mantine/core';
import { IconSettings, IconBell, IconUser, IconLogout, IconUserCircle } from '@tabler/icons-react';
import MainLogo from './MainLogo';
import { useAuth } from '../../hooks';
import { useNavigate } from 'react-router-dom';

interface TopBarProps {
  opened: boolean;
  toggle: () => void;
}

const tooltipStyles = {
  tooltip: {
    backgroundColor: '#0A1B1F',
    color: '#CCAC31',
    border: '1px solid rgba(204, 172, 49, 0.3)',
    fontFamily: "'Vollkorn', serif",
    fontSize: '13px',
  },
};

const simpleActions = [
  { label: 'Settings',      icon: IconSettings },
  { label: 'Notifications', icon: IconBell },
];

const actionIconStyle = { borderColor: '#265D73', color: '#DDD3BA' };
const actionIconHoverOn  = (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = '#CCAC31'; e.currentTarget.style.borderColor = '#CCAC31'; };
const actionIconHoverOff = (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = '#DDD3BA';  e.currentTarget.style.borderColor = '#265D73'; };

const menuStyles = {
  dropdown: { backgroundColor: '#0A1B1F', border: '1px solid rgba(204, 172, 49, 0.3)', padding: '4px' },
  item:     { color: '#DDD3BA', fontFamily: "'Vollkorn', serif", fontSize: '14px' },
};

const TopBar = ({ opened, toggle }: TopBarProps) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Group h="100%" px="md" justify="space-between">
      <Group gap="md">
        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" color="#CCAC31" />
        <MainLogo />
        <Text c="#CCAC31" size="md" style={{ fontFamily: "'Vollkorn', serif", letterSpacing: '0.03em' }}>
          ~/admin
        </Text>
      </Group>

      <Group gap="xs">
        {simpleActions.map(({ label, icon: Icon }) => (
          <Tooltip key={label} label={label} position="bottom" withArrow styles={tooltipStyles}>
            <ActionIcon variant="outline" size="md" style={actionIconStyle}
              onMouseEnter={actionIconHoverOn} onMouseLeave={actionIconHoverOff}>
              <Icon size={18} stroke={1.5} />
            </ActionIcon>
          </Tooltip>
        ))}

        <Menu trigger="hover" position="bottom-end" withArrow arrowSize={8} styles={menuStyles}>
          <Menu.Target>
            <ActionIcon variant="outline" size="md" style={actionIconStyle}
              onMouseEnter={actionIconHoverOn} onMouseLeave={actionIconHoverOff}>
              <IconUser size={18} stroke={1.5} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              leftSection={<IconUserCircle size={15} stroke={1.5} />}
              onClick={() => navigate('/profile')}
            >
              Profile
            </Menu.Item>
            <Menu.Divider style={{ borderColor: 'rgba(204, 172, 49, 0.2)' }} />
            <Menu.Item
              leftSection={<IconLogout size={15} stroke={1.5} />}
              onClick={handleLogout}
              styles={{ item: { ...menuStyles.item, color: '#ff6b6b' } }}
            >
              Logout
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Group>
  );
};

export default TopBar;
