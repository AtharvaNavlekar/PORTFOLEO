import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { navLinks, moreLinks, personalInfo, socials } from '../../data/socials';
import * as TablerIcons from '@tabler/icons-react';
import { Button } from '../wensity/button';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import './Navbar.css';

// Shared icon map — defined once at module scope instead of being
// re-created on every render (and duplicated across desktop/mobile).
const SOCIAL_ICON_MAP = {
  GitHub: TablerIcons.IconBrandGithub,
  LinkedIn: TablerIcons.IconBrandLinkedin,
  'X (Twitter)': TablerIcons.IconBrandX,
  Instagram: TablerIcons.IconBrandInstagram,
  Telegram: TablerIcons.IconBrandTelegram,
};

function SocialIcon({ name }) {
  const Icon = SOCIAL_ICON_MAP[name] || TablerIcons.IconLink;
  return <Icon size={18} stroke={1.5} />;
}

// Respect the user's motion preference. Framer Motion doesn't do this
// automatically, so we shorten/skip transitions when it's set.
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const listener = (e) => setReduced(e.matches);
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, []);
  return reduced;
}

/**
 * Command-palette style search. Filters nav + "more" links locally and
 * lets the user navigate to a match with the mouse, Enter, or arrow keys.
 * Shared between the desktop pill bar and the mobile menu so the two
 * surfaces can't drift out of sync.
 */
