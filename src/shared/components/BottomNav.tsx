import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/farm', emoji: '🌱', label: 'Nông trại' },
  { to: '/boss', emoji: '🐉', label: 'Boss' },
  { to: '/shop', emoji: '🛒', label: 'Cửa hàng' },
  { to: '/profile', emoji: '👤', label: 'Hồ sơ' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-[430px] mx-auto flex gap-1 px-3 py-2 pb-[max(env(safe-area-inset-bottom),20px)]"
        style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
        }}
      >
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-[10px] transition-all duration-200 ${
                isActive ? 'bg-game-green-pale' : ''
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className="text-[22px]">{tab.emoji}</span>
                <span className={`text-[10px] font-bold ${isActive ? 'text-game-green-dark' : 'text-muted-foreground'}`}>
                  {tab.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
