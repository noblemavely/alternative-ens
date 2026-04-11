import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { Users, Target, Zap } from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();

  // If authenticated and admin (including super_admin), redirect to dashboard
  if (isAuthenticated && (user?.role === "admin" || user?.role === "super_admin")) {
    navigate("/admin");
    return null;
  }

  // If authenticated as expert, show expert portal option
  if (isAuthenticated && user?.role === "expert") {
    const handleExpertLogout = () => {
      // Clear expert session from localStorage
      localStorage.removeItem("manus-runtime-user-info");
      // Invalidate auth cache and redirect
      logout().then(() => {
        navigate("/");
      }).catch(() => {
        // Even if logout fails, clear and navigate
        navigate("/");
      });
    };

    return (
      <div className="min-h-screen flex flex-col bg-white">
        <nav className="border-b border-border bg-white/95 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663387762142/GGrdr6YE4DiKCgcDQKRagu/Alternative_Logo_White_Background-removebg-preview_9d4821e4.png"
                alt="AlterNatives"
                className="h-8 w-auto object-contain"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExpertLogout}
            >
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
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663387762142/GGrdr6YE4DiKCgcDQKRagu/Alternative_Logo_White_Background-removebg-preview_9d4821e4.png"
              alt="AlterNatives"
              className="h-8 w-auto object-contain"
            />
          </div>
          {/* Admin Sign In hidden from public page */}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Your Gateway to Expert<br />
            <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Opportunities
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join Alternative – the Expert Network Service platform connecting accomplished professionals with organizations seeking specialized expertise. Build your profile, showcase your skills, and engage with meaningful projects.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              size="lg"
              onClick={() => navigate("/expert/register")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
            >
              Create Your Expert Profile
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="bg-card rounded-lg p-8 border border-border hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Build Your Profile</h3>
              <p className="text-muted-foreground text-sm">
                Create a comprehensive professional profile showcasing your expertise, experience, education, and portfolio. Upload your CV and let organizations discover your qualifications.
              </p>
            </div>

            <div className="bg-card rounded-lg p-8 border border-border hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Find Perfect Matches</h3>
              <p className="text-muted-foreground text-sm">
                Connect with projects and opportunities that align with your expertise. Work with organizations that value your specific skills and industry knowledge.
              </p>
            </div>

            <div className="bg-card rounded-lg p-8 border border-border hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Grow Your Network</h3>
              <p className="text-muted-foreground text-sm">
                Expand your professional network by engaging with leading organizations. Track project engagements and build your reputation through successful collaborations.
              </p>
            </div>
          </div>

          {/* How It Works Section */}
          <div className="mt-24 pt-16 border-t border-border">
            <h2 className="text-3xl font-bold text-foreground mb-12">How It Works</h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg mb-4">
                  1
                </div>
                <h4 className="font-semibold text-foreground mb-2">Register</h4>
                <p className="text-sm text-muted-foreground">
                  Sign up and create your expert profile
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg mb-4">
                  2
                </div>
                <h4 className="font-semibold text-foreground mb-2">Build Profile</h4>
                <p className="text-sm text-muted-foreground">
                  Add your experience, skills, and credentials
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg mb-4">
                  3
                </div>
                <h4 className="font-semibold text-foreground mb-2">Get Discovered</h4>
                <p className="text-sm text-muted-foreground">
                  Organizations find and engage with you
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg mb-4">
                  4
                </div>
                <h4 className="font-semibold text-foreground mb-2">Collaborate</h4>
                <p className="text-sm text-muted-foreground">
                  Engage in projects and build relationships
                </p>
              </div>
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
