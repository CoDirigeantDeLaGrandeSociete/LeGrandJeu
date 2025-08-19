import { useState } from 'react';
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navigation } from "@/components/navigation";
import PlayerDashboard from "@/pages/player-dashboard";
import TeamPage from "@/pages/team";
import AdminPage from "@/pages/admin";
import AuditPage from "@/pages/audit";
import ChallengeBankPage from "@/pages/challenge-bank";
import ParticipantManagementPage from "@/pages/participant-management";
import AdminLogin from "@/pages/admin-login";
import NotFound from "@/pages/not-found";

// Mock user - in real app this would come from auth context
const regularUser = {
  id: "user-1",
  displayName: "Pierre Dupont",
  isAdmin: false,
};

const adminUser = {
  id: "admin-1",
  displayName: "Administrateur GJIR",
  isAdmin: true,
};

function Router({ isAdmin }: { isAdmin: boolean }) {
  return (
    <Switch>
      <Route path="/" component={PlayerDashboard} />
      <Route path="/team" component={TeamPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/audit" component={AuditPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  
  // Show regular user in navigation - admin access is protected by password
  const currentUser = {
    id: "user-1",
    displayName: "Pierre Dupont",
    isAdmin: false,
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-slate-50">
          <Navigation user={currentUser} />
          <main>
            <Router isAdmin={isAdminLoggedIn} />
          </main>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
