import { ReactNode } from 'react';

interface FarmSceneProps {
  children: ReactNode;
}

export default function FarmScene({ children }: FarmSceneProps) {
  return (
    <div className="farm-sky-gradient min-h-[65vh] relative overflow-hidden">
      {/* Clouds */}
      <div className="absolute top-6 animate-cloud-drift opacity-40">
        <span className="text-4xl">☁️</span>
      </div>
      <div className="absolute top-12 animate-cloud-drift opacity-25" style={{ animationDelay: '10s' }}>
        <span className="text-3xl">☁️</span>
      </div>
      <div className="absolute top-20 animate-cloud-drift opacity-20" style={{ animationDelay: '18s' }}>
        <span className="text-2xl">☁️</span>
      </div>

      {/* Sun */}
      <div className="absolute top-4 right-6">
        <span className="text-4xl drop-shadow-lg">☀️</span>
      </div>

      {/* Content */}
      <div className="flex flex-col items-center justify-end min-h-[55vh] pb-4 pt-16 px-4">
        {children}
      </div>
    </div>
  );
}
