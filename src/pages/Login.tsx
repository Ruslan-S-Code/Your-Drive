import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authAPI } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/Header";
import Footer from "../components/Footer";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const navigate = useNavigate();
  const { session } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await authAPI.login(email, password);
      navigate("/");
      window.location.reload(); // Reload to update auth context
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResetSuccess(false);

    try {
      await authAPI.resetPasswordRequest(resetEmail);
      setResetSuccess(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (session) {
    navigate("/");
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen relative">
      <Header />
      <main className="flex-grow flex items-center justify-center relative min-h-[calc(100vh-80px)] py-6 md:py-8 px-4 sm:px-6 lg:px-8">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: 'url(/hero-3.png)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 via-gray-800/85 to-gray-900/90" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </div>

        {/* Login Form Card */}
        <div className="relative z-10 max-w-md w-full">
          <div className="bg-white/10 dark:bg-gray-900/30 backdrop-blur-xl rounded-2xl shadow-elegant-xl border border-white/20 dark:border-gray-700/50 p-8 md:p-10 space-y-6">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-2">
                Anmelden
              </h2>
              <p className="text-gray-200 text-sm md:text-base">
                Willkommen zurück! Bitte melden Sie sich an, um fortzufahren.
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/20 backdrop-blur-sm border border-red-400/30 p-4">
                <div className="text-sm text-red-100">
                  {error}
                </div>
              </div>
            )}

            {resetSuccess && (
              <div className="rounded-lg bg-green-500/20 backdrop-blur-sm border border-green-400/30 p-4">
                <div className="text-sm text-green-100">
                  E-Mail zum Zurücksetzen des Passworts wurde gesendet. Bitte überprüfen Sie Ihren Posteingang.
                </div>
              </div>
            )}

            {isResetPassword ? (
              <form className="space-y-6" onSubmit={handleResetPassword}>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-200 mb-2"
                  >
                    E-Mail-Adresse
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none block w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg shadow-sm placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-all"
                    placeholder="ihre@email.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-base font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Wird gesendet..." : "Link senden"}
                  </button>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setIsResetPassword(false)}
                    className="text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    Zurück zur Anmeldung
                  </button>
                </div>
              </form>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="appearance-none relative block w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-all"
                      placeholder="E-Mail-Adresse"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="appearance-none relative block w-full px-4 py-3 pr-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-all"
                      placeholder="Passwort"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-300 hover:text-white transition-colors"
                    >
                      {showPassword ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsResetPassword(true)}
                    className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                  >
                    Passwort vergessen?
                  </button>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-base font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Anmeldung läuft..." : "Anmelden"}
                  </button>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <p className="text-center text-sm text-gray-300">
                    Haben Sie noch kein Konto?{" "}
                    <Link
                      to="/register"
                      className="font-medium text-orange-400 hover:text-orange-300 transition-colors underline"
                    >
                      Jetzt registrieren
                    </Link>
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Login;
