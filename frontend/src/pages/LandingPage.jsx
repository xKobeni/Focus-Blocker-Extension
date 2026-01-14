import { Link } from 'react-router-dom';
import { 
  Shield, 
  Brain, 
  Target, 
  BarChart3, 
  Clock, 
  Zap,
  CheckCircle2,
  ArrowRight,
  Chrome
} from 'lucide-react';

function LandingPage() {
  const features = [
    {
      icon: Shield,
      title: 'Smart Website Blocking',
      description: 'Block distracting websites automatically during focus sessions with intelligent detection.'
    },
    {
      icon: Brain,
      title: 'AI-Powered Insights',
      description: 'Get personalized insights and recommendations based on your focus patterns and habits.'
    },
    {
      icon: Target,
      title: 'Focus Goals & Sessions',
      description: 'Set goals, track sessions, and build better focus habits with gamified achievements.'
    },
    {
      icon: BarChart3,
      title: 'Detailed Analytics',
      description: 'Monitor your productivity with comprehensive analytics and usage metrics.'
    },
    {
      icon: Clock,
      title: 'Time Limits & Schedules',
      description: 'Set time limits for specific sites and create custom blocking schedules.'
    },
    {
      icon: Zap,
      title: 'Browser Extension',
      description: 'Seamless integration with Chrome extension for real-time blocking and tracking.'
    }
  ];

  const benefits = [
    'Increase productivity and focus',
    'Build better digital habits',
    'Track your progress over time',
    'Gamified achievement system',
    'Customizable blocking rules',
    'AI-driven insights and recommendations'
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-emerald-500" />
              <span className="text-xl font-semibold">AI Focus Blocker</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-slate-300 hover:text-slate-100 transition-colors px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/25 via-slate-950 to-slate-950" />
        <div className="pointer-events-none absolute inset-0 opacity-30 mix-blend-screen">
          <div className="absolute -left-32 top-24 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Hero copy */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-slate-900/80 px-3 py-1 text-xs sm:text-sm text-emerald-300 mb-5">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>New · AI-powered focus companion for the browser</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-emerald-300 via-emerald-500 to-emerald-400 bg-clip-text text-transparent leading-tight">
                Turn distractions into
                <br className="hidden sm:block" /> deep work.
              </h1>
              <p className="text-lg sm:text-xl text-slate-300 mb-6 sm:mb-8 max-w-xl">
                AI-Powered Focus Blocker intelligently blocks distracting sites, tracks your habits,
                and syncs with a Chrome extension so you can stay in flow—on every tab.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center mb-6">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-7 py-3 rounded-lg text-base sm:text-lg font-semibold transition-colors shadow-lg shadow-emerald-500/25"
                >
                  Get started free
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-slate-100 px-7 py-3 rounded-lg text-base sm:text-lg font-medium transition-colors bg-slate-900/60"
                >
                  I already have an account
                </Link>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-400">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/80 border border-slate-800 px-3 py-1">
                  <Chrome className="w-4 h-4 text-emerald-400" />
                  <span>Works with Chrome & Chromium browsers</span>
                </div>
                <span className="text-slate-500">No complex setup · Start in minutes</span>
              </div>
            </div>

            {/* Hero preview card */}
            <div className="lg:justify-self-end">
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-tr from-emerald-500/40 via-emerald-400/10 to-transparent rounded-2xl blur-xl opacity-60" />
                <div className="relative bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-xl shadow-emerald-500/15 backdrop-blur">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">Current focus session</p>
                      <p className="text-lg font-semibold text-slate-100 mt-1">Deep Work · 50 min</p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/20 text-emerald-300 px-3 py-1 text-xs">
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                      Live
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="rounded-lg bg-slate-900/80 border border-slate-800 px-3 py-2">
                      <p className="text-xs text-slate-400">Time focused</p>
                      <p className="text-lg font-semibold text-slate-50">32m</p>
                    </div>
                    <div className="rounded-lg bg-slate-900/80 border border-slate-800 px-3 py-2">
                      <p className="text-xs text-slate-400">Attempts blocked</p>
                      <p className="text-lg font-semibold text-emerald-400">7</p>
                    </div>
                    <div className="rounded-lg bg-slate-900/80 border border-slate-800 px-3 py-2">
                      <p className="text-xs text-slate-400">Streak</p>
                      <p className="text-lg font-semibold text-slate-50">5 days</p>
                    </div>
                  </div>
                  <div className="mb-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">Blocked right now</p>
                    <div className="space-y-2">
                      {['youtube.com', 'twitter.com', 'reddit.com'].map((site) => (
                        <div
                          key={site}
                          className="flex items-center justify-between rounded-lg bg-slate-900/80 border border-slate-800 px-3 py-2"
                        >
                          <span className="text-sm text-slate-200">{site}</span>
                          <span className="text-xs text-emerald-400">Blocked</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-800 pt-3">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <p className="text-xs text-slate-400">
                        Auto-syncs with your web app & extension
                      </p>
                    </div>
                    <span className="text-xs text-slate-500">AI insights unlocked after each session</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Everything you need to stay focused and productive
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 hover:border-emerald-500/50 transition-all hover:shadow-lg hover:shadow-emerald-500/10"
                >
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-slate-400">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 border-y border-slate-800/60 bg-slate-950/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">Built for real-world focus</h2>
            <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
              From planning a session to reviewing your progress, AI Focus Blocker guides you through every step.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-3">
                <Target className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold mb-1">1. Plan</h3>
              <p className="text-sm text-slate-400">
                Set your focus goal, duration, and choose which sites should be blocked while you work.
              </p>
            </div>
            <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-3">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold mb-1">2. Focus</h3>
              <p className="text-sm text-slate-400">
                The extension blocks distractions in real time while the web app tracks your streaks and attempts.
              </p>
            </div>
            <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-3">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold mb-1">3. Reflect</h3>
              <p className="text-sm text-slate-400">
                Review AI-generated insights, see where you slipped, and adjust your blocking rules over time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Why Choose AI Focus Blocker?</h2>
              <p className="text-xl text-slate-300 mb-8">
                Transform your relationship with digital distractions and unlock your true productivity potential.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-lg text-slate-300">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-emerald-900/20 to-slate-900 border border-slate-800 rounded-2xl p-8 lg:p-12">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                    <Target className="w-8 h-8 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-1">Set Your Goals</h3>
                    <p className="text-slate-400">Define what you want to achieve</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                    <Shield className="w-8 h-8 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-1">Block Distractions</h3>
                    <p className="text-slate-400">Automatically prevent access to distracting sites</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-1">Track Progress</h3>
                    <p className="text-slate-400">Monitor your productivity and growth</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-emerald-900/20 via-slate-900 to-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Boost Your Productivity?</h2>
          <p className="text-xl text-slate-300 mb-8">
            Join thousands of users who have transformed their focus and achieved their goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors shadow-lg shadow-emerald-500/25"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-slate-100 px-8 py-4 rounded-lg text-lg font-semibold transition-colors bg-slate-900/50"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 sm:mb-0">
              <Shield className="w-5 h-5 text-emerald-500" />
              <span className="text-slate-300">AI Focus Blocker</span>
            </div>
            <p className="text-slate-400 text-sm">
              © {new Date().getFullYear()} AI-Powered Focus Blocker. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
