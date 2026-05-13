import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
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
          <NavLink to="/about">About</NavLink>
        </nav>
      </header>
      <main className="page-content">{children}</main>
    </div>
  );
}
