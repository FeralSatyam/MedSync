import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { logout as logoutApi } from '../api/authApi';

export default function Navbar() {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logoutApi();
    } finally {
      clearAuth();
      navigate('/login');
    }
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/dashboard" className="text-lg font-bold text-teal-700">
          MedSync
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm">
          {user && (
            <>
              <Link to="/dashboard" className="text-slate-700 hover:text-teal-700">
                Dashboard
              </Link>
              <Link to="/patients" className="text-slate-700 hover:text-teal-700">
                Family profiles
              </Link>
              <span className="text-slate-500">{user.name}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-slate-300 px-3 py-1 text-slate-700 hover:bg-slate-50"
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
