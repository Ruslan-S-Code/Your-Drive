import { useState, useEffect } from "react";
import { locationsAPI, vehiclesAPI } from "../lib/api";
import { useSearch } from "../contexts/SearchContext";
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaPlus } from "react-icons/fa";

interface SearchFilters {
  pickupLocation: string;
  pickupDate: string;
  pickupTime: string;
  dropoffLocation: string;
  dropoffDate: string;
  dropoffTime: string;
}

interface SearchFormProps {
  onSearch: (filters: SearchFilters) => void;
}

export default function SearchForm({ onSearch }: SearchFormProps) {
  const { searchData, updateSearchData } = useSearch();
  const [differentReturnLocation, setDifferentReturnLocation] = useState(searchData.differentReturnLocation);
  const [errors, setErrors] = useState<
    Partial<Record<keyof SearchFilters, string>>
  >({});
  const [locations, setLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Синхронизируем differentReturnLocation с контекстом
  useEffect(() => {
    setDifferentReturnLocation(searchData.differentReturnLocation);
  }, [searchData.differentReturnLocation]);

  useEffect(() => {
    const fetchLocations = async () => {
      setLoading(true);
      try {
        // Получаем города из таблицы locations
        const locationsData = await locationsAPI.getLocations();
        const locationCities: string[] = [];
        
        if (locationsData) {
          const all = locationsData.flatMap((row: any) =>
            Array.isArray(row.locations)
              ? row.locations
              : typeof row.locations === "string"
              ? row.locations.split(",").map((s: string) => s.trim())
              : []
          );
          locationCities.push(...all);
        }

        // Получаем города из всех автомобилей
        const vehiclesData = await vehiclesAPI.getVehicles();
        const vehicleCities: string[] = [];
        
        if (vehiclesData) {
          vehiclesData.forEach((vehicle: any) => {
            if (vehicle.locations) {
              const vehicleLocs = Array.isArray(vehicle.locations)
                ? vehicle.locations
                : typeof vehicle.locations === "string"
                ? vehicle.locations.split(",").map((s: string) => s.trim())
                : [];
              vehicleCities.push(...vehicleLocs);
            }
          });
        }

        // Объединяем и получаем уникальные города
        const allCities = [...locationCities, ...vehicleCities];
        // Извлекаем только название города (без координат)
        const cityNames = allCities.map((loc: string) => {
          // Формат: "Berlin (52.5200,13.4050)" -> "Berlin"
          const match = loc.match(/^([^(]+)/);
          return match ? match[1].trim() : loc.trim();
        });
        
        // Удаляем дубликаты и сортируем
        const uniqueCities = Array.from(new Set(cityNames)).sort();
        setLocations(uniqueCities);
      } catch (error) {
        console.error("Error fetching locations:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLocations();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof SearchFilters, string>> = {};

    if (!searchData.pickupLocation) {
      newErrors.pickupLocation = "Bitte wählen Sie einen Abholort";
    }

    if (!searchData.pickupDate) {
      newErrors.pickupDate = "Bitte wählen Sie ein Abholdatum";
    }

    if (!searchData.pickupTime) {
      newErrors.pickupTime = "Bitte wählen Sie eine Abholzeit";
    }

    // Rückgabe только обязательна, если выбран "Different return location"
    if (differentReturnLocation) {
    if (!searchData.dropoffLocation) {
      newErrors.dropoffLocation = "Bitte wählen Sie einen Rückgabeort";
    }

    if (!searchData.dropoffDate) {
      newErrors.dropoffDate = "Bitte wählen Sie ein Rückgabedatum";
    }

    if (!searchData.dropoffTime) {
      newErrors.dropoffTime = "Bitte wählen Sie eine Rückgabezeit";
    }

      // Datumvalidierung только если указана другая дата возврата
      if (searchData.pickupDate && searchData.dropoffDate) {
    const pickupDateTime = new Date(
      `${searchData.pickupDate}T${searchData.pickupTime}`
    );
    const dropoffDateTime = new Date(
      `${searchData.dropoffDate}T${searchData.dropoffTime}`
    );

    if (pickupDateTime >= dropoffDateTime) {
      newErrors.dropoffDate = "Rückgabedatum muss nach Abholdatum liegen";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof SearchFilters, value: string) => {
    // Обновляем данные в контексте
    updateSearchData({ [field]: value });
    
    // Fehler für dieses Feld zurücksetzen
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleDifferentReturnToggle = (checked: boolean) => {
    setDifferentReturnLocation(checked);
    updateSearchData({ 
      differentReturnLocation: checked,
      // Если чекбокс снят, копируем данные из Abholung
      ...(checked ? {} : {
        dropoffLocation: searchData.pickupLocation,
        dropoffDate: searchData.pickupDate,
        dropoffTime: searchData.pickupTime,
      })
    });
  };

  const handleSearch = () => {
    // Подготавливаем финальные фильтры из контекста
    const finalFilters = { ...searchData };
    
    // Если не выбран "Different return location", копируем данные из Abholung
    if (!differentReturnLocation) {
      finalFilters.dropoffLocation = searchData.pickupLocation;
      finalFilters.dropoffDate = searchData.pickupDate;
      finalFilters.dropoffTime = searchData.pickupTime;
    }
    
    if (validateForm()) {
      // Обновляем контекст с финальными данными
      updateSearchData(finalFilters);
      onSearch(finalFilters);
    }
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-1 h-8 bg-orange-500 rounded-full"></div>
            <h3 className="font-bold text-lg md:text-xl text-gray-900 dark:text-white font-display">
            Abholung
          </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <FaMapMarkerAlt className="text-orange-500" size={14} />
                Ort
              </label>
              <div className="relative">
                <select
                  className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 pl-9 pr-4 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white hover:border-orange-300 dark:hover:border-orange-600 shadow-elegant appearance-none cursor-pointer"
                  value={searchData.pickupLocation}
                  onChange={(e) => handleChange("pickupLocation", e.target.value)}
                  disabled={loading}
                >
                  <option value="">Bitte wählen</option>
                  {locations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                  <FaMapMarkerAlt className="text-gray-400" size={14} />
                </div>
              </div>
              {errors.pickupLocation && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.pickupLocation}
                </p>
              )}
            </div>

            <div className="space-y-2 custom-date-input">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <FaCalendarAlt className="text-orange-500" size={14} />
                Datum
              </label>
              <div className="relative">
                <input
                  type="date"
                  className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 pl-9 pr-10 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white hover:border-orange-300 dark:hover:border-orange-600 shadow-elegant cursor-pointer"
                  value={searchData.pickupDate}
                  onChange={(e) => handleChange("pickupDate", e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                  <FaCalendarAlt className="text-gray-400" size={14} />
                </div>
              </div>
              {errors.pickupDate && (
                <p className="mt-1 text-sm text-red-500">{errors.pickupDate}</p>
              )}
            </div>

            <div className="space-y-2 custom-time-input">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <FaClock className="text-orange-500" size={14} />
                Uhrzeit
              </label>
              <div className="relative">
                <input
                  type="time"
                  className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 pl-9 pr-10 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white hover:border-orange-300 dark:hover:border-orange-600 shadow-elegant cursor-pointer"
                  value={searchData.pickupTime}
                  onChange={(e) => handleChange("pickupTime", e.target.value)}
                />
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                  <FaClock className="text-gray-400" size={14} />
                </div>
              </div>
              {errors.pickupTime && (
                <p className="mt-1 text-sm text-red-500">{errors.pickupTime}</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-1 h-8 bg-orange-500 rounded-full"></div>
            <h3 className="font-bold text-lg md:text-xl text-gray-900 dark:text-white font-display">
              Rückgabe
            </h3>
          </div>
          
          {/* Кнопка/поле Ort, Datum, Uhrzeit - в одной строке */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            {/* Кнопка или поле Ort - в зависимости от состояния */}
            {!differentReturnLocation ? (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 opacity-0 h-[22px] flex items-center">
                  Action
                </label>
                <button
                  type="button"
                  onClick={() => handleDifferentReturnToggle(true)}
                  className="w-full py-3 flex items-center justify-center gap-1.5 px-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-400 hover:border-orange-500 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all shadow-elegant whitespace-nowrap"
                >
                  <FaPlus className="text-orange-500 flex-shrink-0" size={14} />
                  <span className="truncate">Andere Rückgabestelle</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <FaMapMarkerAlt className="text-orange-500" size={14} />
                  Ort
                </label>
                <div className="relative">
                  <select
                    className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 pl-9 pr-4 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white hover:border-orange-300 dark:hover:border-orange-600 shadow-elegant appearance-none cursor-pointer"
                    value={searchData.dropoffLocation}
                    onChange={(e) => handleChange("dropoffLocation", e.target.value)}
                    disabled={loading}
                  >
                    <option value="">Bitte wählen</option>
                    {locations.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                    <FaMapMarkerAlt className="text-gray-400" size={14} />
                  </div>
                </div>
                {errors.dropoffLocation && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.dropoffLocation}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2 custom-date-input">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <FaCalendarAlt className="text-orange-500" size={14} />
                Datum
              </label>
              <div className="relative">
                <input
                  type="date"
                  className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 pl-9 pr-10 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white hover:border-orange-300 dark:hover:border-orange-600 shadow-elegant cursor-pointer"
                  value={searchData.dropoffDate}
                  onChange={(e) => handleChange("dropoffDate", e.target.value)}
                  min={searchData.pickupDate || new Date().toISOString().split("T")[0]}
                />
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                  <FaCalendarAlt className="text-gray-400" size={14} />
                </div>
              </div>
              {errors.dropoffDate && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.dropoffDate}
                </p>
              )}
            </div>

            <div className="space-y-2 custom-time-input">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <FaClock className="text-orange-500" size={14} />
                Uhrzeit
              </label>
              <div className="relative">
                <input
                  type="time"
                  className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 pl-9 pr-10 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white hover:border-orange-300 dark:hover:border-orange-600 shadow-elegant cursor-pointer"
                  value={searchData.dropoffTime}
                  onChange={(e) => handleChange("dropoffTime", e.target.value)}
                />
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                  <FaClock className="text-gray-400" size={14} />
                </div>
              </div>
              {errors.dropoffTime && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.dropoffTime}
                </p>
              )}
            </div>
          </div>

          {/* Кнопка для отмены Different return location */}
          {differentReturnLocation && (
            <button
              type="button"
              onClick={() => handleDifferentReturnToggle(false)}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors flex items-center gap-1"
            >
              <span>×</span>
              <span>Andere Rückgabestelle entfernen</span>
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 md:mt-8">
        <button
          type="button"
          onClick={handleSearch}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold px-8 py-4 rounded-xl text-base md:text-lg transition-colors shadow-elegant-xl"
        >
          Fahrzeuge suchen
        </button>
      </div>
    </div>
  );
}
