import { ReactNode } from 'react';
import Header from './Header';
import Toast from './Toast';
import PointsFlyUp from './PointsFlyUp';

interface ScreenShellProps {
  children: ReactNode;
  hideHeader?: boolean;
  hideNav?: boolean;
  className?: string;
}

export default function ScreenShell({ children, hideHeader, hideNav, className = '' }: ScreenShellProps) {
  return (
    <div className={`h-[100dvh] max-w-[430px] mx-auto relative flex flex-col overflow-hidden ${className}`}>
      {!hideHeader && <Header />}
      <main className="flex-1 min-h-0 overflow-y-auto pb-24">
        {children}
      </main>
            <Toast />
      <PointsFlyUp />
    </div>
  );
}
