import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/farm', emoji: '🌱', label: 'Nông trại' },
  { to: '/boss', emoji: '⚔️', label: 'Đánh Boss' },
  { to: '/shop', emoji: '🛒', label: 'Cửa hàng' },
  { to: '/profile', emoji: '👤', label: 'Hồ sơ' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border safe-bottom">
      <div className="flex justify-around items-center h-16 max-w-[430px] mx-auto">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-all duration-200 ${
                isActive
                  ? 'text-primary scale-110'
                  : 'text-muted-foreground'
              }`
            }
          >
            <span className="text-2xl">{tab.emoji}</span>
            <span className="text-[10px] font-semibold leading-none">{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
