import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import AdminDashboard from "./pages/AdminDashboard";
import AdminClients from "./pages/AdminClients";
import AdminExperts from "./pages/AdminExperts";
import AdminProjects from "./pages/AdminProjects";
import AdminSearch from "./pages/AdminSearch";
import AdminExpertDetail from "./pages/AdminExpertDetail";
import AdminClientDetail from "./pages/AdminClientDetail";
import AdminProjectDetail from "./pages/AdminProjectDetail";
import AdminSettings from "./pages/AdminSettings";
import AddClient from "./pages/AddClient";
import AddExpert from "./pages/AddExpert";
import AddProject from "./pages/AddProject";
import ExpertPortal from "./pages/ExpertPortal";
import ExpertProfileView from "./pages/ExpertProfileView";
import AdminLogin from "./pages/AdminLogin";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/admin-login"} component={AdminLogin} />
      <Route path={"/admin"} component={AdminDashboard} />
      <Route path={"/admin/clients"} component={AdminClients} />
      <Route path={"/admin/experts"} component={AdminExperts} />
      <Route path={"/admin/projects"} component={AdminProjects} />
      <Route path={"/admin/search"} component={AdminSearch} />
      <Route path={"/admin/experts/:id"} component={AdminExpertDetail} />
      <Route path={"/admin/clients/:id"} component={AdminClientDetail} />
      <Route path={"/admin/projects/:id"} component={AdminProjectDetail} />      <Route path={"/admin/settings"} component={AdminSettings} />
      <Route path={"/admin/add-client"} component={AddClient} />
      <Route path={"/admin/add-expert"} component={AddExpert} />
      <Route path={"/admin/add-project"} component={AddProject} />
      <Route path={"/expert/register"} component={ExpertPortal} />
      <Route path={"/expert/profile/:id"} component={ExpertProfileView} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
