import { useLocation, useNavigate } from 'react-router-dom';

const tabs = [
  { to: '/farm', icon: 'spa', label: 'Nông trại' },
  { to: '/shop', icon: 'storefront', label: 'Cửa hàng' },
  { to: '/inventory', icon: 'inventory_2', label: 'Kho đồ' },
  { to: '/profile', icon: 'person', label: 'Hồ sơ' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[94%] max-w-md z-50">
      {/* Wooden background */}
      <div className="absolute inset-0 bg-[#DEB887] rounded-full border-4 border-[#8B4513] shadow-[0_8px_0_#5D4037,0_15px_20px_rgba(0,0,0,0.3)] wood-pattern-v1" />
      {/* Decorative wooden knots */}
      <div className="absolute top-1/2 left-2 w-2 h-2 bg-[#5D4037] rounded-full transform -translate-y-1/2 shadow-inner" />
      <div className="absolute top-1/2 right-2 w-2 h-2 bg-[#5D4037] rounded-full transform -translate-y-1/2 shadow-inner" />

      <div className="relative flex justify-between items-center px-4 py-3">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.to;

          return (
            <button
              key={tab.to}
              onClick={() => navigate(tab.to)}
              className={`flex flex-col items-center gap-1 w-12 group ${
                isActive ? '' : 'opacity-70 hover:opacity-100 transition-opacity'
              }`}
            >
              {isActive ? (
                <div className="w-10 h-10 rounded-full bg-[#8B4513] border-2 border-[#DEB887] flex items-center justify-center shadow-inner transform -translate-y-2 transition-all duration-200">
                  <span className="material-symbols-outlined text-[#90EE90] text-xl">{tab.icon}</span>
                </div>
              ) : (
                <div className="w-8 h-8 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#8B4513] text-2xl group-hover:scale-110 transition-transform">{tab.icon}</span>
                </div>
              )}
              <span className={`text-[8px] font-bold ${
                isActive ? 'font-black text-[#5D4037] uppercase tracking-tighter' : 'text-[#8B4513]'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
