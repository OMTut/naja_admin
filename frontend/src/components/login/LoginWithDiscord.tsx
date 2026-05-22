import React, { useState, useEffect } from 'react';
import { Stack, Button, Text } from '@mantine/core';
import logoBanner from '../../assets/logo_banner.svg';
import TypewriterText from '../ui/TypewriterText';
import '../../styles/MainLogo.css';

interface LoginWithDiscordProps {
  message?: {
    type: 'success' | 'error' | 'info';
    message: string;
  } | null;
}

const MESSAGE_COLORS = { success: '#CCAC31', error: '#ff4444', info: '#265D73' };

const REQUIREMENTS = `Terminal Requirements:
  — Must have a Discord account.
  — Must be registered with the server.
  — Terminal privileges are dependent upon approval.`;

const LoginWithDiscord: React.FC<LoginWithDiscordProps> = ({ message }) => {
  const [showRequirements, setShowRequirements] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowRequirements(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = () => {
    const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_DISCORD_REDIRECT_URI;
    const scope = import.meta.env.VITE_DISCORD_SCOPE;
    const url = `https://discord.com/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
    window.location.href = url;
  };

  return (
    <Stack align="center" gap="xl" style={{ padding: '40px 20px' }}>
      {!message && (
        <>
          <div className="main-logo">
            <img src={logoBanner} alt="Naja Admin Logo" className="logo-image logo-desktop" />
          </div>

          {showRequirements && (
            <Text style={{ color: '#DDD3BA', maxWidth: 420, textAlign: 'left', lineHeight: 1.8 }}>
              <TypewriterText
                text={REQUIREMENTS}
                preserveLineBreaks={true}
                speed={20}
              />
            </Text>
          )}
        </>
      )}

      {message && (
        <Text size="lg" style={{ color: MESSAGE_COLORS[message.type] || '#DDD3BA', maxWidth: 420 }}>
          <TypewriterText
            text={message.message}
            speed={12}
            cursorBlinkRate={500}
            cursorChar="_"
          />
        </Text>
      )}

      <Button
        onClick={handleLogin}
        variant="outline"
        size="md"
        style={{
          borderColor: '#CCAC31',
          color: '#CCAC31',
          minWidth: 220,
          letterSpacing: '0.05em',
        }}
      >
        Login with Discord
      </Button>
    </Stack>
  );
};

export default LoginWithDiscord;
