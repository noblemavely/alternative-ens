import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { Users, Target, Zap } from "lucide-react";

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
      <div className="min-h-screen flex flex-col bg-white">
        <nav className="border-b border-border bg-white/95 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663387762142/GGrdr6YE4DiKCgcDQKRagu/alternative-logo-trimmed-RgZCb6bccbkFnj5ejWPUg4.webp" 
                alt="AlterNatives" 
                className="h-8 w-auto object-contain"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => window.location.href = getLoginUrl()}>
              Logout
            </Button>
          </div>
        </nav>

        <main className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="text-center max-w-md">
            <h1 className="text-3xl font-bold text-foreground mb-4">Welcome to Alternative</h1>
            <p className="text-muted-foreground mb-8">
              You're logged in as an expert. Visit the expert portal to complete or view your profile.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/expert/register")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse">
          <div className="w-12 h-12 bg-secondary rounded-lg"></div>
        </div>
      </div>
    );
  }

  // Not authenticated - show landing page
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navigation */}
      <nav className="border-b border-border bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663387762142/GGrdr6YE4DiKCgcDQKRagu/alternative-logo-trimmed-RgZCb6bccbkFnj5ejWPUg4.webp" 
              alt="AlterNatives" 
              className="h-8 w-auto object-contain"
            />
          </div>
          <Button
            size="sm"
            onClick={() => (window.location.href = getLoginUrl())}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Sign In
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Expert Network<br />
            <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Made Simple
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Connect with vetted experts. Build your network. Scale your projects with precision and confidence.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              size="lg"
              onClick={() => (window.location.href = getLoginUrl())}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
            >
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/expert/register")}
              className="border-border text-foreground hover:bg-secondary px-8"
            >
              Register as Expert
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="bg-card rounded-lg p-8 border border-border hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Expert Network</h3>
              <p className="text-muted-foreground text-sm">
                Access a curated network of vetted professionals across industries and functions.
              </p>
            </div>

            <div className="bg-card rounded-lg p-8 border border-border hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Smart Matching</h3>
              <p className="text-muted-foreground text-sm">
                Find the perfect experts for your projects with advanced search and filtering.
              </p>
            </div>

            <div className="bg-card rounded-lg p-8 border border-border hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Seamless Integration</h3>
              <p className="text-muted-foreground text-sm">
                Streamlined workflows for project management and expert coordination.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-white/50 backdrop-blur-sm py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground text-sm">
          <p>© 2026 Alternative. Expert Network Service Aggregator.</p>
        </div>
      </footer>
    </div>
  );
}
