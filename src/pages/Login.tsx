import { useState } from 'react';
import './Login.css';

interface LoginProps {
  onAnonymousSignIn: (name: string) => Promise<{ error: any }>;
}

export const Login: React.FC<LoginProps> = ({ onAnonymousSignIn }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError('');
    setLoading(true);
    const result = await onAnonymousSignIn(name.trim());
    if (result.error) {
      setError(result.error?.message || 'Ошибка авторизации');
    }
    setLoading(false);
  };

  return (
    <div className="login">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">Жив, цел<span>-</span>Зарплата</div>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          <input
            className="login-input"
            type="text"
            placeholder="твоё имя"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
            required
          />
          {error && <div className="login-error">{error}</div>}
          <button className="login-btn" type="submit" disabled={loading || !name.trim()}>
            {loading ? '...' : 'войти'}
          </button>
        </form>
      </div>
    </div>
  );
};