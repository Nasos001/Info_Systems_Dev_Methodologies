import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard, User, Settings, LogOut,
  Home, ClipboardList, Wrench, Building2,
} from 'lucide-react';

const Navbar = () => {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const role = session?.role;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = {
    guest: [
      { label: 'Home', path: '/', icon: Home },
      { label: 'Login/Register', path: '/login', icon: User },
    ],
    citizen: [
      { label: 'Home', path: '/', icon: Home },
      { label: 'My Reports', path: '/citizen/my-reports', icon: ClipboardList },
      { label: 'Create Report', path: '/citizen/create-report', icon: LayoutDashboard },
    ],
    admin: [
      { label: 'Home', path: '/', icon: Home },
      { label: 'All Reports', path: '/admin/reports', icon: ClipboardList },
      { label: 'Technicians', path: '/admin/technicians', icon: User },
      { label: 'Categories', path: '/admin/categories', icon: Settings },
    ],
    technician: [
      { label: 'Home', path: '/', icon: Home },
      { label: 'My Tasks', path: '/tech/tasks', icon: Wrench },
    ],
  };

  const currentNav = role ? navItems[role as keyof typeof navItems] : navItems.guest;

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">

        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 text-blue-600 font-bold text-lg shrink-0">
          <Building2 size={22} />
          <span>CityReports</span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-1">
          {currentNav.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
              >
                {item.icon && <item.icon size={15} />}
                <span className="hidden sm:block">{item.label}</span>
              </Link>
            );
          })}

          {/* User badge + Logout (only when authenticated) */}
          {role && (
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-slate-200">
              <div className="hidden md:flex items-center gap-1.5">
                <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                  <User size={14} className="text-blue-700" />
                </div>
                <span className="text-sm font-medium text-slate-700">
                  {session?.user?.full_name?.split(' ')[0]}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <LogOut size={15} />
                <span className="hidden sm:block">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
