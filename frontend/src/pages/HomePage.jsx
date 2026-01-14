import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Clock,
  LogOut,
  Settings,
  Shield,
  Target,
  Timer,
} from 'lucide-react';
import useAuthStore from '../stores/authStore';

function HomePage() {
  const { user, logout } = useAuthStore();

  const quickLinks = [
    {
      to: '/dashboard',
      title: 'Dashboard',
      description: 'Your overview: streaks, goals, and today’s progress.',
      icon: Target,
    },
    {
      to: '/blocked-sites',
      title: 'Blocked Sites',
      description: 'Add or remove sites you want to avoid.',
      icon: Shield,
    },
    {
      to: '/time-limits',
      title: 'Time Limits',
      description: 'Cap time on specific sites before they lock.',
      icon: Timer,
    },
    {
      to: '/schedule',
      title: 'Schedule',
      description: 'Set automatic blocking windows by day/time.',
      icon: Clock,
    },
    {
      to: '/analytics',
      title: 'Analytics',
      description: 'See distraction attempts and trends over time.',
      icon: BarChart3,
    },
    {
      to: '/settings',
      title: 'Settings',
      description: 'Tune preferences and account options.',
      icon: Settings,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 bg-slate-900/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold">AI Focus Blocker</span>
          </div>

          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-200 hover:border-slate-600 hover:bg-slate-900 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold">
            Welcome{user?.name ? `, ${user.name}` : ''}.
          </h1>
          <p className="text-slate-400 mt-2 max-w-2xl">
            Quick jump into the tools you use most. Start a session from the extension, then review results here.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="group rounded-xl border border-slate-800 bg-slate-900/60 p-6 hover:border-emerald-500/40 hover:bg-slate-900/75 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="w-11 h-11 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-emerald-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-100">{item.title}</h2>
                    <p className="text-sm text-slate-400 mt-1">{item.description}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 transition-colors mt-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default HomePage;

