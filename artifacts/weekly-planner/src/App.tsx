import { Switch, Route, Router as WouterRouter } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import WeekPage from "@/pages/Week";
import MonthPage from "@/pages/Month";
import InsightsPage from "@/pages/Insights";
import SettingsPage from "@/pages/Settings";
import PrivacyPage from "@/pages/privacy";
import TermsPage from "@/pages/terms";
import { useEffect } from "react";
import { PomodoroProvider } from "@/components/pomodoro/PomodoroProvider";
import { getColorMode, getTheme, initAppearance } from "@/lib/storage";
import { watchSystemColorMode } from "@/lib/appearance";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/week" component={WeekPage} />
      <Route path="/month" component={MonthPage} />
      <Route path="/insights" component={InsightsPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    initAppearance();
    return watchSystemColorMode(getTheme, getColorMode);
  }, []);

  return (
    <TooltipProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <PomodoroProvider>
          <Router />
        </PomodoroProvider>
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
