import React from 'react';
import btgLogo from '../pictures/BTG logo.png';

interface LogoIconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
}

export default function LogoIcon({ className, ...props }: LogoIconProps) {
  return (
    <img 
      src={btgLogo} 
      alt="BTG Logo" 
      className={`${className || ''} object-contain mix-blend-multiply`} 
      referrerPolicy="no-referrer"
      {...props}
    />
  );
}
