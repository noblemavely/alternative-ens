import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { Briefcase, Users, Target, Zap } from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  // If authenticated and admin, redirect to dashboard
  if (isAuthenticated && user?.role === "admin") {
    navigate("/admin");
    return null;
  }

  // If authenticated but not admin, show expert portal option
  if (isAuthenticated && user?.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
        <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-slate-900 to-slate-700 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-slate-900">Alternative</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => window.location.href = getLoginUrl()}>
              Logout
            </Button>
          </div>
        </nav>

        <main className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="text-center max-w-md">
            <h1 className="text-3xl font-bold text-slate-900 mb-4">Welcome to Alternative</h1>
            <p className="text-slate-600 mb-8">
              You're logged in as an expert. Visit the expert portal to complete or view your profile.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/expert/register")}
              className="bg-slate-900 hover:bg-slate-800"
            >
              Go to Expert Portal
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="animate-pulse">
          <div className="w-12 h-12 bg-slate-300 rounded-lg"></div>
        </div>
      </div>
    );
  }

  // Not authenticated - show landing page
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-slate-900 to-slate-700 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-slate-900">Alternative</span>
          </div>
          <Button
            size="sm"
            onClick={() => (window.location.href = getLoginUrl())}
            className="bg-slate-900 hover:bg-slate-800"
          >
            Sign In
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Expert Network<br />
            <span className="bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
              Made Simple
            </span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Connect with vetted experts. Build your network. Scale your projects with precision and confidence.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              size="lg"
              onClick={() => (window.location.href = getLoginUrl())}
              className="bg-slate-900 hover:bg-slate-800 text-white px-8"
            >
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/expert/register")}
              className="border-slate-300 text-slate-900 hover:bg-slate-50 px-8"
            >
              Register as Expert
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="bg-white rounded-lg p-8 border border-slate-200 hover:border-slate-300 transition-colors">
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-slate-900" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Expert Network</h3>
              <p className="text-slate-600 text-sm">
                Access a curated network of vetted professionals across industries and functions.
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 border border-slate-200 hover:border-slate-300 transition-colors">
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-slate-900" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Smart Matching</h3>
              <p className="text-slate-600 text-sm">
                Find the perfect experts for your projects with advanced search and filtering.
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 border border-slate-200 hover:border-slate-300 transition-colors">
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-slate-900" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Seamless Integration</h3>
              <p className="text-slate-600 text-sm">
                Streamlined workflows for project management and expert coordination.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/50 backdrop-blur-sm py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-600 text-sm">
          <p>© 2026 Alternative. Expert Network Service Aggregator.</p>
        </div>
      </footer>
    </div>
  );
}
