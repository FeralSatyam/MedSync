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
    <header
      className="sticky top-0 z-[100] flex h-[58px] items-center justify-between border-b border-border bg-card px-[28px]"
      style={{ position: 'sticky' }}
    >
      <div className="flex items-center gap-[12px]">
        <div
          className="flex h-[31px] w-[31px] items-center justify-center rounded-[8px]"
          style={{ background: '#0f1f3d' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"
              stroke="#00c896"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="font-display text-[17px] font-bold text-navy">MedSync</div>
      </div>

      <div className="flex items-center gap-[12px]">
        {/* Notification bell */}
        <div className="relative">
          <button
            type="button"
            className="flex h-[35px] w-[35px] items-center justify-center rounded-full border border-border bg-bg cursor-pointer transition-colors hover:bg-[#eef1f8]"
            style={{ background: '#f4f6fb' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                stroke="#6b7a99"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M13.73 21a2 2 0 0 1-3.46 0"
                stroke="#6b7a99"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {hasAlerts ? (
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: 5,
                right: 5,
                width: 7,
                height: 7,
                borderRadius: 999,
                background: '#e84040',
                border: '2px solid #fff',
              }}
            />
          ) : null}
        </div>

        {/* User avatar */}
        <div
          className="flex h-[33px] w-[33px] items-center justify-center rounded-full font-display text-[11px] font-bold text-white"
          style={{ background: '#0f1f3d' }}
          aria-label="User avatar"
        >
          {initials}
        </div>

        {/* User name */}
        <div className="text-[13px] font-medium text-navy" style={{ fontFamily: '"DM Sans", sans-serif' }}>
          {user?.name}
        </div>

        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="rounded-btn border border-border bg-transparent px-[13px] py-[6px] text-[12px] font-medium text-muted cursor-pointer transition-all"
          style={{ color: '#6b7a99', fontFamily: '"DM Sans", sans-serif' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#0f1f3d';
            e.currentTarget.style.borderColor = '#0f1f3d';
            e.currentTarget.style.background = '#f7f9ff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#6b7a99';
            e.currentTarget.style.borderColor = '#e2e8f4';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          Profile
        </button>

        {/* Sign out button */}
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-btn border border-border bg-transparent px-[13px] py-[6px] text-[12px] font-medium text-muted cursor-pointer transition-all"
          style={{
            color: '#6b7a99',
            fontFamily: '"DM Sans", sans-serif',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#e84040';
            e.currentTarget.style.borderColor = '#ffcccc';
            e.currentTarget.style.background = '#fff5f5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#6b7a99';
            e.currentTarget.style.borderColor = '#e2e8f4';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
