import { ReactNode } from 'react';

interface MapBackgroundProps {
  className?: string;
  children: ReactNode;
}

export default function MapBackground({ className = '', children }: MapBackgroundProps) {
  return (
    <div className={`relative min-h-screen ${className}`}>
      {/* Tree decorations scattered */}
      <div className="absolute top-[8%] left-[5%] text-3xl opacity-30 pointer-events-none">🌳</div>
      <div className="absolute top-[15%] right-[8%] text-2xl opacity-25 pointer-events-none">🌲</div>
      <div className="absolute top-[30%] left-[3%] text-2xl opacity-20 pointer-events-none">🌴</div>
      <div className="absolute top-[45%] right-[5%] text-3xl opacity-25 pointer-events-none">🌳</div>
      <div className="absolute top-[58%] left-[8%] text-2xl opacity-20 pointer-events-none">🌲</div>
      <div className="absolute top-[72%] right-[3%] text-3xl opacity-25 pointer-events-none">🌴</div>
      <div className="absolute top-[85%] left-[5%] text-2xl opacity-30 pointer-events-none">🌳</div>
      <div className="absolute top-[92%] right-[10%] text-2xl opacity-20 pointer-events-none">🌲</div>

      {/* Content */}
      {children}
    </div>
  );
}
