import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { logout as logoutApi } from '../api/authApi';

export default function Navbar() {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();
  const initials = (user?.name || 'SS')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLowerCase())
    .join('');

  async function handleLogout() {
    try {
      await logoutApi();
    } finally {
      clearAuth();
      navigate('/login');
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link to="/dashboard" className="text-xl font-bold tracking-tight text-teal-600">
          MedSync
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm md:gap-5">
          {user && (
            <>
              <Link to="/dashboard" className="font-medium text-slate-700 transition hover:text-teal-700">
                Dashboard
              </Link>
              <Link to="/patients" className="font-medium text-slate-700 transition hover:text-teal-700">
                Family profiles
              </Link>
              <div
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-700"
                aria-label="User initials"
                title={user.name}
              >
                {initials}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg px-2 py-1 text-gray-600 transition hover:text-gray-900"
              >
                Log out
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
