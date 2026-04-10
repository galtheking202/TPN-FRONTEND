
import React, { useState } from 'react';

export interface User {
  name: string;
  email: string;
  initials: string;
}

interface LoginModalProps {
  onLogin: (user: User) => void;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onLogin, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegister, setIsRegister] = useState(false);

  const makeUser = (displayName: string, userEmail: string): User => {
    const initials = displayName.replace(/\s+/g, ' ').trim().split(' ')
      .map(w => w[0]).join('').slice(0, 2).toUpperCase();
    return { name: displayName, email: userEmail, initials };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const displayName = name.trim() || email.split('@')[0];
    const user = makeUser(displayName, email);
    localStorage.setItem('tpn_user', JSON.stringify(user));
    onLogin(user);
  };

  const handleSocial = (provider: 'google' | 'github') => {
    const user = makeUser(
      provider === 'google' ? 'Google User' : 'GitHub User',
      provider === 'google' ? 'user@gmail.com' : 'user@github.com'
    );
    localStorage.setItem('tpn_user', JSON.stringify(user));
    onLogin(user);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-[#1E1A14]/60 backdrop-blur-sm" />
      <div
        className="relative bg-[#FAF7F0] border border-[#EDEAE3] w-full max-w-sm mx-4 p-10"
        onClick={e => e.stopPropagation()}
      >
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="font-black tracking-tighter text-[#1E1A14] italic text-4xl leading-none">nowvx</div>
        </div>

        <p className="text-center text-sm text-[#1E1A14]/50 mb-6 leading-relaxed">
          {isRegister ? 'Create an account to personalize your experience' : 'Sign in to personalize your experience'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          {isRegister && (
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-2.5 bg-[#EDEAE3] border border-[#D4A843]/30 text-[#1E1A14] placeholder-[#1E1A14]/40 focus:outline-none focus:ring-2 focus:ring-[#D4A843] text-sm"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email address"
            required
            className="w-full px-4 py-2.5 bg-[#EDEAE3] border border-[#D4A843]/30 text-[#1E1A14] placeholder-[#1E1A14]/40 focus:outline-none focus:ring-2 focus:ring-[#D4A843] text-sm"
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full px-4 py-2.5 bg-[#EDEAE3] border border-[#D4A843]/30 text-[#1E1A14] placeholder-[#1E1A14]/40 focus:outline-none focus:ring-2 focus:ring-[#D4A843] text-sm"
          />
          <button
            type="submit"
            className="w-full py-3 bg-[#D4A843] text-[#1E1A14] font-black tracking-widest uppercase text-xs hover:bg-[#c4983a] transition-colors mt-1"
          >
            {isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 h-px bg-[#EDEAE3]" />
          <span className="text-[10px] text-[#1E1A14]/40 font-bold tracking-widest uppercase">or</span>
          <div className="flex-1 h-px bg-[#EDEAE3]" />
        </div>

        <div className="space-y-2">
          <button
            onClick={() => handleSocial('google')}
            className="w-full py-2.5 border border-[#EDEAE3] text-[#1E1A14]/60 text-xs font-bold tracking-widest uppercase hover:border-[#D4A843]/60 hover:text-[#1E1A14] transition-all flex items-center justify-center gap-3"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
          <button
            onClick={() => handleSocial('github')}
            className="w-full py-2.5 border border-[#EDEAE3] text-[#1E1A14]/60 text-xs font-bold tracking-widest uppercase hover:border-[#D4A843]/60 hover:text-[#1E1A14] transition-all flex items-center justify-center gap-3"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
            Continue with GitHub
          </button>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-[10px] text-[#D4A843] font-bold tracking-widest uppercase hover:underline"
          >
            {isRegister ? 'Already have an account? Sign in' : 'New here? Register'}
          </button>
        </div>

        <div className="mt-6 pt-5 border-t border-[#EDEAE3] text-center">
          <button
            onClick={onClose}
            className="text-[10px] text-[#1E1A14]/40 font-bold tracking-widest uppercase hover:text-[#1E1A14]/60 transition-colors"
          >
            × Continue browsing as guest
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
