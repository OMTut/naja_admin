import TypewriterText from './TypewriterText';

const MainLogo = () => {
   const asciiArt = `    _   __        _           ______     __      __         
   / | / /___ _  (_)___ _    / ____/____/ /_  __/_/         
  /  |/ / __ \`/ / / __ \`/   / __/ / ___/ __ \\/ __ \\         
 / /|  / /_/ / / / /_/ /   / /___/ /__/ / / / /_/ /         
/_/ |_/\\__,_/_/ /\\__,_/   /_____/\\___/_/ /_/\\____/          
           /___/                                            `;

   return (
      <div className="logo">
         <TypewriterText
            text={asciiArt}
            speed={15}
            cursorChar="█"
            cursorBlinkRate={500}
            preserveLineBreaks={true}
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

               </pre>
            )}
         </TypewriterText>
      </div>
   );
};

export default MainLogo;