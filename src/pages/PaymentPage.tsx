import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaStar, FaLock, FaCreditCard } from "react-icons/fa";
import { MdArrowBack, MdKeyboardArrowRight } from "react-icons/md";
import { IoCheckmarkCircle } from "react-icons/io5";
import { vehiclesAPI, bookingsAPI, profilesAPI, Vehicle, getImageUrl } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { useSearch } from "../contexts/SearchContext";

type PaymentStep = "billing" | "rental" | "addons" | "payment" | "confirmation";

export default function PaymentPage() {
  const [currentStep, setCurrentStep] = useState<PaymentStep>("billing");
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const { searchData, updateSearchData } = useSearch();

  // Проверка аутентификации при загрузке страницы
  useEffect(() => {
    if (!session && !user) {
      navigate('/login');
    }
  }, [session, user, navigate]);

  // Form states
  const [billingInfo, setBillingInfo] = useState({
    name: "",
    phoneNumber: "",
    address: "",
    town: "",
  });

  const [paymentMethod, setPaymentMethod] = useState<
    "credit" | "paypal" | "bitcoin"
  >("credit");

  const [agreements, setAgreements] = useState({
    marketing: false,
    terms: false,
  });

  // Add-ons state
  const [addOns, setAddOns] = useState<Record<string, boolean>>({
    additionalDriver: false,
    gps: false,
    babySeat: false,
    childSeat: false,
    boosterSeat: false,
    skiRack: false,
    bikeRack: false,
  });

  // Add-ons quantities (for items that can have multiple)
  const [addOnsQuantities, setAddOnsQuantities] = useState<Record<string, number>>({
    additionalDriver: 1,
    babySeat: 1,
    childSeat: 1,
    boosterSeat: 1,
    skiRack: 1,
    bikeRack: 1,
  });

  const [addOnsPrices] = useState({
    additionalDriver: 15,
    gps: 10,
    babySeat: 8,
    childSeat: 8,
    boosterSeat: 5,
    skiRack: 12,
    bikeRack: 12,
  });

  // Payment form states
  const [creditCardInfo, setCreditCardInfo] = useState({
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    cvv: "",
  });

  const [paypalEmail, setPaypalEmail] = useState("");
  const [bitcoinAddress, setBitcoinAddress] = useState("");

  // Preisliste
  const [priceDetails, setPriceDetails] = useState({
    basePrice: 100,
    tax: 0,
    addOnsTotal: 0,
    total: 100,
  });

  // Получаем список городов из vehicle.locations (только названия, без координат)
  const extractCityName = (location: string): string => {
    const match = location.match(/^([^(]+)/);
    return match ? match[1].trim() : location.trim();
  };

  const availablePickupLocations = Array.isArray(vehicle?.locations)
    ? vehicle.locations.map(extractCityName)
    : typeof vehicle?.locations === 'string'
    ? (vehicle.locations as string).split(',').map((s: string) => extractCityName(s.trim()))
    : [];

  // Для dropoff_location загружаем все доступные города из всех автомобилей
  const [allAvailableCities, setAllAvailableCities] = useState<string[]>([]);

  // Загружаем все доступные города из всех автомобилей
  useEffect(() => {
    const loadAllCities = async () => {
      try {
        const vehicles = await vehiclesAPI.getVehicles();
        const citySet = new Set<string>();
        
        vehicles.forEach((v: Vehicle) => {
          if (v.locations) {
            const locs = Array.isArray(v.locations)
              ? v.locations
              : typeof v.locations === 'string'
              ? v.locations.split(',').map((s: string) => s.trim())
              : [];
            
            locs.forEach((loc: string) => {
              const cityName = extractCityName(loc);
              if (cityName) {
                citySet.add(cityName);
              }
            });
          }
        });
        
        const sortedCities = Array.from(citySet).sort();
        setAllAvailableCities(sortedCities);
      } catch (error) {
        console.error("Error loading all cities:", error);
      }
    };

    loadAllCities();
  }, []);

  // Автозаполнение Billing Info из профиля пользователя
  useEffect(() => {
    const loadUserProfile = async () => {
      if (user?.id) {
        try {
          const profile = await profilesAPI.getUserProfile(user.id);
          if (profile) {
            const fullName = profile.full_name 
              ? `${profile.full_name}${profile.last_name ? ' ' + profile.last_name : ''}`
              : '';
            setBillingInfo((prev) => ({
              ...prev,
              name: fullName || prev.name,
              phoneNumber: profile.phone_number || prev.phoneNumber,
              address: profile.address || prev.address,
              town: profile.city || prev.town,
            }));
          }
        } catch (error) {
          console.error("Error loading user profile:", error);
        }
      }
    };
    loadUserProfile();
  }, [user?.id]);

  // Используем данные из контекста поиска для rentalInfo
  // Данные автоматически синхронизируются с формами на других страницах

  // Lade Fahrzeugdaten
  useEffect(() => {
    const loadVehicle = async () => {
      if (id) {
        try {
          setLoading(true);
          const vehicleData = await vehiclesAPI.getVehicleById(id);
          setVehicle(vehicleData);

          if (vehicleData) {
            const pricePerDay = Number(vehicleData.priceperday) || 100;
            setPriceDetails({
              basePrice: pricePerDay,
              tax: 0,
              addOnsTotal: 0,
              total: pricePerDay,
            });
            
            // Устанавливаем первый доступный город как pickup location по умолчанию
            // ТОЛЬКО если данные НЕ были установлены в контексте
            if (!searchData.pickupLocation) {
              const pickupCities = Array.isArray(vehicleData.locations)
                ? vehicleData.locations.map(extractCityName)
                : typeof vehicleData.locations === 'string'
                ? vehicleData.locations.split(',').map((s: string) => extractCityName(s.trim()))
                : [];
              
              if (pickupCities.length > 0) {
                updateSearchData({
                  pickupLocation: pickupCities[0],
                  dropoffLocation: pickupCities[0],
                });
              }
            }
          }
        } catch (error) {
          console.error("Error loading vehicle data:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadVehicle();
  }, [id]); // Убираем location.state из зависимостей, чтобы не перезагружать при изменении state

  // Расчет цены при изменении дат, автомобиля или Add-ons
  useEffect(() => {
    let basePrice = 0;
    let days = 1;

    if (vehicle && searchData.pickupDate && searchData.dropoffDate) {
      const pickup = new Date(searchData.pickupDate);
      const dropoff = new Date(searchData.dropoffDate);

      if (dropoff > pickup) {
        const timeDiff = dropoff.getTime() - pickup.getTime();
        days = Math.ceil(timeDiff / (1000 * 3600 * 24)); // Разница в днях, округляем вверх
        days = days > 0 ? days : 1; // Минимум 1 день аренды
      }
    }

    const pricePerDay = Number(vehicle?.priceperday) || 0;
    basePrice = days * pricePerDay;

    // Расчет стоимости Add-ons
    const addOnsTotal = Object.entries(addOns).reduce((sum, [key, enabled]) => {
      if (enabled && addOnsPrices[key as keyof typeof addOnsPrices]) {
        const quantity = addOnsQuantities[key] || 1;
        return sum + (addOnsPrices[key as keyof typeof addOnsPrices] * days * quantity);
      }
      return sum;
    }, 0);

    const tax = 0; // Пока налог 0, можно изменить логику
    const total = basePrice + tax + addOnsTotal;

    setPriceDetails({ basePrice, tax, addOnsTotal, total });
  }, [searchData.pickupDate, searchData.dropoffDate, vehicle, addOns, addOnsQuantities]);

  // Formularänderungen verarbeiten
  const handleBillingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBillingInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleRentalChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    updateSearchData({ [name]: value });
  };

  const handlePaymentMethodChange = (
    method: "credit" | "paypal" | "bitcoin"
  ) => {
    setPaymentMethod(method);
  };

  const handleAgreementChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setAgreements((prev) => ({ ...prev, [name]: checked }));
  };

  const handleAddOnToggle = (addOnKey: string) => {
    setAddOns((prev) => ({
      ...prev,
      [addOnKey]: !prev[addOnKey],
    }));
  };

  const handleQuantityChange = (addOnKey: string, quantity: number) => {
    const maxQuantities: Record<string, number> = {
      babySeat: 3,
      childSeat: 10, // без ограничений
      boosterSeat: 3,
      skiRack: 3,
      bikeRack: 4,
      additionalDriver: 3,
    };
    
    const max = maxQuantities[addOnKey] || 10;
    if (quantity < 1) quantity = 1;
    if (quantity > max) quantity = max;
    setAddOnsQuantities((prev) => ({
      ...prev,
      [addOnKey]: quantity,
    }));
  };


  const handleCreditCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCreditCardInfo((prev) => ({ ...prev, [name]: value }));
  };

  // Weiter zum nächsten Schritt
  const nextStep = () => {
    if (currentStep === "billing") {
      // Валидация обязательных полей Billing Info
      if (!billingInfo.name || !billingInfo.name.trim()) {
        alert("Bitte geben Sie Ihren Namen ein.");
        return;
      }
      if (!billingInfo.phoneNumber || !billingInfo.phoneNumber.trim()) {
        alert("Bitte geben Sie Ihre Telefonnummer ein.");
        return;
      }
      setCurrentStep("rental");
    } else if (currentStep === "rental") {
      const pickup = new Date(
        searchData.pickupDate + "T" + (searchData.pickupTime || "00:00")
      );
      const dropoff = new Date(
        searchData.dropoffDate + "T" + (searchData.dropoffTime || "00:00")
      );
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (
        !searchData.pickupDate ||
        !searchData.dropoffDate ||
        !searchData.pickupTime ||
        !searchData.dropoffTime
      ) {
        alert("Please fill in all rental details.");
        return;
      }
      if (pickup < today) {
        alert("Pickup date cannot be in the past.");
        return;
      }
      if (dropoff <= pickup) {
        alert("Return date must be after the pickup date.");
        return;
      }

      setCurrentStep("addons");
    } else if (currentStep === "addons") {
      // Можно перейти к оплате без выбора дополнительных услуг
      setCurrentStep("payment");
    } else if (currentStep === "payment") {
      setCurrentStep("confirmation");
    } else if (currentStep === "confirmation") {
      completeRental();
    }
  };

  // Zurück zum vorherigen Schritt
  const prevStep = () => {
    if (currentStep === "rental") setCurrentStep("billing");
    else if (currentStep === "addons") setCurrentStep("rental");
    else if (currentStep === "payment") setCurrentStep("addons");
    else if (currentStep === "confirmation") setCurrentStep("payment");
  };

  // Abschluss der Buchung
  const completeRental = async () => {
    if (!user) {
      alert("Please log in to complete the booking.");
      navigate("/login");
      return;
    }

    if (!vehicle) {
      alert("Error: Vehicle data not loaded.");
      return;
    }

    if (
      !searchData.pickupDate ||
      !searchData.dropoffDate ||
      !searchData.pickupTime ||
      !searchData.dropoffTime
    ) {
      alert("Please ensure all rental dates and times are selected.");
      setCurrentStep("rental");
      return;
    }

    const pickupDateTime = new Date(
      `${searchData.pickupDate}T${searchData.pickupTime}`
    ).toISOString();
    const dropoffDateTime = new Date(
      `${searchData.dropoffDate}T${searchData.dropoffTime}`
    ).toISOString();

    // Сохраняем только названия городов без координат
    const pickupCity = extractCityName(searchData.pickupLocation);
    const dropoffCity = extractCityName(searchData.dropoffLocation);

    const newBooking = {
      vehicle_id: vehicle.id,
      user_id: user.id,
      pickup_location: pickupCity,
      dropoff_location: dropoffCity,
      pickup_date: pickupDateTime,
      dropoff_date: dropoffDateTime,
      total_price: Number(priceDetails.total),
      status: "confirmed" as const,
    };

    setLoading(true);
    try {
      await bookingsAPI.createBooking(newBooking);
      alert("Booking successfully created! Thank you for your order.");
      navigate("/");
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("An error occurred while creating the booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Bestimmt den Fortschritt
  const getStepNumber = (step: PaymentStep): number => {
    switch (step) {
      case "billing":
        return 1;
      case "rental":
        return 2;
      case "addons":
        return 3;
      case "payment":
        return 4;
      case "confirmation":
        return 5;
      default:
        return 1;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
        <Header />
        <div className="container mx-auto py-12 px-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-center mt-4 text-gray-500 dark:text-gray-400">
            Fahrzeugdaten werden geladen...
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
        <Header />
        <div className="container mx-auto py-12 px-4 text-center">
          <p className="text-red-500">Fahrzeug nicht gefunden</p>
          <Link
            to="/"
            className="text-orange-500 mt-4 inline-block"
          >
            Zurück zur Startseite
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden dark:bg-gray-900">
      <Header />

      <main className="container mx-auto py-4 md:py-6 px-4">
        <div className="mb-4 md:mb-6">
          <Link
            to={`/cars/${id}`}
            className="flex items-center text-sm md:text-base text-gray-600 dark:text-gray-300 hover:text-orange-500 transition-colors"
          >
            <MdArrowBack className="mr-1" /> Zurück
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          {/* Левая колонка - форма */}
          <div className="lg:col-span-2">
            {/* Billing Info */}
            <div
              className={`bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-elegant-lg mb-4 md:mb-6 border border-gray-100 dark:border-gray-700 ${
                currentStep !== "billing" ? "opacity-60" : ""
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 md:mb-4 gap-2">
                <div className="flex items-center">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                    Billing Info
                  </h2>
                  {getStepNumber(currentStep) > 1 && (
                    <IoCheckmarkCircle
                      className="text-green-500 ml-2"
                      size={20}
                    />
                  )}
                </div>
                <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                  Step {getStepNumber("billing")} of 5
                </span>
              </div>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-3 md:mb-4">
                Bitte geben Sie Ihre Rechnungsdaten ein
              </p>

              {currentStep === "billing" && (
                <div className="space-y-3 md:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        placeholder="Ihr Name"
                        className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
                        value={billingInfo.name}
                        onChange={handleBillingChange}
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="phoneNumber"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Telefonnummer <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        id="phoneNumber"
                        name="phoneNumber"
                        placeholder="Telefonnummer"
                        className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
                        value={billingInfo.phoneNumber}
                        onChange={handleBillingChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <label
                        htmlFor="address"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Adresse
                      </label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        placeholder="Adresse"
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                        value={billingInfo.address}
                        onChange={handleBillingChange}
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="town"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Stadt / Ort
                      </label>
                      <input
                        type="text"
                        id="town"
                        name="town"
                        placeholder="Stadt oder Ort"
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                        value={billingInfo.town}
                        onChange={handleBillingChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={nextStep}
                      className="w-full sm:w-auto bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors inline-flex items-center justify-center shadow-md hover:shadow-lg"
                    >
                      Weiter <MdKeyboardArrowRight className="ml-1" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Rental Info */}
            <div
              className={`bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-elegant-lg mb-4 md:mb-6 border border-gray-100 dark:border-gray-700 ${
                currentStep !== "rental" ? "opacity-60" : ""
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 md:mb-4 gap-2">
                <div className="flex items-center">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                    Rental Info
                  </h2>
                  {getStepNumber(currentStep) > 2 && (
                    <IoCheckmarkCircle
                      className="text-green-500 ml-2"
                      size={20}
                    />
                  )}
                </div>
                <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                  Step {getStepNumber("rental")} of 5
                </span>
              </div>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-3 md:mb-4">
                Bitte wählen Sie Ihre Mietdaten
              </p>

              {currentStep === "rental" && (
                <div className="space-y-4 md:space-y-6">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2 md:mb-3 text-sm md:text-base">
                      Pick - Up
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                      <div>
                        <label
                          htmlFor="pickupLocation"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                          Ort
                        </label>
                        <select
                          id="pickupLocation"
                          name="pickupLocation"
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                          value={searchData.pickupLocation}
                          onChange={handleRentalChange}
                          required
                        >
                          <option value="">Bitte wählen</option>
                          {availablePickupLocations.map((city) => (
                            <option key={city} value={city}>{city}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label
                          htmlFor="pickupDate"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                          Datum
                        </label>
                        <input
                          type="date"
                          id="pickupDate"
                          name="pickupDate"
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                          value={searchData.pickupDate}
                          onChange={handleRentalChange}
                          min={new Date().toISOString().split("T")[0]}
                          required
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label
                        htmlFor="pickupTime"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Zeit
                      </label>
                      <input
                        type="time"
                        id="pickupTime"
                        name="pickupTime"
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                        value={searchData.pickupTime}
                        onChange={handleRentalChange}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2 md:mb-3 text-sm md:text-base">
                      Drop - Off
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                      <div>
                        <label
                          htmlFor="dropoffLocation"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                          Ort
                        </label>
                        <select
                          id="dropoffLocation"
                          name="dropoffLocation"
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                          value={searchData.dropoffLocation}
                          onChange={handleRentalChange}
                          required
                        >
                          <option value="">Bitte wählen</option>
                          {allAvailableCities.map((city) => (
                            <option key={city} value={city}>{city}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label
                          htmlFor="dropoffDate"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                          Datum
                        </label>
                        <input
                          type="date"
                          id="dropoffDate"
                          name="dropoffDate"
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                          value={searchData.dropoffDate}
                          onChange={handleRentalChange}
                          min={
                            searchData.pickupDate ||
                            new Date().toISOString().split("T")[0]
                          }
                          required
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label
                        htmlFor="dropoffTime"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Zeit
                      </label>
                      <input
                        type="time"
                        id="dropoffTime"
                        name="dropoffTime"
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                        value={searchData.dropoffTime}
                        onChange={handleRentalChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <button
                      onClick={prevStep}
                      className="text-gray-600 dark:text-gray-300 hover:text-orange-500 transition-colors"
                    >
                      Zurück
                    </button>
                    <button
                      onClick={nextStep}
                      className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-smooth shadow-elegant hover:shadow-glow-orange button-press font-medium inline-flex items-center justify-center"
                    >
                      Weiter <MdKeyboardArrowRight className="ml-1" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Add-ons Section */}
            <div
              className={`bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-elegant-lg mb-4 md:mb-6 border border-gray-100 dark:border-gray-700 ${
                currentStep !== "addons" ? "opacity-60" : ""
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 md:mb-4 gap-2">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                  Zusätzliche Ausstattung
                </h2>
                <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                  Step {getStepNumber("addons")} of 5
                </span>
              </div>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-4">
                Wählen Sie zusätzliche Ausstattung für Ihre Miete
              </p>

              {currentStep === "addons" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <div
                    className={`p-4 border-2 rounded-lg transition-smooth ${
                      addOns.additionalDriver
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 shadow-elegant"
                        : "border-gray-200 dark:border-gray-700 shadow-elegant"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          Zusätzlicher Fahrer
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          Ein zusätzlicher Fahrer kann das Fahrzeug ebenfalls fahren. Ideal für lange Reisen.
                        </p>
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-semibold text-orange-500">
                            +€{addOnsPrices.additionalDriver}/Tag
                          </p>
                          {addOns.additionalDriver && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuantityChange("additionalDriver", addOnsQuantities.additionalDriver - 1);
                                }}
                                className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-center text-sm font-semibold"
                              >
                                −
                              </button>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-8 text-center">
                                {addOnsQuantities.additionalDriver}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuantityChange("additionalDriver", addOnsQuantities.additionalDriver + 1);
                                }}
                                className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-center text-sm font-semibold"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddOnToggle("additionalDriver")}
                        className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                          addOns.additionalDriver ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                        role="switch"
                        aria-checked={addOns.additionalDriver}
                      >
                        <span
                          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            addOns.additionalDriver ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div
                    className={`p-4 border-2 rounded-lg transition-smooth ${
                      addOns.gps
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 shadow-elegant"
                        : "border-gray-200 dark:border-gray-700 shadow-elegant"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          GPS und Android Auto / Apple Car Play
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          Navigation mit GPS und Anbindung Ihres Smartphones für Musik und Apps.
                        </p>
                        <p className="text-sm font-semibold text-orange-500">
                          +€{addOnsPrices.gps}/Tag
                        </p>
                      </div>
                      <button
                        onClick={() => handleAddOnToggle("gps")}
                        className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                          addOns.gps ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                        role="switch"
                        aria-checked={addOns.gps}
                      >
                        <span
                          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            addOns.gps ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div
                    className={`p-4 border-2 rounded-lg transition-smooth ${
                      addOns.babySeat
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 shadow-elegant"
                        : "border-gray-200 dark:border-gray-700 shadow-elegant"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          Babyschale
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          Für Babys von 0-13 kg. Sicher und komfortabel für die Kleinsten.
                        </p>
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-semibold text-orange-500">
                            +€{addOnsPrices.babySeat}/Tag
                          </p>
                          {addOns.babySeat && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuantityChange("babySeat", addOnsQuantities.babySeat - 1);
                                }}
                                className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-center text-sm font-semibold"
                              >
                                −
                              </button>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-8 text-center">
                                {addOnsQuantities.babySeat}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuantityChange("babySeat", addOnsQuantities.babySeat + 1);
                                }}
                                className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-center text-sm font-semibold"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddOnToggle("babySeat")}
                        className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                          addOns.babySeat ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                        role="switch"
                        aria-checked={addOns.babySeat}
                      >
                        <span
                          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            addOns.babySeat ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div
                    className={`p-4 border-2 rounded-lg transition-smooth ${
                      addOns.childSeat
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 shadow-elegant"
                        : "border-gray-200 dark:border-gray-700 shadow-elegant"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          Kindersitz
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          Für Kinder von 9-36 kg. Erfüllt alle Sicherheitsstandards.
                        </p>
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-semibold text-orange-500">
                            +€{addOnsPrices.childSeat}/Tag
                          </p>
                          {addOns.childSeat && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuantityChange("childSeat", addOnsQuantities.childSeat - 1);
                                }}
                                className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-center text-sm font-semibold"
                              >
                                −
                              </button>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-8 text-center">
                                {addOnsQuantities.childSeat}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuantityChange("childSeat", addOnsQuantities.childSeat + 1);
                                }}
                                className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-center text-sm font-semibold"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddOnToggle("childSeat")}
                        className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                          addOns.childSeat ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                        role="switch"
                        aria-checked={addOns.childSeat}
                      >
                        <span
                          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            addOns.childSeat ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div
                    className={`p-4 border-2 rounded-lg transition-smooth ${
                      addOns.boosterSeat
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 shadow-elegant"
                        : "border-gray-200 dark:border-gray-700 shadow-elegant"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          Sitzerhöhung
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          Für Kinder ab 15 kg. Erhöht die Sitzposition für bessere Sicherheit.
                        </p>
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-semibold text-orange-500">
                            +€{addOnsPrices.boosterSeat}/Tag
                          </p>
                          {addOns.boosterSeat && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuantityChange("boosterSeat", addOnsQuantities.boosterSeat - 1);
                                }}
                                className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-center text-sm font-semibold"
                              >
                                −
                              </button>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-8 text-center">
                                {addOnsQuantities.boosterSeat}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuantityChange("boosterSeat", addOnsQuantities.boosterSeat + 1);
                                }}
                                className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-center text-sm font-semibold"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddOnToggle("boosterSeat")}
                        className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                          addOns.boosterSeat ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                        role="switch"
                        aria-checked={addOns.boosterSeat}
                      >
                        <span
                          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            addOns.boosterSeat ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div
                    className={`p-4 border-2 rounded-lg transition-smooth ${
                      addOns.skiRack
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 shadow-elegant"
                        : "border-gray-200 dark:border-gray-700 shadow-elegant"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          Ski-Gepäckträger
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          Für bis zu 4 Paar Ski oder Snowboards. Sicher und wetterfest.
                        </p>
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-semibold text-orange-500">
                            +€{addOnsPrices.skiRack}/Tag
                          </p>
                          {addOns.skiRack && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuantityChange("skiRack", addOnsQuantities.skiRack - 1);
                                }}
                                className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-center text-sm font-semibold"
                              >
                                −
                              </button>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-8 text-center">
                                {addOnsQuantities.skiRack}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuantityChange("skiRack", addOnsQuantities.skiRack + 1);
                                }}
                                className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-center text-sm font-semibold"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddOnToggle("skiRack")}
                        className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                          addOns.skiRack ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                        role="switch"
                        aria-checked={addOns.skiRack}
                      >
                        <span
                          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            addOns.skiRack ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div
                    className={`p-4 border-2 rounded-lg transition-smooth ${
                      addOns.bikeRack
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 shadow-elegant"
                        : "border-gray-200 dark:border-gray-700 shadow-elegant"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          Fahrrad-Gepäckträger
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          Für bis zu 4 Fahrräder. Einfache Montage und sichere Befestigung.
                        </p>
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-semibold text-orange-500">
                            +€{addOnsPrices.bikeRack}/Tag
                          </p>
                          {addOns.bikeRack && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuantityChange("bikeRack", addOnsQuantities.bikeRack - 1);
                                }}
                                className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-center text-sm font-semibold"
                              >
                                −
                              </button>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-8 text-center">
                                {addOnsQuantities.bikeRack}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuantityChange("bikeRack", addOnsQuantities.bikeRack + 1);
                                }}
                                className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-center text-sm font-semibold"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddOnToggle("bikeRack")}
                        className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                          addOns.bikeRack ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                        role="switch"
                        aria-checked={addOns.bikeRack}
                      >
                        <span
                          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            addOns.bikeRack ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === "addons" && (
                <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6">
                  <button
                    onClick={prevStep}
                    className="w-full sm:w-auto text-gray-600 dark:text-gray-300 hover:text-orange-500 transition-smooth px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 button-press"
                  >
                    Zurück
                  </button>
                  <button
                    onClick={nextStep}
                    className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-smooth shadow-elegant hover:shadow-glow-orange button-press font-medium inline-flex items-center justify-center"
                  >
                    Weiter <MdKeyboardArrowRight className="ml-1" />
                  </button>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div
              className={`bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-elegant-lg mb-4 md:mb-6 border border-gray-100 dark:border-gray-700 ${
                currentStep !== "payment" ? "opacity-60" : ""
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 md:mb-4 gap-2">
                <div className="flex items-center">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                    Payment Method
                  </h2>
                  {getStepNumber(currentStep) > 4 && (
                    <IoCheckmarkCircle
                      className="text-green-500 ml-2"
                      size={20}
                    />
                  )}
                </div>
                <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                  Step {getStepNumber("payment")} of 5
                </span>
              </div>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-3 md:mb-4">
                Bitte wählen Sie Ihre Zahlungsmethode
              </p>

              {currentStep === "payment" && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center p-3 border dark:border-gray-600 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700">
                      <input
                        type="radio"
                        id="credit"
                        name="paymentMethod"
                        checked={paymentMethod === "credit"}
                        onChange={() => handlePaymentMethodChange("credit")}
                        className="mr-3"
                      />
                      <FaCreditCard className="mr-2 text-gray-600 dark:text-gray-400" />
                      <label
                        htmlFor="credit"
                        className="flex-grow cursor-pointer text-gray-900 dark:text-white"
                      >
                        Credit Card
                      </label>
                      <div className="flex space-x-2">
                        <img
                          src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg"
                          alt="Visa"
                          className="h-6"
                        />
                        <img
                          src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg"
                          alt="Mastercard"
                          className="h-6"
                        />
                      </div>
                    </div>

                    {paymentMethod === "credit" && (
                      <div className="ml-8 mt-3 space-y-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Kartennummer
                          </label>
                          <input
                            type="text"
                            name="cardNumber"
                            placeholder="1234 5678 9012 3456"
                            maxLength={19}
                            value={creditCardInfo.cardNumber}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
                              const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
                              handleCreditCardChange({ ...e, target: { ...e.target, value: formatted } });
                            }}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Name auf der Karte
                          </label>
                          <input
                            type="text"
                            name="cardName"
                            placeholder="Max Mustermann"
                            value={creditCardInfo.cardName}
                            onChange={handleCreditCardChange}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Ablaufdatum
                            </label>
                            <input
                              type="text"
                              name="expiryDate"
                              placeholder="MM/JJ"
                              maxLength={5}
                              value={creditCardInfo.expiryDate}
                              onChange={(e) => {
                                let value = e.target.value.replace(/\D/g, '');
                                if (value.length >= 2) {
                                  value = value.slice(0, 2) + '/' + value.slice(2, 4);
                                }
                                handleCreditCardChange({ ...e, target: { ...e.target, value } });
                              }}
                              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              CVV
                            </label>
                            <input
                              type="text"
                              name="cvv"
                              placeholder="123"
                              maxLength={4}
                              value={creditCardInfo.cvv}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                handleCreditCardChange({ ...e, target: { ...e.target, value } });
                              }}
                              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center p-3 border dark:border-gray-600 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700">
                      <input
                        type="radio"
                        id="paypal"
                        name="paymentMethod"
                        checked={paymentMethod === "paypal"}
                        onChange={() => handlePaymentMethodChange("paypal")}
                        className="mr-3"
                      />
                      <label
                        htmlFor="paypal"
                        className="flex-grow cursor-pointer text-gray-900 dark:text-white"
                      >
                        PayPal
                      </label>
                      <img
                        src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg"
                        alt="PayPal"
                        className="h-6"
                      />
                    </div>

                    {paymentMethod === "paypal" && (
                      <div className="ml-8 mt-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          PayPal E-Mail-Adresse
                        </label>
                        <input
                          type="email"
                          placeholder="ihre.email@example.com"
                          value={paypalEmail}
                          onChange={(e) => setPaypalEmail(e.target.value)}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    )}

                    <div className="flex items-center p-3 border dark:border-gray-600 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700">
                      <input
                        type="radio"
                        id="bitcoin"
                        name="paymentMethod"
                        checked={paymentMethod === "bitcoin"}
                        onChange={() => handlePaymentMethodChange("bitcoin")}
                        className="mr-3"
                      />
                      <label
                        htmlFor="bitcoin"
                        className="flex-grow cursor-pointer text-gray-900 dark:text-white"
                      >
                        Bitcoin
                      </label>
                      <img
                        src="https://upload.wikimedia.org/wikipedia/commons/4/46/Bitcoin.svg"
                        alt="Bitcoin"
                        className="h-6"
                      />
                    </div>

                    {paymentMethod === "bitcoin" && (
                      <div className="ml-8 mt-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Bitcoin-Adresse
                        </label>
                        <input
                          type="text"
                          placeholder="bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
                          value={bitcoinAddress}
                          onChange={(e) => setBitcoinAddress(e.target.value)}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between gap-3">
                    <button
                      onClick={prevStep}
                      className="w-full sm:w-auto text-gray-600 dark:text-gray-300 hover:text-orange-500 transition-smooth px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 button-press"
                    >
                      Zurück
                    </button>
                    <button
                      onClick={nextStep}
                      className="w-full sm:w-auto bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors inline-flex items-center justify-center shadow-md hover:shadow-lg"
                    >
                      Weiter <MdKeyboardArrowRight className="ml-1" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Confirmation */}
            <div
              className={`bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-elegant-lg mb-4 md:mb-6 border border-gray-100 dark:border-gray-700 ${
                currentStep !== "confirmation" ? "opacity-60" : ""
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 md:mb-4 gap-2">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                  Confirmation
                </h2>
                <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                  Step {getStepNumber("confirmation")} of 5
                </span>
              </div>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-3 md:mb-4">
                Fast geschafft! Nur noch ein paar Klicks und Ihre Buchung ist
                abgeschlossen.
              </p>

              {currentStep === "confirmation" && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="marketing"
                        name="marketing"
                        checked={agreements.marketing}
                        onChange={handleAgreementChange}
                        className="mr-3"
                      />
                      <label
                        htmlFor="marketing"
                        className="text-sm text-gray-700 dark:text-gray-300"
                      >
                        Ich stimme dem Erhalt von Marketing und Newsletter
                        E-Mails zu. Kein Spam, versprochen!
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="terms"
                        name="terms"
                        checked={agreements.terms}
                        onChange={handleAgreementChange}
                        className="mr-3"
                        required
                      />
                      <label
                        htmlFor="terms"
                        className="text-sm text-gray-700 dark:text-gray-300"
                      >
                        Ich stimme den Nutzungsbedingungen und der
                        Datenschutzerklärung zu
                      </label>
                    </div>
                  </div>

                  <div className="border dark:border-gray-600 rounded-lg p-4 bg-orange-50 dark:bg-orange-900/20 flex items-start shadow-elegant">
                    <FaLock className="text-orange-500 mr-3 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Alle Ihre Daten sind sicher
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Wir verwenden modernste Sicherheitsvorkehrungen, um
                        Ihnen das beste Erlebnis zu bieten.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Правая колонка - сводка */}
          <div className="lg:col-span-1 order-first lg:order-last">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-sm sticky top-4 md:top-6">
              <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4 text-gray-900 dark:text-white">
                Rental Summary
              </h2>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-3 md:mb-4">
                Preise können sich je nach Mietdauer und Fahrzeug unterscheiden.
              </p>

              <div className="flex items-center space-x-3 mb-4">
                <img
                  src={
                    vehicle.carimg
                      ? getImageUrl(vehicle.carimg)
                      : `https://source.unsplash.com/random/800x600/?car,${vehicle.brand},${vehicle.model}`
                  }
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  className="w-20 h-16 object-cover rounded"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.src = `https://source.unsplash.com/random/800x600/?car,${vehicle.brand},${vehicle.model}`;
                  }}
                />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {vehicle.brand} {vehicle.model}
                  </h3>
                  <div className="flex items-center">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          className={
                            i < 4
                              ? "text-yellow-400"
                              : "text-gray-300 dark:text-gray-600"
                          }
                          size={12}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                      5 Bewertungen
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-b dark:border-gray-600 py-4 space-y-2 mb-4 shadow-elegant">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Preis (€{vehicle.priceperday} / Tag x
                    {(() => {
                      if (searchData.pickupDate && searchData.dropoffDate) {
                        const pickup = new Date(searchData.pickupDate);
                        const dropoff = new Date(searchData.dropoffDate);
                        if (dropoff > pickup) {
                          const timeDiff = dropoff.getTime() - pickup.getTime();
                          const days = Math.ceil(timeDiff / (1000 * 3600 * 24));
                          return days > 0 ? days : 1;
                        }
                        return 1;
                      }
                      return 1;
                    })()}{" "}
                    Tag(e))
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    €{Number(priceDetails.basePrice).toFixed(2)}
                  </span>
                </div>
                {priceDetails.addOnsTotal > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">
                        Zusätzliche Ausstattung
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        €{Number(priceDetails.addOnsTotal).toFixed(2)}
                      </span>
                    </div>
                    <div className="pl-2 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                      {Object.entries(addOns).map(([key, enabled]) => {
                        if (!enabled) return null;
                        const quantity = addOnsQuantities[key] || 1;
                        const addOnNames: Record<string, string> = {
                          additionalDriver: "Zusätzlicher Fahrer",
                          gps: "GPS und Android Auto / Apple Car Play",
                          babySeat: "Babyschale",
                          childSeat: "Kindersitz",
                          boosterSeat: "Sitzerhöhung",
                          skiRack: "Ski-Gepäckträger",
                          bikeRack: "Fahrrad-Gepäckträger",
                        };
                        const name = addOnNames[key] || key;
                        // Рассчитываем количество дней
                        let days = 1;
                        if (searchData.pickupDate && searchData.dropoffDate) {
                          const pickup = new Date(searchData.pickupDate);
                          const dropoff = new Date(searchData.dropoffDate);
                          if (dropoff > pickup) {
                            const timeDiff = dropoff.getTime() - pickup.getTime();
                            days = Math.ceil(timeDiff / (1000 * 3600 * 24));
                            days = days > 0 ? days : 1;
                          }
                        }
                        const pricePerDay = addOnsPrices[key as keyof typeof addOnsPrices] || 0;
                        const totalPrice = pricePerDay * days * quantity;
                        return (
                          <div key={key} className="flex justify-between">
                            <span>
                              {name}
                              {quantity > 1 && ` (x${quantity})`}
                            </span>
                            <span>
                              €{totalPrice.toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Steuern
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    €{Number(priceDetails.tax).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between font-bold text-lg mb-4">
                <span className="text-gray-900 dark:text-white">
                  Gesamtpreis
                </span>
                <span className="text-gray-900 dark:text-white">
                  €{Number(priceDetails.total).toFixed(2)}
                </span>
              </div>

              {/* Кнопка оплаты - только если согласие со всеми условиями */}
              {currentStep === "confirmation" && (
                <button
                  onClick={completeRental}
                  disabled={!agreements.terms}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-smooth shadow-elegant hover:shadow-glow-orange button-press font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-orange-500"
                >
                  Jetzt bezahlen
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
