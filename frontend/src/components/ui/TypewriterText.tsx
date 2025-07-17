import { type ReactNode } from 'react';
import { useTypewriter } from '../../hooks/useTypewriter';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  cursorBlinkRate?: number;
  cursorChar?: string;
  className?: string;
  preserveLineBreaks?: boolean;
  hideCursorAfterComplete?: boolean;
  children?: (props: { displayedText: string; cursor: ReactNode }) => ReactNode;
}

const TypewriterText = ({
  text,
  speed = 50,
  cursorBlinkRate = 500,
  cursorChar = '_',
  className,
  preserveLineBreaks = false,
  hideCursorAfterComplete = false,
  children
}: TypewriterTextProps) => {
  const { displayedText, isTyping, showCursor } = useTypewriter({
    text,
    speed,
    cursorBlinkRate
  });

  const cursor = (
    <span style={{
      opacity: (isTyping || (showCursor && !(hideCursorAfterComplete && !isTyping))) ? 1 : 0,
      transition: 'opacity 0.1s'
    }}>
      {cursorChar}
    </span>
  );

  // If children render prop is provided, use it
  if (children) {
    return <>{children({ displayedText, cursor })}</>;
  }

  // Default render
  if (preserveLineBreaks) {
    return (
      <span className={className}>
        {displayedText.split('\n').map((line, index, array) => (
          <span key={index}>
            {line}
            {index < array.length - 1 && <br />}
          </span>
        ))}
        {cursor}
      </span>
    );
  }

  return (
    <span className={className}>
      {displayedText}
      {cursor}
    </span>
  );
};

export default TypewriterText;

