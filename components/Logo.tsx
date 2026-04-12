
import React from 'react';

interface LogoProps {
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ size = 48 }) => {
  return (
    <div 
      className="relative flex items-center justify-center overflow-hidden rounded-lg"
      style={{ 
        width: size, 
        height: size,
      }}
    >
      <img 
        src="/logo.jpg" 
        alt="CovaScore"
        className="w-full h-full object-cover"
      />
    </div>
  );
};
