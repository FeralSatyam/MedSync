import { useNavigate, useLocation } from 'react-router-dom';

const NavIcons = {
  Home: ({ active = false }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 9L12 3L21 9V20H3V9Z" stroke="currentColor" strokeWidth="1.5" fill={active ? 'currentColor' : 'none'} />
      <path d="M9 20V12H15V20" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  ),

  AIHealth: ({ active = false }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2c-3 0-5 2-5 5 0 1.5.5 2.5 1 3.5-1 1-2 2.5-2 4.5 0 3 2 5 5 5s5-2 5-5c0-2-1-3.5-2-4.5.5-1 1-2 1-3.5 0-3-2-5-5-5z" stroke="currentColor" strokeWidth="1.5" fill={active ? 'currentColor' : 'none'} />
      <path d="M12 7v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 9l8 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 13l8-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),

  Orders: ({ active = false }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 2L3 6V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V6L18 2H6Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? '0.1' : '0'} />
      <path d="M3 6H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 10C16 12.2 14.2 14 12 14C9.8 14 8 12.2 8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),

  Profile: ({ active = false }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" fill={active ? 'currentColor' : 'none'} />
      <path d="M5 20V19C5 15.7 7.7 13 11 13H13C16.3 13 19 15.7 19 19V20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),

  QRWhite: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="7" height="7" rx="1" stroke="white" strokeWidth="1.5" fill="none" />
      <rect x="14" y="3" width="7" height="7" rx="1" stroke="white" strokeWidth="1.5" fill="none" />
      <rect x="3" y="14" width="7" height="7" rx="1" stroke="white" strokeWidth="1.5" fill="none" />
      <rect x="14" y="14" width="3" height="3" rx="0.5" fill="white" />
      <rect x="18" y="18" width="3" height="3" rx="0.5" fill="white" />
    </svg>
  ),
};

const TABS = [
  { id: 'home', label: 'Home', icon: NavIcons.Home, path: '/' },
  { id: 'ai-health', label: 'AI Health', icon: NavIcons.AIHealth, path: '/ai-health' },
  { id: 'orders', label: 'Orders', icon: NavIcons.Orders, path: '/pharmacy' },
  { id: 'profile', label: 'Profile', icon: NavIcons.Profile, path: '/profile' },
];

function getActiveTab(pathname) {
  if (pathname === '/' || pathname === '/dashboard') return 'home';
  if (pathname === '/ai-health') return 'ai-health';
  if (pathname === '/pharmacy' || pathname === '/orders') return 'orders';
  if (pathname === '/profile') return 'profile';
  return '';
}

export default function MobileBottomNav({ showQR = false, onQRPress }) {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = getActiveTab(location.pathname);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border z-40 lg:hidden px-2 pt-3 pb-4">
      <div className="flex justify-around items-center relative">
        {showQR ? (
          <>
            {TABS.slice(0, 2).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.path)}
                  className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-colors ${isActive ? 'text-mint' : 'text-[#9CA3AF]'}`}
                >
                  <Icon active={isActive} />
                  <span className="text-xs font-medium">{tab.label}</span>
                </button>
              );
            })}

            {/* Floating QR button (dashboard only) */}
            <div className="w-14 h-14 flex-shrink-0" />
            <button
              onClick={onQRPress}
              className="w-14 h-14 rounded-full bg-mint shadow-qr border-4 border-bg flex items-center justify-center hover:opacity-90 absolute -top-7 left-1/2 -translate-x-1/2 z-50"
            >
              <NavIcons.QRWhite />
            </button>

            {TABS.slice(2).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.path)}
                  className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-colors ${isActive ? 'text-mint' : 'text-[#9CA3AF]'}`}
                >
                  <Icon active={isActive} />
                  <span className="text-xs font-medium">{tab.label}</span>
                </button>
              );
            })}
          </>
        ) : (
          TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-colors ${isActive ? 'text-mint' : 'text-[#9CA3AF]'}`}
              >
                <Icon active={isActive} />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
