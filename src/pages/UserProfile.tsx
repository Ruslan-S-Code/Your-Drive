import { useState, useEffect, useCallback } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ReviewForm from "../components/ReviewForm";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from "../contexts/NotificationContext";
import {
  profilesAPI,
  bookingsAPI,
  storageAPI,
  reviewsAPI,
  favoritesAPI,
  Profile,
  Booking,
  Vehicle,
  getImageUrl,
} from "../lib/api";
import { useNavigate, useSearchParams } from "react-router-dom";
import ReactCountryFlag from "react-country-flag";
import { countryCodes, countries } from "./countryData";
import { FaHeart, FaSuitcase, FaCalendar, FaBook, FaHeadphones, FaBell, FaUser } from "react-icons/fa";
import { TbManualGearbox, TbAutomaticGearbox } from "react-icons/tb";

// Тип для бронирования с данными автомобиля
// -> Buchungstyp mit Fahrzeugdaten
type BookingWithVehicle = Booking & { vehicles: Vehicle | null };

const UserProfile = () => {
  const { user, loading: authLoading, session, updateProfile } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [bookings, setBookings] = useState<BookingWithVehicle[]>([]);
  const [activeTab, setActiveTab] = useState<"booking" | "account" | "favorites" | "updates">("booking");
  const [favorites, setFavorites] = useState<Vehicle[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    address: "",
    countryCode: "",
    country: "",
    zipCode: "",
    city: "",
    state: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [manualCodeInput, setManualCodeInput] = useState("");

  // Функция для определения страны по коду телефона
  const detectCountryByPhoneCode = (phoneCode: string): string | null => {
    if (!phoneCode) return null;
    const code = phoneCode.trim().replace(/^\+/, '');
    const country = countryCodes.find(c => c.phone.replace(/^\+/, '') === code);
    return country ? country.code : null;
  };

  // Обработчик выбора страны из списка
  const handleCountrySelect = (countryCode: string) => {
    setFormData(prev => ({ ...prev, countryCode }));
    setIsCountryModalOpen(false);
    setCountrySearch("");
    setManualCodeInput("");
  };

  // Обработчик ручного ввода кода
  const handleManualCodeSubmit = () => {
    if (!manualCodeInput.trim()) return;
    
    const code = manualCodeInput.trim().startsWith('+') 
      ? manualCodeInput.trim() 
      : `+${manualCodeInput.trim()}`;
    
    const detectedCountry = detectCountryByPhoneCode(code);
    
    if (detectedCountry) {
      handleCountrySelect(detectedCountry);
    } else {
      // Если страна не найдена, все равно сохраняем код
      const country = countryCodes.find(c => c.phone === code);
      if (country) {
        handleCountrySelect(country.code);
      } else {
        // Показываем сообщение, что страна не найдена, но позволяем использовать код
        alert(`Страна для кода ${code} не найдена. Выберите страну из списка.`);
      }
    }
  };

  // Проверяем query параметр для открытия нужной вкладки
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'updates' && (activeTab !== 'updates')) {
      setActiveTab('updates');
    }
  }, [searchParams]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'event':
        return <FaCalendar className="w-5 h-5" />;
      case 'blog':
        return <FaBook className="w-5 h-5" />;
      case 'podcast':
        return <FaHeadphones className="w-5 h-5" />;
      default:
        return <FaBell className="w-5 h-5" />;
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Gerade eben';
    if (minutes < 60) return `vor ${minutes} Min`;
    if (hours < 24) return `vor ${hours} Std`;
    if (days < 7) return `vor ${days} Tagen`;
    return date.toLocaleDateString('de-DE');
  };

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    navigate(notification.link);
  };

  // Функция загрузки профиля
  // -> Profil-Ladefunktion
  const loadProfile = useCallback(
    async (userId: string) => {
      try {
        const data = await profilesAPI.getUserProfile(userId);
        setProfile(data);
        // Заполняем форму начальными данными
        setFormData({
          fullName: data?.full_name || "",
          lastName: data?.last_name || "",
          phoneNumber: data?.phone_number || "",
          email: user?.email || "",
          address: data?.address || "",
          countryCode: data?.country_code || "",
          country: data?.country || "",
          zipCode: data?.zip_code || "",
          city: data?.city || "",
          state: data?.state || "",
        });
        setAvatarPreview(data?.avatar_url || null);
        setAvatarFile(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading profile");
        console.error(err);
      }
    },
    [user?.email]
  );

  // Функция загрузки бронирований
  // -> Funktion zum Laden der Buchungen
  const loadBookings = useCallback(async (userId: string) => {
    try {
      const data = await bookingsAPI.getUserBookings(userId);
      setBookings(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading bookings");
      console.error(err);
    }
  }, []);

  // Функция загрузки избранных автомобилей
  const loadFavorites = useCallback(async () => {
    try {
      setLoadingFavorites(true);
      const data = await favoritesAPI.getFavorites();
      setFavorites(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading favorites");
      console.error(err);
    } finally {
      setLoadingFavorites(false);
    }
  }, []);

  // Загрузка данных при доступности пользователя
  // -> Daten werden geladen, wenn der Benutzer verfügbar ist
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    } else if (!authLoading && user) {
      setIsLoading(true);
      setError(null);
      Promise.all([
        loadProfile(user.id),
        loadBookings(user.id),
        loadFavorites()
      ])
        .catch((err) => {
          console.error("Error loading profile/bookings:", err);
        })
        .finally(() => setIsLoading(false));
    }
    // ВАЖНО: не добавлять loadProfile и loadBookings в зависимости, чтобы не было циклов
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, navigate]);

  // Обработка изменений формы
  // -> Formularänderungen verarbeiten
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      // Создаем превью
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // Если файл не выбран (например, отмена), возвращаем старое превью
      setAvatarFile(null);
      setAvatarPreview(profile?.avatar_url || null);
    }
  };

  // Сохранение профиля
  // -> Profil speichern
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !session) {
      setError("Нет пользователя или сессии");
      return;
    }

    setIsSaving(true);
    setError(null);
    let avatarUrl = profile?.avatar_url;

    try {
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar(avatarFile);
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
        } else {
          throw new Error("Avatar upload failed.");
        }
      }

      const profileData = {
        full_name: formData.fullName || null,
        last_name: formData.lastName || null,
        phone_number: formData.phoneNumber || null,
        avatar_url: avatarUrl || null,
        address: formData.address || null,
        country_code: formData.countryCode || null,
        country: formData.country || null,
        zip_code: formData.zipCode || null,
        city: formData.city || null,
        state: formData.state || null,
      };

      const updatedProfile = await updateProfile(profileData);

      if (!updatedProfile) {
        throw new Error("Failed to update profile");
      }

      setProfile(updatedProfile);
      setAvatarFile(null);
      setAvatarPreview(avatarUrl || null);
      setFormData({
        fullName: updatedProfile.full_name || "",
        lastName: updatedProfile.last_name || "",
        phoneNumber: updatedProfile.phone_number || "",
        email: user?.email || "",
        address: updatedProfile.address || "",
        countryCode: updatedProfile.country_code || "",
        country: updatedProfile.country || "",
        zipCode: updatedProfile.zip_code || "",
        city: updatedProfile.city || "",
        state: updatedProfile.state || "",
      });
    } catch (error: unknown) {
      console.error("Error in handleSaveProfile:", error);
      if (error instanceof Error) {
        alert(error.message);
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        alert((error as any).message);
      } else {
        alert(JSON.stringify(error));
      }
      setError(
        `Error saving profile: ` +
          (error instanceof Error
            ? error.message
            : typeof error === 'object' && error !== null && 'message' in error
            ? (error as any).message
            : JSON.stringify(error))
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Функция загрузки аватара
  // -> Avatar-Upload-Funktion
  const uploadAvatar = async (
    file: File
  ): Promise<string | null> => {
    try {
      // Валидация файла
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file");
        return null;
      }

      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        setError("File size should be less than 5MB");
        return null;
      }

      setIsUploading(true);
      const url = await storageAPI.uploadAvatar(file);
      return url;
    } catch (error) {
      console.error("Error uploading avatar:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Error uploading avatar. Please try again."
      );
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Фильтрация бронирований
  // -> Buchungsfilterung
  const upcomingBookings = bookings.filter(
    (b) => new Date(b.pickup_date) >= new Date() && b.status !== 'completed'
  );
  const completedBookings = bookings.filter(
    (b) => b.status === 'completed'
  );
  const pastBookings = bookings.filter(
    (b) => new Date(b.pickup_date) < new Date() && b.status !== 'completed'
  );

  // --- Рендеринг --- //
  // -> --- Rendering --- //
  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto py-12 px-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading user data...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) return null;

  // Функция удаления аккаунта
  const handleDeleteAccount = async () => {
    if (!window.confirm("Sind Sie sicher, dass Sie Ihr Konto löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.")) {
      return;
    }

    setIsDeleting(true);
    setError(null);
    try {
      // TODO: Реализовать API для удаления аккаунта
      // await authAPI.deleteAccount(user.id);
      alert("Функция удаления аккаунта будет реализована позже");
      // После удаления перенаправить на главную страницу
      // navigate("/");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Fehler beim Löschen des Kontos"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Background Image with Overlay */}
      <div className="fixed inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/hero-4.png)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/85 via-gray-800/80 to-gray-900/85" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>
      <Header />
      <main className="flex-grow container mx-auto py-4 md:py-8 px-4 relative z-10">
        {error && (
          <div
            className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-3 md:px-4 py-2 md:py-3 rounded relative mb-4 md:mb-6 text-sm md:text-base"
            role="alert"
          >
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 relative z-10">
          {/* Mobile: Compact card-style tabs */}
          <div className="md:hidden">
            <div className="bg-white/10 dark:bg-gray-900/20 backdrop-blur-md rounded-xl p-1.5 shadow-lg border border-white/10 dark:border-gray-700/30">
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  onClick={() => {
                    setActiveTab("booking");
                    setSearchParams({});
                  }}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-lg transition-all duration-200 ${
                    activeTab === "booking"
                      ? "bg-orange-500 text-white shadow-md shadow-orange-500/30 scale-105"
                      : "text-white/70 dark:text-gray-300/70 hover:text-white dark:hover:text-gray-100 hover:bg-white/5"
                  }`}
                >
                  <FaCalendar className={`w-4 h-4 mb-1 ${activeTab === "booking" ? "scale-110" : ""}`} />
                  <span className="text-xs font-medium">Buchungen</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("favorites");
                    setSearchParams({});
                  }}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-lg transition-all duration-200 relative ${
                    activeTab === "favorites"
                      ? "bg-orange-500 text-white shadow-md shadow-orange-500/30 scale-105"
                      : "text-white/70 dark:text-gray-300/70 hover:text-white dark:hover:text-gray-100 hover:bg-white/5"
                  }`}
                >
                  <FaHeart className={`w-4 h-4 mb-1 ${activeTab === "favorites" ? "scale-110" : ""}`} />
                  <span className="text-xs font-medium">Favoriten</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("updates");
                    setSearchParams({ tab: 'updates' });
                  }}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-lg transition-all duration-200 relative ${
                    activeTab === "updates"
                      ? "bg-orange-500 text-white shadow-md shadow-orange-500/30 scale-105"
                      : "text-white/70 dark:text-gray-300/70 hover:text-white dark:hover:text-gray-100 hover:bg-white/5"
                  }`}
                >
                  <FaBell className={`w-4 h-4 mb-1 ${activeTab === "updates" ? "scale-110" : ""}`} />
                  <span className="text-xs font-medium">Updates</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold border-2 border-white/20 dark:border-gray-900/50">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setActiveTab("account");
                    setSearchParams({});
                  }}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-lg transition-all duration-200 ${
                    activeTab === "account"
                      ? "bg-orange-500 text-white shadow-md shadow-orange-500/30 scale-105"
                      : "text-white/70 dark:text-gray-300/70 hover:text-white dark:hover:text-gray-100 hover:bg-white/5"
                  }`}
                >
                  <FaUser className={`w-4 h-4 mb-1 ${activeTab === "account" ? "scale-110" : ""}`} />
                  <span className="text-xs font-medium">Konto</span>
                </button>
              </div>
            </div>
          </div>

          {/* Desktop: Traditional horizontal tabs */}
          <div className="hidden md:block border-b border-white/20 dark:border-gray-700/50">
            <div className="flex space-x-1 overflow-x-auto bg-white/10 dark:bg-gray-900/20 backdrop-blur-sm rounded-t-lg px-2 pt-2">
              <button
                onClick={() => {
                  setActiveTab("booking");
                  setSearchParams({});
                }}
                className={`px-6 py-3 text-sm font-medium transition-smooth whitespace-nowrap ${
                  activeTab === "booking"
                    ? "border-b-2 border-orange-500 text-orange-500 dark:text-orange-400 font-semibold bg-white/20 dark:bg-gray-800/30"
                    : "text-white dark:text-gray-200 hover:text-orange-400 dark:hover:text-orange-300"
                }`}
              >
                Buchungen
              </button>
              <button
                onClick={() => {
                  setActiveTab("favorites");
                  setSearchParams({});
                }}
                className={`px-6 py-3 text-sm font-medium transition-smooth whitespace-nowrap ${
                  activeTab === "favorites"
                    ? "border-b-2 border-orange-500 text-orange-500 dark:text-orange-400 font-semibold bg-white/20 dark:bg-gray-800/30"
                    : "text-white dark:text-gray-200 hover:text-orange-400 dark:hover:text-orange-300"
                }`}
              >
                Favoriten
              </button>
              <button
                onClick={() => {
                  setActiveTab("updates");
                  setSearchParams({ tab: 'updates' });
                }}
                className={`px-6 py-3 text-sm font-medium transition-smooth whitespace-nowrap relative ${
                  activeTab === "updates"
                    ? "border-b-2 border-orange-500 text-orange-500 dark:text-orange-400 font-semibold bg-white/20 dark:bg-gray-800/30"
                    : "text-white dark:text-gray-200 hover:text-orange-400 dark:hover:text-orange-300"
                }`}
              >
                Aktualisierungen
                {unreadCount > 0 && (
                  <span className="ml-2 w-5 h-5 bg-red-500 rounded-full inline-flex items-center justify-center text-xs text-white font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  setActiveTab("account");
                  setSearchParams({});
                }}
                className={`px-6 py-3 text-sm font-medium transition-smooth whitespace-nowrap ${
                  activeTab === "account"
                    ? "border-b-2 border-orange-500 text-orange-500 dark:text-orange-400 font-semibold bg-white/20 dark:bg-gray-800/30"
                    : "text-white dark:text-gray-200 hover:text-orange-400 dark:hover:text-orange-300"
                }`}
              >
                Konto
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "booking" && (
          <div className="space-y-4 md:space-y-6">
            {/* Add booking section */}
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-4 md:p-6 rounded-lg shadow-elegant-lg border border-white/20 dark:border-gray-700/50">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                    Add booking
                  </h3>
                  {upcomingBookings.length === 0 && completedBookings.length === 0 && pastBookings.length === 0 ? (
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">
                        No new bookings
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        Your upcoming rentals will appear here. Make a new booking today!
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      Create a new booking to rent a vehicle
                    </p>
                  )}
                </div>
                <button
                  onClick={() => navigate("/search")}
                  className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition-smooth shadow-elegant hover:shadow-glow-orange button-press whitespace-nowrap"
                >
                  Book Now
                </button>
              </div>
            </div>

            {/* Vorstehende Buchungen */}
            {upcomingBookings.length > 0 && (
              <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-4 md:p-6 rounded-lg shadow-elegant-lg border border-white/20 dark:border-gray-700/50">
                <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-gray-900 dark:text-white">
                  Vorstehende Buchungen
                </h2>
                <div className="space-y-4">
                  {upcomingBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              </div>
            )}

            {/* Abgeschlossene Buchungen */}
            {completedBookings.length > 0 && (
              <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-4 md:p-6 rounded-lg shadow-elegant-lg border border-white/20 dark:border-gray-700/50">
                <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-gray-900 dark:text-white">
                  Abgeschlossene Buchungen
                </h2>
                <div className="space-y-4">
                  {completedBookings.map((booking) => (
                    <BookingCard 
                      key={booking.id} 
                      booking={booking} 
                      onReviewSubmitted={() => {
                        if (user) {
                          loadBookings(user.id);
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Vergangene Buchungen */}
            {pastBookings.length > 0 && (
              <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-4 md:p-6 rounded-lg shadow-elegant-lg border border-white/20 dark:border-gray-700/50">
                <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-gray-900 dark:text-white">
                  Vergangene Buchungen
                </h2>
                <div className="space-y-4">
                  {pastBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {activeTab === "favorites" && (
          <div className="space-y-4 md:space-y-6">
            <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-gray-900 dark:text-white">
              Favorites
            </h2>
            {loadingFavorites ? (
              <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-8 rounded-lg shadow-elegant-lg text-center border border-white/20 dark:border-gray-700/50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                <p className="mt-4 text-gray-500 dark:text-gray-400">Loading favorites...</p>
              </div>
            ) : favorites.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {favorites.map((vehicle) => {
                  const carData = {
                    rating: vehicle.rating || 4.2,
                    capacity: vehicle.seats || 5,
                    fuel: vehicle.fuel || "Gasoline",
                    doors: vehicle.doors || 4,
                    transmission: vehicle.geartype || "Manuell",
                    color: vehicle.colors || "Blau/Grau",
                    price: vehicle.priceperday || 50,
                    year: vehicle.year || null,
                    horsepower: vehicle.horstpower || vehicle.ps || null,
                    luggage: vehicle.luggage || null,
                  };

                  return (
                    <div
                      key={vehicle.id}
                      className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg overflow-hidden shadow-elegant-lg border border-white/20 dark:border-gray-700/50 hover:shadow-glow-orange "
                    >
                      <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16/9' }}>
                        <img
                          src={vehicle.carimg ? getImageUrl(vehicle.carimg) : `https://source.unsplash.com/random/800x600/?car,${vehicle.brand},${vehicle.model}`}
                          alt={`${vehicle.brand} ${vehicle.model}`}
                          className="absolute inset-0 w-full h-full object-cover cursor-pointer"
                          style={{ objectPosition: 'center 55%' }}
                          onClick={() => navigate(`/cars/${vehicle.id}`)}
                        />
                      </div>
                      <div className="p-4 md:p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 
                              className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-1 cursor-pointer hover:text-orange-500 transition-colors"
                              onClick={() => navigate(`/cars/${vehicle.id}`)}
                            >
                              {vehicle.brand} {vehicle.model}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {vehicle.vehicletype || "Car"}
                            </p>
                          </div>
                          <button
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (session) {
                                try {
                                  await favoritesAPI.removeFavorite(vehicle.id);
                                  await loadFavorites();
                                } catch (error) {
                                  console.error("Error removing favorite:", error);
                                }
                              }
                            }}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0 ml-2"
                            title="Remove from favorites"
                          >
                            <FaHeart className="w-5 h-5 text-red-500 fill-red-500" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4">
                          <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm">Sitzplätze</p>
                            <p className="font-medium text-gray-900 dark:text-white text-sm md:text-base">
                              {carData.capacity}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm">Motor</p>
                            <p className="font-medium text-gray-900 dark:text-white text-sm md:text-base">
                              {carData.fuel}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm">Türen</p>
                            <p className="font-medium text-gray-900 dark:text-white text-sm md:text-base">
                              {carData.doors}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm">
                              Getriebe
                            </p>
                            <p className="font-medium text-gray-900 dark:text-white text-sm md:text-base flex items-center">
                              {carData.transmission}
                              {carData.transmission?.toLowerCase().includes('manual') ? (
                                <TbManualGearbox className="ml-1" size={16} />
                              ) : carData.transmission?.toLowerCase().includes('automatic') ? (
                                <TbAutomaticGearbox className="ml-1" size={16} />
                              ) : null}
                            </p>
                          </div>
                          {carData.year && (
                            <div>
                              <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm">Jahr</p>
                              <p className="font-medium text-gray-900 dark:text-white text-sm md:text-base">
                                {carData.year}
                              </p>
                            </div>
                          )}
                          {carData.horsepower && (
                            <div>
                              <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm">Leistung</p>
                              <p className="font-medium text-gray-900 dark:text-white text-sm md:text-base">
                                {carData.horsepower} {typeof carData.horsepower === 'number' ? 'PS' : ''}
                              </p>
                            </div>
                          )}
                          {carData.luggage && (
                            <div>
                              <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm">
                                Kofferraum
                              </p>
                              <p className="font-medium text-gray-900 dark:text-white text-sm md:text-base flex items-center">
                                {carData.luggage} Stk
                                <FaSuitcase className="ml-1" size={12} />
                              </p>
                            </div>
                          )}
                          {carData.color && (
                            <div>
                              <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm">Farbe</p>
                              <p className="font-medium text-gray-900 dark:text-white text-sm md:text-base">
                                {carData.color}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2">
                            <span className="text-xl md:text-2xl font-bold text-white">
                              €{carData.price}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">/Tag</span>
                          </div>
                          <button
                            onClick={() => navigate(`/cars/${vehicle.id}`)}
                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-smooth shadow-elegant hover:shadow-glow-orange button-press"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-8 rounded-lg shadow-elegant-lg text-center border border-white/20 dark:border-gray-700/50">
                <p className="text-gray-500 dark:text-gray-400">
                  No favorites yet. Start adding vehicles to your favorites!
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "updates" && (
          <div className="space-y-4 md:space-y-6">
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-4 md:p-6 rounded-lg shadow-elegant-lg border border-white/20 dark:border-gray-700/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Aktualisierungen
                </h2>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-orange-500 hover:text-orange-600 dark:hover:text-orange-400 font-medium"
                  >
                    Alle als gelesen markieren
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <FaBell className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
                    Keine Benachrichtigungen
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm">
                    Sie erhalten Benachrichtigungen über neue Veranstaltungen, Blog-Artikel und Podcast-Episoden.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                        !notification.read
                          ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                          : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`flex-shrink-0 p-3 rounded-lg ${
                          !notification.read
                            ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400'
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                        }`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className={`text-base font-semibold mb-1 ${
                                !notification.read
                                  ? 'text-gray-900 dark:text-white'
                                  : 'text-gray-600 dark:text-gray-400'
                              }`}>
                                {notification.title}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                                {notification.description}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                {formatDate(notification.date)}
                              </p>
                            </div>
                            {!notification.read && (
                              <span className="ml-2 w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-2"></span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "account" && (
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-4 md:p-6 rounded-lg shadow-elegant-lg max-w-2xl mx-auto border border-white/20 dark:border-gray-700/50">
            <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-gray-900 dark:text-white">
              Persönliche Informationen
            </h2>

            {/* Avatar */}
            <div className="mb-6 text-center">
              <img
                src={
                  avatarPreview ||
                  "https://via.placeholder.com/150?text=No+Avatar"
                }
                alt="Avatar"
                className="w-24 h-24 rounded-full mx-auto object-cover border-2 border-gray-300 dark:border-gray-600 shadow-elegant"
              />
              <label
                htmlFor="avatarUpload"
                className="mt-3 inline-block text-sm text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 cursor-pointer transition-colors"
              >
                Avatar ändern
              </label>
              <input
                id="avatarUpload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {isUploading && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Uploading...
                </p>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-elegant"
                    placeholder="Ihr Name"
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Nachname
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-elegant"
                    placeholder="Ihr Nachname"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                >
                  E-Mail
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-elegant"
                  placeholder="ihre.email@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                >
                  Adresse
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-elegant"
                  placeholder="Straße und Hausnummer"
                />
              </div>

              <div>
                <label
                  htmlFor="country"
                  className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                >
                  Country
                </label>
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-elegant appearance-none cursor-pointer"
                >
                  <option value="">Bitte wählen</option>
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="zipCode"
                    className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                  >
                    ZIP code
                  </label>
                  <input
                    type="text"
                    id="zipCode"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-elegant"
                    placeholder="12345"
                  />
                </div>
                <div>
                  <label
                    htmlFor="city"
                    className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                  >
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-elegant"
                    placeholder="Berlin"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="state"
                  className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                >
                  State
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-elegant"
                  placeholder="Bundesland / State"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-4">
                <div>
                  <label
                    htmlFor="countryCode"
                    className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Ländercode
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCountryModalOpen(true)}
                    className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 pl-10 pr-4 text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-elegant cursor-pointer text-left flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {formData.countryCode ? (
                        <>
                          <ReactCountryFlag
                            countryCode={formData.countryCode}
                            svg
                            style={{
                              width: '1.25rem',
                              height: '1rem',
                            }}
                          />
                          <span>
                            {countryCodes.find(c => c.code === formData.countryCode)?.phone || formData.countryCode}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-400">--</span>
                      )}
                    </div>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                <div>
                  <label
                    htmlFor="phoneNumber"
                    className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Telefonnummer
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-elegant"
                    placeholder="123 456789"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSaving || isUploading}
                  className={`flex-1 px-6 py-3 rounded-xl text-white font-medium transition-smooth shadow-elegant hover:shadow-glow-orange button-press ${
                    isSaving || isUploading
                      ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                      : "bg-orange-500 hover:bg-orange-600"
                  }`}
                >
                  {isSaving
                    ? "Speichern..."
                    : isUploading
                    ? "Uploading..."
                    : "Speichern"}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className={`px-6 py-3 rounded-xl text-white font-medium transition-smooth shadow-elegant button-press ${
                    isDeleting
                      ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                      : "bg-red-500 hover:bg-red-600"
                  }`}
                >
                  {isDeleting ? "Löschen..." : "Konto löschen"}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Country Code Selection Modal */}
      {isCountryModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setIsCountryModalOpen(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Ländercode auswählen
                </h3>
                <button
                  onClick={() => setIsCountryModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Manual Code Input Section */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Code manuell eingeben
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualCodeInput}
                  onChange={(e) => setManualCodeInput(e.target.value)}
                  placeholder="+49 oder 49"
                  className="flex-1 border-2 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleManualCodeSubmit();
                    }
                  }}
                />
                <button
                  onClick={handleManualCodeSubmit}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors"
                >
                  Suchen
                </button>
              </div>
              {manualCodeInput && detectCountryByPhoneCode(manualCodeInput) && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                  ✓ {countryCodes.find(c => c.code === detectCountryByPhoneCode(manualCodeInput))?.name}
                </p>
              )}
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <input
                type="text"
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                placeholder="Land oder Code suchen..."
                className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                autoFocus
              />
            </div>

            {/* Country List */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-1">
                {countryCodes
                  .filter(country => {
                    const searchLower = countrySearch.toLowerCase();
                    return (
                      country.name.toLowerCase().includes(searchLower) ||
                      country.code.toLowerCase().includes(searchLower) ||
                      country.phone.toLowerCase().includes(searchLower)
                    );
                  })
                  .map((country) => (
                    <button
                      key={country.code}
                      onClick={() => handleCountrySelect(country.code)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                        formData.countryCode === country.code
                          ? 'bg-orange-100 dark:bg-orange-900/30 border-2 border-orange-500'
                          : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-2 border-transparent'
                      }`}
                    >
                      <ReactCountryFlag
                        countryCode={country.code}
                        svg
                        style={{
                          width: '1.5rem',
                          height: '1.125rem',
                        }}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {country.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {country.code} • {country.phone}
                        </div>
                      </div>
                      {formData.countryCode === country.code && (
                        <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
};

// Komponente zur Anzeige der Buchungskarte (kann in eine separate Datei ausgelagert werden)
// -> Komponente zur Anzeige der Buchungskarte (kann in eine separate Datei ausgelagert werden)
const BookingCard = ({ 
  booking, 
  onReviewSubmitted 
}: { 
  booking: BookingWithVehicle;
  onReviewSubmitted?: () => void;
}) => {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [canReview, setCanReview] = useState<boolean | null>(null);
  const [isCheckingReview, setIsCheckingReview] = useState(false);
  const [hasReview, setHasReview] = useState(false);
  const [reviewReason, setReviewReason] = useState<string | null>(null);

  useEffect(() => {
    // Check if user can review this booking
    if (booking.status === 'completed' && booking.vehicles) {
      setIsCheckingReview(true);
      reviewsAPI
        .checkCanReview(String(booking.id))
        .then((result) => {
          setCanReview(result.canReview);
          setReviewReason(result.reason || null);
          if (!result.canReview && result.reviewId) {
            setHasReview(true);
          }
        })
        .catch((error) => {
          setCanReview(false);
          setReviewReason(error.message || 'Fehler beim Prüfen der Bewertungsmöglichkeit');
        })
        .finally(() => {
          setIsCheckingReview(false);
        });
    }
  }, [booking.id, booking.status, booking.vehicles]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const vehicleName = booking.vehicles
    ? `${booking.vehicles.brand} ${booking.vehicles.model}`
    : "Vehicle information unavailable";
  const vehicleImage = booking.vehicles?.carimg
    ? getImageUrl(booking.vehicles.carimg)
    : "https://via.placeholder.com/100x80?text=No+Image";

  const handleReviewSubmitted = async () => {
    setShowReviewForm(false);
    setCanReview(false);
    setHasReview(true);
    if (onReviewSubmitted) {
      await onReviewSubmitted();
    }
  };

  return (
    <div className="space-y-4">
      <div className="border border-white/20 dark:border-gray-600/50 rounded-lg p-3 md:p-4 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm">
        <img
          src={vehicleImage}
          alt={vehicleName}
          className="w-full sm:w-24 h-[147px] sm:h-24 object-cover rounded flex-shrink-0"
          onError={(e) => {
            // Fallback to placeholder if image fails to load
            const target = e.target as HTMLImageElement;
            target.src = "https://via.placeholder.com/100x147?text=No+Image";
          }}
        />
        <div className="flex-grow min-w-0">
          <h3 className="font-semibold text-sm md:text-base text-gray-900 dark:text-white">
            {vehicleName}
          </h3>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
            Status:{" "}
            <span
              className={`font-medium ${
                booking.status === "confirmed"
                  ? "text-green-600 dark:text-green-400"
                  : booking.status === "completed"
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {booking.status}
            </span>
          </p>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1 break-words">
            Pickup: {booking.pickup_location} ({formatDate(booking.pickup_date)})
          </p>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1 break-words">
            Return: {booking.dropoff_location} ({formatDate(booking.dropoff_date)})
          </p>
        </div>
        <div className="text-left sm:text-right flex-shrink-0">
          <p className="font-semibold text-sm md:text-base text-gray-900 dark:text-white">
            ${booking.total_price.toFixed(2)}
          </p>
          {booking.status === 'completed' && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              {isCheckingReview ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">Prüfe...</p>
              ) : canReview ? (
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="text-sm text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 transition-colors font-medium"
                >
                  {showReviewForm ? "Abbrechen" : "⭐ Bewertung abgeben"}
                </button>
              ) : hasReview ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">✓ Bewertung abgegeben</span>
                </div>
              ) : canReview === false && reviewReason ? (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {reviewReason}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {showReviewForm && canReview && booking.vehicles && (
        <div className="mt-4">
          <ReviewForm
            bookingId={booking.id}
            vehicleId={booking.vehicle_id}
            vehicleName={vehicleName}
            onReviewSubmitted={handleReviewSubmitted}
            onCancel={() => setShowReviewForm(false)}
          />
        </div>
      )}
    </div>
  );
};

export default UserProfile;
