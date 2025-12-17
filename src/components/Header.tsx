import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useNotifications } from "../contexts/NotificationContext";
import { FiSun, FiMoon, FiBell, FiUser, FiMenu, FiX } from "react-icons/fi";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { session, loading, handleLogout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const { unreadCount } = useNotifications();

  const handleNotificationClick = () => {
    if (session) {
      // Если пользователь залогинен, переходим в личный кабинет на вкладку обновлений
      navigate('/profile?tab=updates');
    } else {
      // Если не залогинен, перенаправляем на страницу входа
      navigate('/login');
    }
  };

  return (
    <header className="bg-black backdrop-blur-strong shadow-elegant sticky top-0 z-50 border-b border-gray-800/50">
      <div className="container mx-auto px-4 py-3 md:py-4">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center"
          >
            <img 
              src="/logo.png" 
              alt="Your Drive" 
              className="h-10 md:h-12 w-auto"
            />
          </Link>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 border-r border-gray-700 pr-4 mr-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-gray-800 transition-colors w-[40px] h-[40px] flex items-center justify-center"
                title={
                  theme === "light"
                    ? "Switch to dark mode"
                    : "Switch to light mode"
                }
              >
                {theme === "light" ? (
                  <FiMoon className="w-5 h-5 text-gray-300" />
                ) : (
                  <FiSun className="w-5 h-5 text-gray-300" />
                )}
              </button>
            </div>

            <button
              onClick={handleNotificationClick}
              className="p-2 rounded-full hover:bg-gray-800 transition-colors relative w-[40px] h-[40px] flex items-center justify-center"
              title="Benachrichtigungen"
            >
              <FiBell className="w-5 h-5 text-gray-300" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {!loading && (
              <div className="flex items-center space-x-2 pl-2">
                {session ? (
                  <>
                    <Link
                      to="/profile"
                      className="w-[40px] h-[40px] rounded-full hover:bg-gray-800 transition-colors flex items-center justify-center overflow-hidden"
                      title="My Account"
                    >
                      {user?.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt="Profile"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "";
                            target.parentElement?.classList.add(
                              "bg-gray-200",
                              "dark:bg-gray-700"
                            );
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <FiUser className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </div>
                      )}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                    >
                      {t("auth.logout")}
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                  >
                    {t("auth.login")}
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center"
          >
            <img 
              src="/logo.png" 
              alt="Your Drive" 
              className="h-8 w-auto"
            />
          </Link>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-full hover:bg-gray-800 transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <FiX className="w-5 h-5 text-gray-300" />
              ) : (
                <FiMenu className="w-5 h-5 text-gray-300" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-700 pt-4">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">
                  Theme
                </span>
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-full hover:bg-gray-800 transition-colors"
                >
                  {theme === "light" ? (
                    <FiMoon className="w-5 h-5 text-gray-300" />
                  ) : (
                    <FiSun className="w-5 h-5 text-gray-300" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">
                  Language
                </span>
                <button
                  onClick={toggleLanguage}
                  className="px-3 py-1 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  {language.toUpperCase()}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">
                  Benachrichtigungen
                </span>
                <button
                  onClick={handleNotificationClick}
                  className="p-2 rounded-full hover:bg-gray-800 transition-colors relative"
                  title="Benachrichtigungen"
                >
                  <FiBell className="w-5 h-5 text-gray-300" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              </div>

              {!loading && (
                <div className="pt-3 border-t border-gray-700">
                  {session ? (
                    <>
                      <Link
                        to="/profile"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        {user?.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt="Profile"
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "";
                              target.parentElement?.classList.add(
                                "bg-gray-700"
                              );
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                            <FiUser className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <span className="text-sm font-medium text-gray-300">
                          My Account
                        </span>
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full text-left text-sm font-medium text-gray-300 hover:text-orange-500 transition-colors p-2 rounded-lg hover:bg-gray-800"
                      >
                        {t("auth.logout")}
                      </button>
                    </>
                  ) : (
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-sm font-medium text-gray-300 hover:text-orange-500 transition-colors p-2 rounded-lg hover:bg-gray-800"
                    >
                      {t("auth.login")}
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
