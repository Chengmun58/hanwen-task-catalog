import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import FilesPage from "./pages/FilesPage";
import DailyContentPage from "./pages/DailyContentPage";
import ImmersionUpdates from "./pages/ImmersionUpdates";
import KoreanGenzPage from "./pages/KoreanGenzPage";
import AIKoreanEnginePage from "./pages/AIKoreanEnginePage";
import DashboardLayout from "./components/DashboardLayout";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/korean-genz"} component={KoreanGenzPage} />
      <Route path={"/ai-korean"} component={AIKoreanEnginePage} />
      <Route path={"/immersion-updates"} component={ImmersionUpdates} />
      <Route path={"/files"}>
        <DashboardLayout>
          <FilesPage />
        </DashboardLayout>
      </Route>
      <Route path={"/daily"}>
        <DashboardLayout>
          <DailyContentPage />
        </DashboardLayout>
      </Route>
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;