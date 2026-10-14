import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { getCurrentUser, logoutUser } from '../api/authStorage';
import type { UserProfile } from '../api/authStorage';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => getCurrentUser());

  useEffect(() => {
    function handleAuthChange() {
      setCurrentUser(getCurrentUser());
    }

    window.addEventListener('auth-change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  function handleLogout() {
    logoutUser();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Laser Feedback Interferometry</p>
          <h1>LFI Data Management Dashboard</h1>
        </div>
        <nav className="nav-links" aria-label="Main navigation">
          <NavLink to="/">Dashboard</NavLink>
          <NavLink to="/datasets">Datasets</NavLink>
          <NavLink to="/import">Import</NavLink>
          <NavLink to="/profile">Profile</NavLink>
          {currentUser ? (
            <button className="nav-button" type="button" onClick={handleLogout}>Logout</button>
          ) : (
            <NavLink to="/login">Login</NavLink>
          )}
        </nav>
      </header>
      <main className="page-content">{children}</main>
    </div>
  );
}
