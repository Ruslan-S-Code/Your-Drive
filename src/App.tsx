import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import CarDetailPage from "./pages/CarDetailPage";
import PaymentPage from "./pages/PaymentPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import HowItWorks from "./pages/HowItWorks";
import Featured from "./pages/Featured";
import Partnership from "./pages/Partnership";
import BusinessRelation from "./pages/BusinessRelation";
import UserProfile from "./pages/UserProfile";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { SearchProvider } from "./contexts/SearchContext";
import { ErrorBoundary } from "react-error-boundary";
import "./index.css";
import Events from "./pages/Events";
import Blog from "./pages/Blog";
import Podcast from "./pages/Podcast";
import Invite from "./pages/Invite";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          Etwas ist schiefgelaufen
        </h1>
        <pre className="text-sm text-gray-600 bg-gray-100 p-4 rounded">
          {error.message}
        </pre>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-gray-700 dark:bg-gray-600 text-white rounded hover:bg-gray-800 dark:hover:bg-gray-700"
        >
          Seite neu laden
        </button>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ThemeProvider>
        <LanguageProvider>
          <NotificationProvider>
            <SearchProvider>
              <AuthProvider>
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden flex flex-col">
                  <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/cars/:id" element={<CarDetailPage />} />
                <Route path="/payment/:id" element={<PaymentPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/featured" element={<Featured />} />
                <Route path="/partnership" element={<Partnership />} />
                <Route
                  path="/business-relation"
                  element={<BusinessRelation />}
                />
                <Route path="/profile" element={<UserProfile />} />
                <Route path="/events" element={<Events />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/podcast" element={<Podcast />} />
                <Route path="/invite" element={<Invite />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
              </Routes>
            </div>
            </AuthProvider>
            </SearchProvider>
          </NotificationProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
