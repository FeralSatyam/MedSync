import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Navbar({ hasAlerts = false }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const initials = (user?.name || 'MS')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  function handleSignOut() {
    logout();
    localStorage.removeItem('medsync-auth');
    navigate('/login');
  }

  return (
    <header className="sticky top-0 z-[100] flex h-[64px] items-center justify-between border-b border-border bg-card px-[24px]">
      <div className="flex items-center gap-[12px]">
        <div className="flex h-[36px] w-[36px] items-center justify-center rounded-[12px] bg-mint">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="font-display text-[16px] font-bold tracking-[-0.3px] text-navy">MedSync</div>
      </div>

      <div className="flex items-center gap-[12px]">
        {/* Notification bell */}
        <div className="relative">
          <button
            type="button"
            className="flex h-[38px] w-[38px] items-center justify-center rounded-[12px] border border-border bg-card cursor-pointer transition-colors hover:bg-faint"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                stroke="#1a2540"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M13.73 21a2 2 0 0 1-3.46 0"
                stroke="#1a2540"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {hasAlerts ? (
            <span
              aria-hidden="true"
              className="absolute top-[6px] right-[6px] h-[8px] w-[8px] rounded-full bg-red border-[2px] border-card"
            />
          ) : null}
        </div>

        {/* User avatar */}
        <div
          className="flex h-[38px] w-[38px] items-center justify-center rounded-[12px] bg-mint font-display text-[12px] font-bold tracking-[0.5px] text-white"
          aria-label="User avatar"
        >
          {initials}
        </div>

        {/* User name */}
        <div className="hidden sm:block text-[13px] font-semibold text-navy font-body ml-1">
          {user?.name}
        </div>

        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="hidden sm:block rounded-[12px] border border-border bg-transparent px-[14px] py-[8px] text-[12px] font-semibold text-muted cursor-pointer transition-all hover:bg-faint hover:text-navy hover:border-navy font-body"
        >
          Profile
        </button>

        {/* Sign out button */}
        <button
          type="button"
          onClick={handleSignOut}
          className="hidden sm:block rounded-[12px] border border-border bg-transparent px-[14px] py-[8px] text-[12px] font-semibold text-muted cursor-pointer transition-all hover:bg-red-light hover:text-red hover:border-red-light font-body"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
