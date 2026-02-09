import { ReactNode } from 'react';
import Header from './Header';
import BottomNav from './BottomNav';
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
    <div className="min-h-screen max-w-[430px] mx-auto relative">
      {!hideHeader && <Header ogn={1250} userName="Nông dân" />}
      <main className={`pb-20 ${hideHeader ? '' : ''} ${className}`}>
        {children}
      </main>
      {!hideNav && <BottomNav />}
      <Toast />
      <PointsFlyUp />
    </div>
  );
}
