import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { saveRegisteredUser } from '../api/authStorage';

export default function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [school, setSchool] = useState('University of Queensland');
  const [researchArea, setResearchArea] = useState('Laser Feedback Interferometry');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!username.trim() || !school.trim() || !password || !confirmPassword) {
      setMessage('Please complete all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    saveRegisteredUser({
      username: username.trim(),
      school: school.trim(),
      role: 'Research student',
      researchArea: researchArea.trim() || 'Laser Feedback Interferometry'
    });
    navigate('/login', {
      state: {
        message: 'Registration successful. Please log in with your new account.'
      }
    });
  }

  return (
    <div className="auth-page">
      <section className="auth-panel">
        <p className="section-kicker">Create researcher access</p>
        <h2>Register</h2>
        <p className="auth-intro">Create an account placeholder for the LFI dashboard prototype.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Username
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Choose username"
              autoComplete="username"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Choose password"
              autoComplete="new-password"
            />
          </label>

          <label>
            School
            <input
              type="text"
              value={school}
              onChange={(event) => setSchool(event.target.value)}
              placeholder="Enter school or university"
              autoComplete="organization"
            />
          </label>

          <label>
            Research area
            <input
              type="text"
              value={researchArea}
              onChange={(event) => setResearchArea(event.target.value)}
              placeholder="Enter research area"
            />
          </label>

          <label>
            Confirm password
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm password"
              autoComplete="new-password"
            />
          </label>

          <button className="button primary full-width" type="submit">Register</button>
        </form>

        {message && <p className="notice auth-notice">{message}</p>}

        <p className="auth-switch">
          Already have an account? <Link to="/login">Back to login</Link>
        </p>
      </section>
    </div>
  );
}
