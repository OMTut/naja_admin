import TypewriterText from './TypewriterText';

export const logoText = `    _   __        _           ______     __      __         
   / | / /___ _  (_)___ _    / ____/____/ /_  __/_/         
  /  |/ / __ \`/ / / __ \`/   / __/ / ___/ __ \\/ __ \\         
 / /|  / /_/ / / / /_/ /   / /___/ /__/ / / / /_/ /         
/_/ |_/\\__,_/_/ /\\__,_/   /_____/\\___/_/ /_/\\____/          
           /___/                                            `;

export const logoTypingTime = logoText.length * 30; // 30ms per character

const MainLogo = () => {
   return (
      <div className="logo">
         <TypewriterText
            text={logoText}
            speed={12}
            cursorChar="_"
            cursorBlinkRate={500}
            preserveLineBreaks={true}
            hideCursorAfterComplete={true}
         >
            {({ displayedText, cursor }) => (
               <pre style={{
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  lineHeight: '1.2',
                  margin: 0,
                  whiteSpace: 'pre'
               }}>
                  {displayedText.split('\n').map((line, index, array) => (
                     <span key={index}>
                        {line}
                        {index < array.length - 1 && '\n'}
                     </span>
                  ))}
                  {cursor}
               </pre>
            )}
         </TypewriterText>
      </div>
   );
};

export default MainLogo;
