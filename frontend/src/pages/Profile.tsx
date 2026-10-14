import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser, getRegisteredUser, logoutUser } from '../api/authStorage';

export default function Profile() {
  const navigate = useNavigate();
  const profile = getCurrentUser() ?? getRegisteredUser();

  function handleLogout() {
    logoutUser();
    navigate('/login');
  }

  if (!profile) {
    return (
      <div className="auth-page">
        <section className="auth-panel">
          <p className="section-kicker">Personal information</p>
          <h2>Profile</h2>
          <p className="auth-intro">Please log in or register to view your account details.</p>
          <div className="hero-actions">
            <Link className="button primary" to="/login">Login</Link>
            <Link className="button secondary" to="/register">Register now</Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="page-heading with-action">
        <div>
          <p className="section-kicker">Personal information</p>
          <h2>Researcher Profile</h2>
          <p>Manage the account information used by this local dashboard prototype.</p>
        </div>
        <button className="button secondary" type="button" onClick={handleLogout}>Logout</button>
      </section>

      <section className="panel profile-panel">
        <div className="profile-avatar" aria-hidden="true">
          {profile.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3>{profile.username}</h3>
          <p>{profile.role}</p>
        </div>
      </section>

      <section className="panel">
        <h2>Account Details</h2>
        <dl className="info-grid">
          <div>
            <dt>Username</dt>
            <dd>{profile.username}</dd>
          </div>
          <div>
            <dt>School</dt>
            <dd>{profile.school}</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>{profile.role}</dd>
          </div>
          <div>
            <dt>Research area</dt>
            <dd>{profile.researchArea}</dd>
          </div>
          <div>
            <dt>Workspace</dt>
            <dd>LFI Data Management Dashboard</dd>
          </div>
          <div>
            <dt>Authentication</dt>
            <dd>Local prototype only</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
