import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { authAPI, profilesAPI, getAuthToken, removeAuthToken, Profile } from "../lib/api";

interface User extends Profile {
  id: string;
  email: string;
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  session: { user: { id: string; email: string } } | null;
  loading: boolean;
  error: Error | null;
  handleLogout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<User | null>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  error: null,
  handleLogout: async () => {},
  updateProfile: async () => null,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<{ user: { id: string; email: string } } | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Обновляем профиль пользователя
  const updateProfile = async (updates: Partial<User>) => {
    try {
      setError(null);
      if (!user?.id) throw new Error("No user logged in");

      const updatedProfile = await profilesAPI.updateUserProfile(user.id, updates);

      if (updatedProfile) {
        setUser((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            ...updatedProfile,
            id: prev.id,
            email: updatedProfile.email || prev.email,
            created_at: prev.created_at,
          };
        });
      }

      return updatedProfile as User;
    } catch (error) {
      console.error("Error updating profile:", error);
      setError(
        error instanceof Error
          ? error
          : typeof error === 'object' && error !== null && 'message' in error
          ? new Error((error as any).message)
          : new Error(JSON.stringify(error))
      );
      if (error instanceof Error) {
        alert(error.message);
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        alert((error as any).message);
      } else {
        alert(JSON.stringify(error));
      }
      throw error;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setError(null);
        const token = getAuthToken();

        if (token) {
          // Try to get current user
          try {
            const userData = await authAPI.getCurrentUser();
            if (mounted && userData) {
              setUser({
                ...userData,
                id: userData.id,
                email: userData.email,
                created_at: userData.created_at,
              });
              setSession({
                user: {
                  id: userData.id,
                  email: userData.email,
                },
              });
            }
          } catch (error) {
            // Token is invalid, remove it
            removeAuthToken();
            if (mounted) {
              setUser(null);
              setSession(null);
            }
          }
        }
      } catch (error) {
        console.error("Auth error:", error);
        if (mounted) {
          setError(
            error instanceof Error ? error : new Error("Authentication failed")
          );
          setUser(null);
          setSession(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();
  }, []);

  const handleLogout = async () => {
    try {
      setError(null);
      await authAPI.logout();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error("Logout error:", error);
      setError(error instanceof Error ? error : new Error("Logout failed"));
    }
  };

  const value = {
    user,
    session,
    loading,
    error,
    handleLogout,
    updateProfile,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 dark:border-gray-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Authentication Error
          </h1>
          <p className="text-gray-600 dark:text-gray-300">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-gray-700 dark:bg-gray-600 text-white rounded hover:bg-gray-800 dark:hover:bg-gray-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