function SearchBox({ open, onOpenChange, variant = 'desktop', onNavigate }) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  const allItems = useMemo(
    () => [
      ...navLinks.map((l) => ({ ...l, group: 'Pages' })),
      ...moreLinks.map((l) => ({ ...l, group: 'More' })),
    ],
    []
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allItems;
    return allItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q)
    );
  }, [query, allItems]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  useEffect(() => {
    if (open) {
      // Focus on open so keyboard users land straight in the field.
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
    setQuery('');
  }, [open]);

  // Close on outside click (desktop variant only — mobile lives inside
  // the already-dismissible sheet).
  useEffect(() => {
    if (!open || variant !== 'desktop') return;
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        onOpenChange(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, variant, onOpenChange]);

  const goTo = useCallback(
    (path) => {
      navigate(path);
      onOpenChange(false);
      onNavigate?.();
    },
    [navigate, onOpenChange, onNavigate]
  );

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onOpenChange(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const match = results[activeIndex];
      if (match) goTo(match.path);
    }
  };

  return (
    <div
      ref={wrapperRef}
      className={`navbar__search-wrapper navbar__search-wrapper--${variant} ${open ? 'open' : ''}`}
    >
      {variant === 'desktop' ? (
        <button
          type="button"
          className="navbar__pill navbar__search-trigger"
          aria-label={open ? 'Close search' : 'Open search'}
          aria-expanded={open}
          onClick={() => onOpenChange(!open)}
        >
          <TablerIcons.IconSearch size={16} stroke={1.5} />
        </button>
      ) : (
        <div className="navbar__search-icon" aria-hidden="true">
          <TablerIcons.IconSearch size={18} stroke={1.5} />
        </div>
      )}

      <AnimatePresence>
        {(variant === 'mobile' || open) && (
          <motion.div
            className="navbar__search-field-group"
            initial={variant === 'desktop' ? { width: 0, opacity: 0 } : { opacity: 0 }}
            animate={variant === 'desktop' ? { width: 180, opacity: 1 } : { opacity: 1 }}
            exit={variant === 'desktop' ? { width: 0, opacity: 0 } : { opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded={results.length > 0}
              aria-controls="navbar-search-results"
              aria-activedescendant={
                results[activeIndex] ? `search-result-${results[activeIndex].path}` : undefined
              }
              placeholder="Search pages…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="navbar__search-input"
            />

            {(variant === 'mobile' ? query.length > 0 : open) && (
              <ul
                id="navbar-search-results"
                role="listbox"
                className={`navbar__search-results navbar__search-results--${variant}`}
              >
                {results.length === 0 ? (
                  <li className="navbar__search-empty">No pages match "{query}"</li>
                ) : (
                  results.map((item, i) => (
                    <li
                      key={item.path}
                      id={`search-result-${item.path}`}
                      role="option"
                      aria-selected={i === activeIndex}
                    >
                      <button
                        type="button"
                        className={`navbar__search-result ${i === activeIndex ? 'active' : ''}`}
                        onMouseEnter={() => setActiveIndex(i)}
                        onClick={() => goTo(item.path)}
                      >
                        <span className="navbar__search-result-label">{item.label}</span>
                        <span className="navbar__search-result-group">{item.group}</span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { scrollY } = useScroll();
  const location = useLocation();
  const reducedMotion = usePrefersReducedMotion();
  const moreWrapperRef = useRef(null);
  const hamburgerRef = useRef(null);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const previous = scrollY.getPrevious();
    // Never hide the bar while a menu is open — losing the trigger mid-interaction is disorienting.
    if (mobileOpen || moreOpen || searchOpen) {
      setHidden(false);
      return;
    }
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  // Reset transient UI state on route change.
  useEffect(() => {
    setMobileOpen(false);
    setMoreOpen(false);
    setSearchOpen(false);
  }, [location]);

  // Lock background scroll while the mobile sheet is open.
  useEffect(() => {
    if (mobileOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [mobileOpen]);

  // Close the "More" dropdown on outside click and Escape.
  useEffect(() => {
    if (!moreOpen) return;
    const handleClick = (e) => {
      if (moreWrapperRef.current && !moreWrapperRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [moreOpen]);

  // Global Escape to close the mobile sheet, returning focus to the trigger.
  useEffect(() => {
    if (!mobileOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        hamburgerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [mobileOpen]);

  // Cmd/Ctrl+K opens search from anywhere, matching the command-palette feel.
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setMobileOpen(false);
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const motionTransition = reducedMotion ? { duration: 0.01 } : { duration: 0.35, ease: 'easeInOut' };

  return (
    <>
      <motion.nav
        className="navbar"
        aria-label="Main navigation"
        variants={{ visible: { y: 0 }, hidden: { y: '-150%' } }}
        animate={hidden ? 'hidden' : 'visible'}
        transition={motionTransition}
      >
        {/* Left: Logo + Badge */}
        <div className="navbar__left">
          <Link to="/" className="navbar__logo" aria-label={`${personalInfo.fullName} — Home`}>
            <div className="navbar__logo-mark">A</div>
          </Link>
          <div className="navbar__badge hide-mobile">
            <div className="navbar__badge-dot" />
            <div className="navbar__badge-text">
              <span className="navbar__badge-label">{personalInfo.tagline}</span>
              <span className="navbar__badge-sublabel">{personalInfo.subtitle}</span>
            </div>
          </div>
        </div>

        {/* Center: Nav Pills (all items inside ONE glass container) */}
        <div className="navbar__center hide-mobile">
          <div className="navbar__pills glass">
            <ul className="navbar__pills-list">
              {navLinks.map((link) => (
                <li key={link.path} className="navbar__pill-item">
                  <NavLink
                    to={link.path}
                    className={({ isActive }) => `navbar__pill ${isActive ? 'navbar__pill--active' : ''}`}
                    end={link.path === '/'}
                  >
                    <span className="navbar__pill-hover-circle" />
                    <span className="navbar__pill-label">{link.label}</span>
                  </NavLink>
                </li>
              ))}

              {/* More Dropdown */}
              <li className="navbar__pill-item navbar__more-wrapper" ref={moreWrapperRef}>
                <button
                  type="button"
                  className={`navbar__pill navbar__more-trigger ${moreOpen ? 'navbar__pill--active' : ''}`}
                  onClick={() => setMoreOpen((v) => !v)}
                  aria-expanded={moreOpen}
                  aria-haspopup="true"
                >
                  <span className="navbar__pill-hover-circle" />
                  <span className="navbar__pill-label">
                    More
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="navbar__chevron">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </span>
                </button>
                <AnimatePresence>
                  {moreOpen && (
                    <motion.div
                      className="navbar__dropdown"
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: reducedMotion ? 0.01 : 0.2 }}
                      role="menu"
                    >
                      <div className="navbar__dropdown-grid">
                        {moreLinks.map((item) => {
                          const IconComponent = TablerIcons[item.icon] || TablerIcons.IconCode;
                          return (
                            <Link
                              key={item.path}
                              to={item.path}
                              className="navbar__dropdown-item"
                              role="menuitem"
                              onClick={() => setMoreOpen(false)}
                            >
                              <span className="navbar__dropdown-icon">
                                <IconComponent size={20} stroke={1.5} />
                              </span>
                              <div className="navbar__dropdown-text">
                                <span className="navbar__dropdown-title">{item.label}</span>
                                <span className="navbar__dropdown-desc">{item.description}</span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>

              <li className="navbar__divider" aria-hidden="true" />
              <li className="navbar__pill-item">
                <SearchBox open={searchOpen} onOpenChange={setSearchOpen} variant="desktop" />
              </li>
            </ul>
          </div>
        </div>

        {/* Right: Socials + CTA */}
        <div className="navbar__right hide-mobile">
          <div className="navbar__socials">
            {socials.slice(0, 3).map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noreferrer"
                className="navbar__social-link"
                aria-label={social.name}
              >
                <SocialIcon name={social.name} />
              </a>
            ))}
          </div>
          <Link to="/contact" className="navbar__cta-btn">
            Book a Call
          </Link>
        </div>

        {/* Mobile: Hamburger */}
        <button
          ref={hamburgerRef}
          type="button"
          className="navbar__hamburger show-mobile"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu-panel"
        >
          <span className={`navbar__hamburger-line ${mobileOpen ? 'open' : ''}`} />
          <span className={`navbar__hamburger-line ${mobileOpen ? 'open' : ''}`} />
          <span className={`navbar__hamburger-line ${mobileOpen ? 'open' : ''}`} />
        </button>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="mobile-menu mobile-menu--open"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0.01 : 0.2 }}
          >
            <div className="mobile-menu__backdrop" onClick={() => setMobileOpen(false)} />
            <motion.div
              id="mobile-menu-panel"
              className="mobile-menu__panel glass-surface"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation"
              initial={{ y: -20, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0, scale: 0.95 }}
              transition={reducedMotion ? { duration: 0.01 } : { type: 'spring', bounce: 0, duration: 0.4 }}
            >
              <div className="mobile-menu__header">
                <Link to="/" className="navbar__logo" onClick={() => setMobileOpen(false)}>
                  <div className="navbar__logo-mark">A</div>
                </Link>
                <span className="mobile-menu__name">{personalInfo.fullName}</span>
              </div>

              <div className="mobile-menu__links">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className={({ isActive }) => `mobile-menu__link ${isActive ? 'mobile-menu__link--active' : ''}`}
                    end={link.path === '/'}
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </NavLink>
                ))}

                <div className="mobile-menu__divider" />

                {moreLinks.map((item) => {
                  const IconComponent = TablerIcons[item.icon] || TablerIcons.IconCode;
                  return (
                    <Link key={item.path} to={item.path} className="mobile-menu__link" onClick={() => setMobileOpen(false)}>
                      <span className="mobile-menu__link-icon">
                        <IconComponent size={20} stroke={1.5} />
                      </span>
                      {item.label}
                    </Link>
                  );
                })}

                <div className="mobile-menu__divider" />

                <SearchBox
                  open
                  onOpenChange={() => { }}
                  variant="mobile"
                  onNavigate={() => setMobileOpen(false)}
                />

                <div className="mobile-menu__socials">
                  {socials.map((social) => (
                    <a
                      key={social.name}
                      href={social.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mobile-menu__social-link"
                      aria-label={social.name}
                    >
                      <SocialIcon name={social.name} />
                    </a>
                  ))}
                </div>

                <Button asChild variant="white" size="md" className="w-full mt-4">
                  <Link to="/contact" onClick={() => setMobileOpen(false)}>
                    Book a Call
                  </Link>
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}