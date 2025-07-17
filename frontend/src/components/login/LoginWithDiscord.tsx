import React, { useState, useEffect } from 'react';
import MainLogo from '../ui/MainLogo';
import TypewriterText from '../ui/TypewriterText';
//import SequentialTypewriter from '../ui/SequentialTypewriter';

interface LoginWithDiscordProps {
  message?: {
    type: 'success' | 'error' | 'info';
    message: string;
  } | null;
}

const LoginWithDiscord: React.FC<LoginWithDiscordProps> = ({ message }) => {
    const [showRequirements, setShowRequirements] = useState(false);
    
    // Calculate when logo should finish typing
    const logoText = `    _   __        _           ______     __      __         
   / | / /___ _  (_)___ _    / ____/____/ /_  __/_/         
  /  |/ / __ \`/ / / __ \`/   / __/ / ___/ __ \\/ __ \\         
 / /|  / /_/ / / / /_/ /   / /___/ /__/ / / / /_/ /         
/_/ |_/\\__,_/_/ /\\__,_/   /_____/\\___/_/ /_/\\____/          
           /___/                                            `;
    
    const logoTypingTime = logoText.length * 15; // 30ms per character (from MainLogo speed)
    
    useEffect(() => {
        // Show requirements text after logo finishes typing + small delay
        const timer = setTimeout(() => {
            setShowRequirements(true);
        }, logoTypingTime + 500); // 500ms delay after logo completes
        
        return () => clearTimeout(timer);
    }, [logoTypingTime]);
    
    const handleLogin = () => {
        const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID;
        const redirectUri = import.meta.env.VITE_DISCORD_REDIRECT_URI;
        const scope = import.meta.env.VITE_DISCORD_SCOPE;
        const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;

        window.location.href = discordAuthUrl;
        console.log('Redirecting to Discord for login...');
    };

    return (
        <>
        {!message && (
            <>
            <MainLogo />
            {showRequirements && (
                <div className="login-requirement">
                    <TypewriterText 
                        text={`Terminal Requirments:
                        - Must have a Discord account.
                        - Must be registered with the server.
                        - Terminal privileges are dependent upon approval.`}
                        preserveLineBreaks={true}
                        speed={20}
                        />
                </div>
            )}
            </>
        )}
        <div className="message-response">
            {message && (
                <h2>
                    <TypewriterText 
                        text={message.message}
                        speed={12}
                        cursorBlinkRate={500}
                        cursorChar="_"
                    />
                </h2>
            )}
        </div>
        <div className="discord-login">
            <button onClick={handleLogin}>
                Login with Discord
            </button>
        </div>
        </>
    );
}

export default LoginWithDiscord;