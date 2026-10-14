import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { loginUser } from '../api/authStorage';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const registerMessage = location.state && typeof location.state === 'object' && 'message' in location.state
    ? String(location.state.message)
    : '';

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!username.trim() || !password) {
      setMessage('Please enter both username and password.');
      return;
    }

    loginUser(username.trim());
    navigate('/');
  }

  return (
    <div className="auth-page">
      <section className="auth-panel">
        <p className="section-kicker">Research workspace access</p>
        <h2>Login</h2>
        <p className="auth-intro">Sign in to access the LFI data management dashboard.</p>
        {registerMessage && <p className="notice success auth-notice">{registerMessage}</p>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Username
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter username"
              autoComplete="username"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </label>

          <button className="button primary full-width" type="submit">Login</button>
        </form>

        {message && <p className="notice auth-notice">{message}</p>}

        <p className="auth-switch">
          Do not have an account? <Link to="/register">Register now</Link>
        </p>
      </section>
    </div>
  );
}
