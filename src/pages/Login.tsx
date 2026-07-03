import { useState } from 'react';
import './Login.css';

interface LoginProps {
  onSignUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  onSignIn: (email: string, password: string) => Promise<{ error: any }>;
}

export const Login: React.FC<LoginProps> = ({ onSignUp, onSignIn }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = isSignUp
      ? await onSignUp(email, password, name)
      : await onSignIn(email, password);

    if (result.error) {
      setError(result.error.message);
    }
    setLoading(false);
  };

  return (
    <div className="login">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">SALARY<span>.</span>SYS</div>
          <div className="login-subtitle">{isSignUp ? 'создать аккаунт' : 'войти'}</div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {isSignUp && (
            <input
              className="login-input"
              type="text"
              placeholder="имя"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          )}
          <input
            className="login-input"
            type="email"
            placeholder="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            className="login-input"
            type="password"
            placeholder="пароль"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
          />

          {error && <div className="login-error">{error}</div>}

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? '...' : isSignUp ? 'зарегистрироваться' : 'войти'}
          </button>
        </form>

        <button className="login-toggle" onClick={() => setIsSignUp(!isSignUp)}>
          {isSignUp ? 'уже есть аккаунт? войти' : 'нет аккаунта? зарегистрироваться'}
        </button>
      </div>
    </div>
  );
};
