import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getClientReservations, getPendingReservationsForBarber } from '../lib/api';
import logo from '../assets/jb-slyce-logo.png';

function Navbar() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const btnRef = useRef(null);
  const popRef = useRef(null);
  const location = useLocation();
  const inAdmin = location.pathname.startsWith('/admin');
  const [clientChangeCount, setClientChangeCount] = useState(0);
  const [barberPendingCount, setBarberPendingCount] = useState(0);
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('bc_theme');
      if (saved === 'light' || saved === 'dark') return saved;
      const sysDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      return sysDark ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  // Persist theme changes and apply to <html>
  useEffect(() => {
    try { localStorage.setItem('bc_theme', theme); } catch {}
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search, location.hash]);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      const target = e.target;
      if (btnRef.current && btnRef.current.contains(target)) return;
      if (popRef.current && popRef.current.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  // Notifications: client approvals/declines and barber pending
  useEffect(() => {
    let iv;
    const latestKey = 'bc_nav_client_latest';
    const seenKey = 'bc_nav_client_seen';
    const check = async () => {
      try {
        if (user?.role === 'CLIENT' && user?.id) {
          const list = await getClientReservations(user.id);
          const latest = {};
          for (const r of list) latest[r.id] = r.status;
          let seen = {};
          try { seen = JSON.parse(sessionStorage.getItem(seenKey) || '{}'); } catch {}
          // Count items where latest differs from seen and status is APPROVED/DECLINED
          let count = 0;
          for (const id in latest) {
            const curr = latest[id];
            const prev = seen[id];
            if ((curr === 'APPROVED' || curr === 'DECLINED') && prev !== curr) count++;
          }
          setClientChangeCount(count);
          try { sessionStorage.setItem(latestKey, JSON.stringify(latest)); } catch {}
        } else {
          setClientChangeCount(0);
        }

        if (user?.role === 'BARBER' && user?.barberId) {
          const pend = await getPendingReservationsForBarber(user.barberId);
          setBarberPendingCount(Array.isArray(pend) ? pend.length : 0);
        } else {
          setBarberPendingCount(0);
        }
      } catch {}
    };
    check();
    iv = setInterval(check, 10000);
    const onVis = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(iv); document.removeEventListener('visibilitychange', onVis); };
  }, [user]);

  const Badge = ({ count, title }) => (
    count > 0 ? (
      <span title={title} style={{ marginLeft:6, display:'inline-flex', alignItems:'center', justifyContent:'center', minWidth:22, height:22, padding:'0 6px', borderRadius:'9999px', background:'#facc15', color:'#111827', fontWeight:700, fontSize:12, boxShadow:'0 0 0 2px rgba(0,0,0,0.2)' }}>{count}</span>
    ) : null
  );
  return (
    <nav className="navbar" style={{ position:'fixed', top:0, left:0, right:0, width:'100%', zIndex:1000 }}>
      <div className="navbar__brand">
        <Link to="/" style={{ display:'inline-flex', alignItems:'center', gap:10, textDecoration:'none' }}>
          <img src={logo} alt="JB Slyce logo" style={{ height:35, width:'auto', display:'block' }} />
          <div style={{ display:'flex', flexDirection:'column', lineHeight:1 }}>
            <span style={{ fontWeight:800, letterSpacing:1, color:'#ec9807ff' }}>JB SLYCE</span>
            <span style={{ marginTop:5, fontSize:12, color:'#9ca3af', fontWeight:600 }}>get slyced</span>
          </div>
        </Link>
        <button
          className="navbar__toggle"
          aria-label="Toggle menu"
          aria-expanded={navOpen}
          onClick={() => setNavOpen(v => !v)}
        >
          {/* Hamburger icon */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>
      <ul className={`navbar__links ${navOpen ? 'is-open' : ''}`} onClick={() => setNavOpen(false)}>
        {/* Main links (non-admin views only) */}
        {!inAdmin && (
          <>
            <li>
              <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : undefined}>Home</NavLink>
            </li>
            {(!user || user?.role === 'CLIENT') && (
              <li>
                <NavLink to="/services" className={({ isActive }) => isActive ? 'active' : undefined}>Services</NavLink>
              </li>
            )}
            {(!user || user?.role === 'CLIENT') && (
              <li>
                <NavLink to="/about" className={({ isActive }) => isActive ? 'active' : undefined}>About</NavLink>
              </li>
            )}
            {(!user || user?.role === 'CLIENT') && (
              <li>
                <a href="/#barbers" className={location.pathname === '/' && (location.hash === '#barbers') ? 'active' : undefined}>Barbers</a>
              </li>
            )}
            {user?.role === 'CLIENT' && (
              <li>
                <NavLink
                  to="/my-reservations"
                  className={({ isActive }) => isActive ? 'active' : undefined}
                  onClick={() => {
                    try {
                      const latest = sessionStorage.getItem('bc_nav_client_latest');
                      if (latest) sessionStorage.setItem('bc_nav_client_seen', latest);
                    } catch {}
                    setClientChangeCount(0);
                  }}
                >
                  My Reservations
                </NavLink>
                <Badge count={clientChangeCount} title="Reservation updates" />
              </li>
            )}
            {user?.role === 'BARBER' && (
              <>
                <li>
                  <NavLink
                    to="/barber/dashboard"
                    className={({ isActive }) => isActive ? 'active' : undefined}
                    onClick={() => {
                      try { sessionStorage.setItem('bc_nav_barber_seen_pending', String(barberPendingCount)); } catch {}
                    }}
                  >
                    Barber Dashboard
                  </NavLink>
                  {(() => {
                    let seen = 0; try { seen = parseInt(sessionStorage.getItem('bc_nav_barber_seen_pending') || '0', 10) || 0; } catch {}
                    const show = barberPendingCount > 0 && barberPendingCount !== seen;
                    return <Badge count={show ? barberPendingCount : 0} title={`${barberPendingCount} pending requests`} />;
                  })()}
                </li>
                <li><NavLink to="/barber/profile" className={({ isActive }) => isActive ? 'active' : undefined}>My Profile</NavLink></li>
                <li>
                  <a href="/#slots" className={location.pathname === '/' && (location.hash === '#slots') ? 'active' : undefined}>Create Slots</a>
                </li>
              </>
            )}
            {!inAdmin && user?.role === 'ADMIN' && (
              <li><Link to="/admin">Admin</Link></li>
            )}
          </>
        )}

        {/* Theme toggle (always visible) */}
        <li>
          <button
            className="user-btn"
            onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle color mode"
            style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:38, height:38, borderRadius:10 }}
          >
            {theme === 'dark' ? (
              // Sun icon
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </svg>
            ) : (
              // Moon icon
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </li>
        {!user ? (
          <li><Link to="/signin">Log In</Link></li>
        ) : (
          <li className="user-menu">
            <button ref={btnRef} className="user-btn" onClick={() => setOpen(!open)}>
              Hi, {user.username}
            </button>
            {open && (
              <div ref={popRef} className="user-popover" style={{ display:'flex', flexDirection:'column', gap:8, alignItems:'stretch' }}>
                <div className="user-popover__line">You are currently logged in.</div>
                <div className="user-popover__name muted">{user.email}</div>
                {user?.role === 'CLIENT' && (
                  <Link to="/my-reservations" className="btn btn-secondary sm" onClick={() => setOpen(false)}>My Reservations</Link>
                )}
                {user?.role === 'BARBER' && (
                  <>
                    <Link to="/barber/dashboard" className="btn btn-secondary sm" onClick={() => setOpen(false)}>Barber Dashboard</Link>
                    <Link to="/barber/profile" className="btn btn-secondary sm" onClick={() => setOpen(false)}>My Profile</Link>
                    <a href="/#slots" className="btn btn-secondary sm" onClick={() => setOpen(false)}>Create Slots</a>
                  </>
                )}
                {user?.role === 'ADMIN' && (
                  <Link to="/admin" className="btn btn-secondary sm" onClick={() => setOpen(false)}>Admin</Link>
                )}
                <button className="btn btn-secondary sm" onClick={signOut}>Sign out</button>
              </div>
            )}
          </li>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;
