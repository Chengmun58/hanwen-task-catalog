import { Route, Router, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import KoreanGenzPage from "./pages/KoreanGenzPage";
import AIKoreanEnginePage from "./pages/AIKoreanEnginePage";
import KoreanOSPolishedPage from "./pages/KoreanOSPolishedPage";

// Strip trailing slash from base for wouter
const base = import.meta.env.BASE_URL.replace(/\/$/, "");

function AppRouter() {
  return (
    <Switch>
      <Route path={"/"} component={AIKoreanEnginePage} />
      <Route path={"/ai-korean"} component={AIKoreanEnginePage} />
      <Route path={"/korean-genz"} component={KoreanGenzPage} />
      <Route path={"/routines"} component={KoreanOSPolishedPage} />
      <Route component={AIKoreanEnginePage} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router base={base}>
        <AppRouter />
      </Router>
    </ErrorBoundary>
  );
}

export default App;
