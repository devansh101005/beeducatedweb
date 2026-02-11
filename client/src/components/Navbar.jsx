import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { HiOutlineMenu, HiOutlineX } from 'react-icons/hi';
import logo from '../assets/logo.png';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/courses', label: 'Courses' },
  { to: '/fee-structure', label: 'Fee Structure' },
  { to: '/faculty', label: 'Faculty' },
  { to: '/contact', label: 'Contact' },
];

function Navbar() {
  const { isSignedIn, isLoaded } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Scroll listener for shrink + shadow effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 w-full z-[1000] transition-all duration-300 ${
          scrolled
            ? 'bg-white/98 backdrop-blur-md shadow-md'
            : 'bg-white/95 backdrop-blur-sm'
        }`}
      >
        <div
          className={`flex justify-between items-center w-full max-w-7xl mx-auto px-5 transition-all duration-300 ${
            scrolled ? 'h-16' : 'h-20'
          }`}
        >
          {/* ---- Logo + Brand ---- */}
          <Link to="/" className="no-underline flex items-center gap-2.5 shrink-0">
            <img
              src={logo}
              alt="Be Educated Logo"
              className={`object-contain rounded-lg transition-all duration-300 ${
                scrolled ? 'w-11 h-9' : 'w-16 h-12'
              }`}
            />
            <div className="flex flex-col">
              <span className="font-heading text-xl font-bold text-[#0a1e3d] leading-tight">
                Be Educated
              </span>
              <span className="font-body text-[10px] text-gray-400 -mt-0.5 tracking-wide hidden sm:block">
                Achieve Beyond Limits
              </span>
            </div>
          </Link>

          {/* ---- Desktop Nav Links (center) ---- */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`relative font-body text-[13.5px] font-medium no-underline px-3 py-2 rounded-lg transition-all duration-200 ${
                  isActive(to)
                    ? 'text-[#05308d] bg-[#05308d]/5'
                    : 'text-gray-600 hover:text-[#05308d] hover:bg-gray-50'
                }`}
              >
                {label}
                {/* Active underline indicator */}
                {isActive(to) && (
                  <span className="absolute bottom-0.5 left-3 right-3 h-[2px] bg-[#05308d] rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* ---- Desktop Right Actions ---- */}
          <div className="hidden lg:flex items-center gap-3">
            {isLoaded && isSignedIn ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 bg-[#05308d] text-white px-5 py-2 rounded-lg no-underline font-heading font-semibold text-sm hover:bg-[#1648b8] transition-colors duration-300 shadow-sm"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/sign-in"
                  className="font-body text-sm font-medium text-gray-600 no-underline hover:text-[#05308d] transition-colors duration-200 px-3 py-2"
                >
                  Sign In
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center bg-[#05308d] text-white px-5 py-2 rounded-lg no-underline font-heading font-semibold text-sm hover:bg-[#1648b8] transition-colors duration-300 shadow-sm"
                >
                  Enquire Now
                </Link>
              </>
            )}
          </div>

          {/* ---- Mobile Hamburger Button ---- */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg text-[#0a1e3d] hover:bg-gray-100 transition-colors duration-200 border-none bg-transparent cursor-pointer"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? (
              <HiOutlineX className="text-2xl" />
            ) : (
              <HiOutlineMenu className="text-2xl" />
            )}
          </button>
        </div>

        {/* ---- Mobile Menu Dropdown ---- */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            mobileOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-5 pb-6 pt-2 border-t border-gray-100 bg-white">
            {/* Nav Links */}
            <div className="flex flex-col gap-1 mb-5">
              {NAV_LINKS.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`font-body text-[15px] font-medium no-underline px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive(to)
                      ? 'text-[#05308d] bg-[#05308d]/5 font-semibold'
                      : 'text-gray-600 hover:text-[#05308d] hover:bg-gray-50'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>

            {/* Divider */}
            <div className="h-px bg-gray-100 mb-4" />

            {/* Auth Actions */}
            <div className="flex flex-col gap-2">
              {isLoaded && isSignedIn ? (
                <Link
                  to="/dashboard"
                  className="text-center bg-[#05308d] text-white px-5 py-3 rounded-lg no-underline font-heading font-semibold text-sm hover:bg-[#1648b8] transition-colors duration-300"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/sign-in"
                    className="text-center font-body text-sm font-medium text-gray-600 no-underline border border-gray-200 px-5 py-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/contact"
                    className="text-center bg-[#05308d] text-white px-5 py-3 rounded-lg no-underline font-heading font-semibold text-sm hover:bg-[#1648b8] transition-colors duration-300"
                  >
                    Enquire Now
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Backdrop overlay when mobile menu is open */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-[999] lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}

export default Navbar;
