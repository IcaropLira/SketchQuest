import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useStore } from '../store/store';

const NAV = [
  { to: '/', label: 'Gerador', end: true },
  { to: '/temas', label: 'Temas' },
  { to: '/sessao', label: 'Sessão' },
  { to: '/rabiscar', label: 'Rabiscar' },
  { to: '/paletas', label: 'Paletas' },
  { to: '/salvos', label: 'Salvos' },
  { to: '/progresso', label: 'Progresso' },
  { to: '/meus-temas', label: 'Meus temas' },
];

export default function Layout() {
  const { toastMsg } = useStore();
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <>
      {/* gradiente usado pela centelha (Sparkle) */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="sg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ee0f7f" />
            <stop offset="0.5" stopColor="#ff8db8" />
            <stop offset="1" stopColor="#6b3fa0" />
          </linearGradient>
        </defs>
      </svg>

      <header>
        <div className="w bar">
          <Link className="brand" to="/" aria-label="Hiraku SketchQuest, página inicial">
            <img src="/logo.svg" alt="" />
            <span>
              Hiraku <em>SketchQuest</em>
            </span>
          </Link>
          <nav aria-label="Principal">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'on' : '')}>
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer>
        <div className="w foot">
          <span>
            © Ícaro Pinto Lira · feito com <em>✦</em> e muito rabisco
          </span>
          <span className="foot-links">
            <Link to="/sobre">Sobre</Link>
            <a href="https://icaropintolira.vercel.app" target="_blank" rel="noopener noreferrer">
              Portfólio
            </a>
          </span>
        </div>
      </footer>

      <div className={`toast${toastMsg ? ' show' : ''}`} role="status" aria-live="polite">
        {toastMsg}
      </div>
    </>
  );
}
