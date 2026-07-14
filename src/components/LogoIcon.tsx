import React from 'react';

interface LogoIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export default function LogoIcon({ className, ...props }: LogoIconProps) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className} 
      {...props}
    >
      {/* Magnifying Glass Handle - rustic sand-brown hex */}
      <path d="M 68 68 L 90 90" stroke="#b4aba4" strokeWidth="10" strokeLinecap="round" />
      <circle cx="85" cy="85" r="3" fill="#8ba884" />
      {/* Magnifying Glass Frame - warm gray wood */}
      <circle cx="45" cy="45" r="30" fill="none" stroke="#5d514a" strokeWidth="6" />
      {/* Inside Reflection */}
      <circle cx="45" cy="45" r="27" fill="#f4f6f3" />
      {/* Maple Leaf - pastel olive green */}
      <path 
        d="M 45 22 L 49 32 L 58 30 L 53 38 L 63 43 L 52 47 L 54 57 L 45 51 L 36 57 L 38 47 L 27 43 L 37 38 L 32 30 L 41 32 Z" 
        fill="#8ba884" 
      />
      <path d="M 45 51 L 45 61" stroke="#5d514a" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
