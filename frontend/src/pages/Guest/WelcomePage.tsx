import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, MapPin, Shield, Users, ArrowRight, Wrench, ClipboardList } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const features = [
  {
    icon: MapPin,
    title: 'Report Issues Easily',
    description:
      'Submit problems like potholes, broken lights, or waste collection issues with just a few clicks.',
  },
  {
    icon: Shield,
    title: 'Track Your Reports',
    description:
      'Stay updated on the status of each submission as city technicians work to resolve them.',
  },
  {
    icon: Users,
    title: 'Community Impact',
    description:
      'Your reports help build a safer, cleaner, and better city for all residents.',
  },
];

const roleDashboard: Record<string, { to: string; label: string; icon: React.ElementType }> = {
  citizen:    { to: '/citizen/create-report', label: 'Create a Report', icon: ArrowRight },
  admin:      { to: '/admin/reports',         label: 'Manage Reports',  icon: ClipboardList },
  technician: { to: '/tech/tasks',            label: 'View My Tasks',   icon: Wrench },
};

const WelcomePage = () => {
  const { session } = useAuth();
  const isLoggedIn = !!session;
  const role = session?.role;
  const firstName = session?.user?.full_name?.split(' ')[0];
  const dashboard = role ? roleDashboard[role] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-24 sm:py-32">
        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          <Building2 size={15} />
          <span>City Problem Reporting System</span>
        </div>

        {isLoggedIn ? (
          /* ── Authenticated hero ── */
          <>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 max-w-3xl leading-tight mb-5">
              Welcome back,{' '}
              <span className="text-blue-600">{firstName}</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-500 max-w-xl mb-10 leading-relaxed">
              {role === 'citizen' && 'Spotted a problem in your area? Submit a new report and help keep the city safe.'}
              {role === 'admin' && 'Review incoming citizen reports, assign technicians, and track resolution progress.'}
              {role === 'technician' && 'Check your assigned tasks and update the status of ongoing repairs.'}
            </p>
            {dashboard && (
              <Link
                to={dashboard.to}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-all shadow-lg shadow-blue-200"
              >
                <dashboard.icon size={17} />
                {dashboard.label}
              </Link>
            )}
          </>
        ) : (
          /* ── Guest hero ── */
          <>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 max-w-3xl leading-tight mb-5">
              Help Us Build a{' '}
              <span className="text-blue-600">Better City</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-500 max-w-xl mb-10 leading-relaxed">
              Report infrastructure issues, track their progress, and collaborate with city authorities
              to create a safer and cleaner environment for everyone.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-all shadow-lg shadow-blue-200"
              >
                Get Started
                <ArrowRight size={17} />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white text-slate-700 font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
              >
                Sign In
              </Link>
            </div>
          </>
        )}
      </section>

      {/* Feature cards — always visible */}
      <section className="px-6 pb-24 max-w-4xl mx-auto">
        <div className="grid sm:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
            >
              <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                <Icon size={22} className="text-blue-600" />
              </div>
              <h3 className="text-slate-900 font-semibold text-base mb-1.5">{title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default WelcomePage;
