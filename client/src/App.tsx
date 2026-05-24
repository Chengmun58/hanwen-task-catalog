import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import KoreanGenzPage from "./pages/KoreanGenzPage";
import AIKoreanEnginePage from "./pages/AIKoreanEnginePage";
import KoreanOSPolishedPage from "./pages/KoreanOSPolishedPage";

function Router() {
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
      <Router />
    </ErrorBoundary>
  );
}

export default App;
