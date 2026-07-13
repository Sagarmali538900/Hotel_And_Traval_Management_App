'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Hotel, Truck, LayoutDashboard, Sun, Moon, LogOut } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [theme, setTheme] = useState('dark');
  const [loggingOut, setLoggingOut] = useState(false);

  // Load and apply theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to sign out?')) {
      return;
    }
    
    try {
      setLoggingOut(true);
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        window.location.href = '/login';
      }
    } catch (err) {
      console.error(err);
      alert('Error logging out. Please try again.');
    } finally {
      setLoggingOut(false);
    }
  };

  // Determine if user is on login page
  const isLoginPage = pathname === '/login';

  return (
    <nav className="navbar no-print">
      <div className="nav-brand">
        {isLoginPage ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LayoutDashboard size={24} style={{ stroke: 'url(#brand-grad-login)' }} />
            Hotel & Transport Hub
          </div>
        ) : (
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LayoutDashboard size={24} style={{ stroke: 'url(#brand-grad-login)' }} />
            Hotel & Transport Hub
          </Link>
        )}
        <svg width="0" height="0">
          <linearGradient id="brand-grad-login" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f2fe" />
            <stop offset="100%" stopColor="#4facfe" />
          </linearGradient>
        </svg>
      </div>

      <div className="nav-links">
        {/* Only show navigation and logout if NOT on login page */}
        {!isLoginPage && (
          <>
            <Link 
              href="/" 
              className={`nav-link ${pathname === '/' ? 'active' : ''}`}
            >
              Dashboard
            </Link>
            <Link 
              href="/hotels" 
              className={`nav-link ${pathname === '/hotels' ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Hotel size={16} />
              Hotels
            </Link>
            <Link 
              href="/transport" 
              className={`nav-link ${pathname === '/transport' ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Truck size={16} />
              Transport
            </Link>
          </>
        )}
        
        <button 
          onClick={toggleTheme} 
          className="btn btn-secondary btn-icon"
          aria-label="Toggle Theme"
          style={{ marginLeft: '0.5rem' }}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {!isLoginPage && (
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="btn btn-secondary btn-icon"
            title="Sign Out"
            style={{ 
              borderColor: 'rgba(244, 63, 94, 0.2)',
              color: 'var(--accent-rose)'
            }}
          >
            <LogOut size={18} />
          </button>
        )}
      </div>
    </nav>
  );
}
