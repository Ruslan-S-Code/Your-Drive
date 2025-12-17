import { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import VehicleCard from "../components/VehicleCard";
import { useVehicles } from "../lib/hooks/useVehicles";
import { useSearch } from "../contexts/SearchContext";
import { MdFilterList, MdClose, MdExpandMore, MdExpandLess } from "react-icons/md";
import { TbManualGearbox, TbAutomaticGearbox } from "react-icons/tb";
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaPlus } from "react-icons/fa";
import { Vehicle, vehiclesAPI, locationsAPI } from "../lib/api";

interface SearchFilters {
  type?: string[];
  maxPrice: number;
  brand?: string[];
  minPrice: number;
  geartype?: string[];
  fuel?: string[];
  sortBy?: "price_asc" | "price_desc" | "model_asc" | "model_desc";
}

const LoadingSpinner = () => (
  <div className="text-center py-10">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
    <p className="text-gray-500 mt-4">Fahrzeuge werden geladen...</p>
  </div>
);

export default function SearchPage() {
  const [filterHeight, setFilterHeight] = useState<string>('calc(100vh - 8rem)');
  const { searchData, updateSearchData } = useSearch();

  const [filters, setFilters] = useState<SearchFilters>({
    type: [],
    maxPrice: 1000,
    brand: [],
    minPrice: 0,
    geartype: [],
    fuel: [],
    sortBy: "price_asc",
  });
  
  const [differentReturnLocation, setDifferentReturnLocation] = useState(searchData.differentReturnLocation);
  
  // Синхронизируем differentReturnLocation с контекстом
  useEffect(() => {
    setDifferentReturnLocation(searchData.differentReturnLocation);
  }, [searchData.differentReturnLocation]);
  const [visibleCount, setVisibleCount] = useState(12);
  const [displayedVehicles, setDisplayedVehicles] = useState<Vehicle[]>([]);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{
    sort: boolean;
    brand: boolean;
    type: boolean;
    transmission: boolean;
    fuel: boolean;
  }>({
    sort: true,
    brand: true,
    type: true,
    transmission: true,
    fuel: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Загружаем все автомобили без фильтров, фильтрация будет на клиенте
  const { vehicles, loading, error } = useVehicles({});

  // Scroll to top on mount/refresh - separate effect to avoid conflicts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Рассчитываем высоту фильтров на основе высоты карточек
  useEffect(() => {
    if (displayedVehicles.length === 0) return;
    
    const calculateFilterHeight = () => {
      if (window.innerWidth < 768) return; // Только для desktop
      
      // Находим первую карточку в grid
      const grid = document.querySelector('.grid.grid-cols-1');
      const firstCard = grid?.querySelector('[class*="bg-white"][class*="rounded-lg"]');
      if (firstCard) {
        const cardHeight = firstCard.getBoundingClientRect().height;
        // Высота 3 карточек + 2 gap (24px каждый на md)
        const threeCardsHeight = cardHeight * 3 + 24 * 2;
        setFilterHeight(`${Math.min(threeCardsHeight, window.innerHeight - 128)}px`);
      }
    };

    // Рассчитываем после загрузки карточек - с задержкой чтобы избежать дёргания
    const timer = setTimeout(calculateFilterHeight, 500);
    window.addEventListener('resize', calculateFilterHeight);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculateFilterHeight);
    };
  }, [displayedVehicles.length, visibleCount]);

  // Загружаем все доступные города
  useEffect(() => {
    const fetchLocations = async () => {
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
        setAvailableLocations(uniqueCities);
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };
    fetchLocations();
  }, []);

  // Обработка загрузки и фильтрации автомобилей
  useEffect(() => {
    if (loading) {
      return;
    }

    if (!vehicles || vehicles.length === 0) {
      setDisplayedVehicles([]);
      setInitialLoadComplete(true);
      return;
    }

    // Фильтрация автомобилей

    const filtered = vehicles
    .filter((vehicle) => {
        // Filter by pickup location (Abholung)
        // Важно: фильтруем только по городу аренды, НЕ по городу возврата
        // Город возврата не должен влиять на доступность автомобилей,
        // так как автомобиль будет возвращен туда ПОСЛЕ аренды
      if (searchData.pickupLocation) {
        const locs = Array.isArray(vehicle.locations)
          ? vehicle.locations
          : typeof vehicle.locations === 'string'
          ? (vehicle.locations as string).split(',').map((s: string) => s.trim())
          : [];
        const pickup = searchData.pickupLocation.trim().toLowerCase();
          // Извлекаем только название города из локаций (без координат)
          const cityNames = locs.map((l: string) => {
            const match = l.match(/^([^(]+)/);
            return match ? match[1].trim().toLowerCase() : l.trim().toLowerCase();
          });
          if (!cityNames.includes(pickup)) {
          return false;
        }
      }

        // НЕ фильтруем по dropoff location - город возврата не влияет на доступность автомобилей

        // Filter by vehicle type (можно выбрать несколько)
      if (filters.type && filters.type.length > 0) {
          const vehicleType = vehicle.vehicletype?.toLowerCase() || '';
          const typeMatches = filters.type.some((type) => type.toLowerCase() === vehicleType);
          if (!typeMatches) {
          return false;
        }
      }

        // Filter by brand (можно выбрать несколько)
      if (filters.brand && filters.brand.length > 0) {
          const vehicleBrand = vehicle.brand?.toLowerCase() || '';
          const brandMatches = filters.brand.some((brand) => brand.toLowerCase() === vehicleBrand);
          if (!brandMatches) {
          return false;
        }
      }

      // Filter by price
      const vehiclePrice = vehicle.priceperday || 0;
      if (vehiclePrice < filters.minPrice || vehiclePrice > filters.maxPrice) {
        return false;
      }

        // Filter by transmission type (можно выбрать несколько)
      if (filters.geartype && filters.geartype.length > 0) {
          const vehicleGeartype = vehicle.geartype?.toLowerCase() || '';
          const geartypeMatches = filters.geartype.some((t) => t.toLowerCase() === vehicleGeartype);
          if (!geartypeMatches) {
          return false;
        }
      }

        // Filter by fuel type (можно выбрать несколько)
      if (filters.fuel && filters.fuel.length > 0) {
          const vehicleFuel = vehicle.fuel?.toLowerCase() || '';
          const fuelMatches = filters.fuel.some((f) => f.toLowerCase() === vehicleFuel);
          if (!fuelMatches) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case "price_asc":
          return (a.priceperday || 0) - (b.priceperday || 0);
        case "price_desc":
          return (b.priceperday || 0) - (a.priceperday || 0);
        case "model_asc":
          return (a.model || "").localeCompare(b.model || "");
        case "model_desc":
          return (b.model || "").localeCompare(a.model || "");
        default:
          return 0;
      }
    });

    // Применяем фильтры

    // Применяем фильтры немедленно
    setDisplayedVehicles(filtered);
    
    if (!initialLoadComplete) {
      setInitialLoadComplete(true);
    }
  }, [vehicles, loading, filters, searchData.pickupLocation, searchData.dropoffLocation]);

  // Aktualisiert den Filter
  const toggleTypeFilter = (type: string) => {
    setFilters((prev) => {
      const types = prev.type || [];
      const newTypes = types.includes(type)
        ? types.filter((t) => t !== type)
        : [...types, type];
      return { ...prev, type: newTypes };
    });
  };

  // Aktualisiert den Markenfilter
  const toggleBrandFilter = (brand: string) => {
    setFilters((prev) => {
      const brands = prev.brand || [];
      const normalizedBrand = brand.toLowerCase();
      const newBrands = brands.includes(normalizedBrand)
        ? brands.filter((b) => b !== normalizedBrand)
        : [...brands, normalizedBrand];
      return { ...prev, brand: newBrands };
    });
  };

  // Aktualisiert die Sortierung
  const handleSortChange = (sortBy: SearchFilters["sortBy"]) => {
    setFilters((prev) => ({ ...prev, sortBy }));
  };

  // Обработка изменения "Andere Rückgabestelle"
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

  // Обработка изменения полей Abholung
  const handlePickupChange = (field: 'location' | 'date' | 'time', value: string) => {
    const fieldMap = {
      location: 'pickupLocation',
      date: 'pickupDate',
      time: 'pickupTime'
    } as const;
    
    updateSearchData({ 
      [fieldMap[field]]: value,
      // Если differentReturnLocation = false, синхронизируем dropoff
      ...(!differentReturnLocation ? {
        [`dropoff${field.charAt(0).toUpperCase() + field.slice(1)}`]: value
      } : {})
    });
  };

  // Lädt mehr Fahrzeuge
  const loadMore = () => {
    setVisibleCount((prev) => prev + 8);
  };

  // Сбрасываем счетчик видимых элементов при изменении фильтров
  useEffect(() => {
    if (initialLoadComplete) {
      setVisibleCount(12);
    }
  }, [filters, searchData.pickupLocation, searchData.dropoffLocation, initialLoadComplete]);

  // Получаем уникальные марки автомобилей (из всех автомобилей, не только отфильтрованных)
  const getUniqueBrands = () => {
    const brands = new Set<string>();
    vehicles.forEach((vehicle) => {
      if (vehicle.brand) {
        // Сохраняем оригинальное название марки для правильного отображения
        brands.add(vehicle.brand);
      }
    });
    // Сортируем и возвращаем
    return Array.from(brands).sort((a, b) => a.localeCompare(b));
  };

  // Добавляем функции для фильтров
  const toggleGeartypeFilter = (geartype: string) => {
    setFilters((prev) => {
      const geartypes = prev.geartype || [];
      const newGeartypes = geartypes.includes(geartype)
        ? geartypes.filter((t) => t !== geartype)
        : [...geartypes, geartype];
      return { ...prev, geartype: newGeartypes };
    });
  };

  const toggleFuelFilter = (fuel: string) => {
    setFilters((prev) => {
      const fuels = prev.fuel || [];
      const newFuels = fuels.includes(fuel)
        ? fuels.filter((f) => f !== fuel)
        : [...fuels, fuel];
      return { ...prev, fuel: newFuels };
    });
  };

  // Получаем уникальные типы автомобилей
  const getUniqueTypes = () => {
    const types = new Set<string>();
    vehicles.forEach((vehicle) => {
      if (vehicle.vehicletype) {
        types.add(vehicle.vehicletype.toLowerCase());
      }
    });
    return Array.from(types);
  };

  // Добавляем функции для получения уникальных значений
  const getUniqueGeartypes = () => {
    const geartypes = new Set<string>();
    vehicles.forEach((vehicle) => {
      if (vehicle.geartype) {
        geartypes.add(vehicle.geartype.toLowerCase());
      }
    });
    return Array.from(geartypes);
  };

  const getUniqueFuels = () => {
    const fuels = new Set<string>();
    vehicles.forEach((vehicle) => {
      if (vehicle.fuel) {
        fuels.add(vehicle.fuel.toLowerCase());
      }
    });
    return Array.from(fuels);
  };

  // Определяем, что показывать
  const showLoadingSpinner = !initialLoadComplete && loading;
  const showNoVehicles = initialLoadComplete && displayedVehicles.length === 0;
  const showVehicles = initialLoadComplete && displayedVehicles.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header />

      <main className="container mx-auto flex-1 py-4 md:py-6 px-4">
        {/* Suchformular */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-elegant-lg mb-4 md:mb-6 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Abholung Section */}
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
                      value={searchData.pickupLocation}
                      onChange={(e) => handlePickupChange('location', e.target.value)}
                      className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 pl-9 pr-4 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white hover:border-orange-300 dark:hover:border-orange-600 shadow-elegant appearance-none cursor-pointer"
                    >
                      <option value="">Bitte wählen</option>
                      {availableLocations.map((location) => (
                        <option key={location} value={location}>
                          {location}
                        </option>
                      ))}
                    </select>
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                      <FaMapMarkerAlt className="text-gray-400" size={14} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 custom-date-input">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <FaCalendarAlt className="text-orange-500" size={14} />
                    Datum
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={searchData.pickupDate}
                      onChange={(e) => handlePickupChange('date', e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 pl-9 pr-10 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white hover:border-orange-300 dark:hover:border-orange-600 shadow-elegant cursor-pointer"
                    />
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                      <FaCalendarAlt className="text-gray-400" size={14} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 custom-time-input">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <FaClock className="text-orange-500" size={14} />
                    Uhrzeit
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      value={searchData.pickupTime}
                      onChange={(e) => handlePickupChange('time', e.target.value)}
                      className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 pl-9 pr-10 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white hover:border-orange-300 dark:hover:border-orange-600 shadow-elegant cursor-pointer"
                    />
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                      <FaClock className="text-gray-400" size={14} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rückgabe Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-1 h-8 bg-orange-500 rounded-full"></div>
                <h3 className="font-bold text-lg md:text-xl text-gray-900 dark:text-white font-display">
                  Rückgabe
                </h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
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
                        value={searchData.dropoffLocation}
                        onChange={(e) => updateSearchData({ dropoffLocation: e.target.value })}
                        className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 pl-9 pr-4 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white hover:border-orange-300 dark:hover:border-orange-600 shadow-elegant appearance-none cursor-pointer"
                      >
                        <option value="">Bitte wählen</option>
                        {availableLocations.map((location) => (
                          <option key={location} value={location}>
                            {location}
                          </option>
                        ))}
                      </select>
                      <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                        <FaMapMarkerAlt className="text-gray-400" size={14} />
                      </div>
                    </div>
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
                      value={searchData.dropoffDate}
                      onChange={(e) => updateSearchData({ dropoffDate: e.target.value })}
                      min={searchData.pickupDate || new Date().toISOString().split("T")[0]}
                      className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 pl-9 pr-10 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white hover:border-orange-300 dark:hover:border-orange-600 shadow-elegant cursor-pointer"
                    />
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                      <FaCalendarAlt className="text-gray-400" size={14} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 custom-time-input">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <FaClock className="text-orange-500" size={14} />
                    Uhrzeit
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      value={searchData.dropoffTime}
                      onChange={(e) => updateSearchData({ dropoffTime: e.target.value })}
                      className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 pl-9 pr-10 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white hover:border-orange-300 dark:hover:border-orange-600 shadow-elegant cursor-pointer"
                    />
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                      <FaClock className="text-gray-400" size={14} />
                    </div>
                  </div>
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
        </div>

        {/* Mobile Filter Button */}
        <div className="md:hidden mb-4">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="w-full flex items-center justify-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors shadow-md hover:shadow-lg"
          >
            <MdFilterList size={20} />
            <span>Filters</span>
          </button>
        </div>

        {/* Mobile Filter Overlay */}
        {mobileFiltersOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setMobileFiltersOpen(false)}
          />
        )}

        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          {/* Linke Spalte: Filter */}
          <div className={`md:w-64 ${mobileFiltersOpen ? 'fixed inset-y-0 left-0 z-50 md:relative md:z-auto w-80 max-w-[85vw]' : 'hidden md:block'}`}>
            <div 
              className={`bg-white dark:bg-gray-800 rounded-xl md:rounded-xl p-5 shadow-elegant-lg border border-gray-200 dark:border-gray-700 md:sticky md:top-20 overflow-y-auto overflow-x-hidden ${mobileFiltersOpen ? 'm-0 md:m-0 rounded-none md:rounded-xl h-full' : ''}`}
              style={{
                ...(!mobileFiltersOpen && {
                  height: filterHeight,
                  maxHeight: 'calc(100vh - 8rem)'
                })
              }}
            >
              {/* Mobile Close Button */}
              {mobileFiltersOpen && (
                <div className="flex justify-between items-center mb-4 md:hidden">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Filters</h2>
                  <button
                    onClick={() => setMobileFiltersOpen(false)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label="Close filters"
                  >
                    <MdClose size={24} className="text-gray-600 dark:text-gray-300" />
                  </button>
                </div>
              )}
              {/* SORT BY Section */}
              <div className="mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
                <button
                  onClick={() => toggleSection('sort')}
                  className="w-full flex items-center justify-between text-left focus:outline-none group"
                >
                  <h3 className="uppercase text-xs font-semibold text-gray-700 dark:text-gray-300 tracking-wider group-hover:text-orange-500 transition-colors">
                    SORT BY
                  </h3>
                  {expandedSections.sort ? (
                    <MdExpandLess className="text-gray-500 dark:text-gray-400 group-hover:text-orange-500 transition-colors" size={20} />
                  ) : (
                    <MdExpandMore className="text-gray-500 dark:text-gray-400 group-hover:text-orange-500 transition-colors" size={20} />
                  )}
                </button>
                {expandedSections.sort && (
                  <div className="mt-3">
                    <select
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                      value={filters.sortBy}
                      onChange={(e) => {
                        handleSortChange(e.target.value as SearchFilters["sortBy"]);
                        if (mobileFiltersOpen) setMobileFiltersOpen(false);
                      }}
                    >
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                      <option value="model_asc">Model: A to Z</option>
                      <option value="model_desc">Model: Z to A</option>
                    </select>
                  </div>
                )}
              </div>

              {/* BRAND Section */}
              <div className="mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
                <button
                  onClick={() => toggleSection('brand')}
                  className="w-full flex items-center justify-between text-left focus:outline-none group"
                >
                  <h3 className="uppercase text-xs font-semibold text-gray-700 dark:text-gray-300 tracking-wider group-hover:text-orange-500 transition-colors">
                    BRAND
                  </h3>
                  {expandedSections.brand ? (
                    <MdExpandLess className="text-gray-500 dark:text-gray-400 group-hover:text-orange-500 transition-colors" size={20} />
                  ) : (
                    <MdExpandMore className="text-gray-500 dark:text-gray-400 group-hover:text-orange-500 transition-colors" size={20} />
                  )}
                </button>
                {expandedSections.brand && (
                  <div className="mt-3 space-y-2 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-700">
                    {getUniqueBrands().map((brand) => {
                      const normalizedBrand = brand.toLowerCase();
                      return (
                        <div key={brand} className="flex items-center py-1">
                          <input
                            type="checkbox"
                            id={`brand-${brand}`}
                            className="h-4 w-4 text-orange-500 focus:ring-orange-500 rounded cursor-pointer"
                            checked={filters.brand?.includes(normalizedBrand) || false}
                            onChange={() => toggleBrandFilter(brand)}
                          />
                          <label
                            htmlFor={`brand-${brand}`}
                            className="ml-2 text-sm text-gray-700 dark:text-white cursor-pointer hover:text-orange-500 transition-colors flex-1"
                          >
                            {brand}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* TYPE Section */}
              <div className="mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
                <button
                  onClick={() => toggleSection('type')}
                  className="w-full flex items-center justify-between text-left focus:outline-none group"
                >
                  <h3 className="uppercase text-xs font-semibold text-gray-700 dark:text-gray-300 tracking-wider group-hover:text-orange-500 transition-colors">
                    TYPE
                  </h3>
                  {expandedSections.type ? (
                    <MdExpandLess className="text-gray-500 dark:text-gray-400 group-hover:text-orange-500 transition-colors" size={20} />
                  ) : (
                    <MdExpandMore className="text-gray-500 dark:text-gray-400 group-hover:text-orange-500 transition-colors" size={20} />
                  )}
                </button>
                {expandedSections.type && (
                  <div className="mt-3 space-y-2">
                    {getUniqueTypes().map((type) => (
                      <div key={type} className="flex items-center py-1">
                        <input
                          type="checkbox"
                          id={`type-${type}`}
                          className="h-4 w-4 text-orange-500 focus:ring-orange-500 rounded cursor-pointer"
                          checked={filters.type?.includes(type)}
                          onChange={() => toggleTypeFilter(type)}
                        />
                        <label
                          htmlFor={`type-${type}`}
                          className="ml-2 text-sm text-gray-700 dark:text-white cursor-pointer hover:text-orange-500 transition-colors flex-1"
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* TRANSMISSION Section */}
              <div className="mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
                <button
                  onClick={() => toggleSection('transmission')}
                  className="w-full flex items-center justify-between text-left focus:outline-none group"
                >
                  <h3 className="uppercase text-xs font-semibold text-gray-700 dark:text-gray-300 tracking-wider group-hover:text-orange-500 transition-colors">
                    TRANSMISSION
                  </h3>
                  {expandedSections.transmission ? (
                    <MdExpandLess className="text-gray-500 dark:text-gray-400 group-hover:text-orange-500 transition-colors" size={20} />
                  ) : (
                    <MdExpandMore className="text-gray-500 dark:text-gray-400 group-hover:text-orange-500 transition-colors" size={20} />
                  )}
                </button>
                {expandedSections.transmission && (
                  <div className="mt-3 space-y-2">
                    {getUniqueGeartypes().map((geartype) => {
                      const isManual = geartype.toLowerCase().includes('manual') || geartype.toLowerCase() === 'manual';
                      const isAutomatic = geartype.toLowerCase().includes('automatic') || geartype.toLowerCase() === 'automatic';
                      return (
                        <div key={geartype} className="flex items-center py-1">
                          <input
                            type="checkbox"
                            id={`geartype-${geartype}`}
                            className="h-4 w-4 text-orange-500 focus:ring-orange-500 rounded cursor-pointer"
                            checked={filters.geartype?.includes(geartype)}
                            onChange={() => toggleGeartypeFilter(geartype)}
                          />
                          <label
                            htmlFor={`geartype-${geartype}`}
                            className="ml-2 text-sm text-gray-700 dark:text-white flex items-center cursor-pointer hover:text-orange-500 transition-colors flex-1"
                          >
                            {geartype.charAt(0).toUpperCase() + geartype.slice(1)}
                            {isManual ? (
                              <TbManualGearbox className="ml-2 text-gray-600 dark:text-gray-400" size={16} />
                            ) : isAutomatic ? (
                              <TbAutomaticGearbox className="ml-2 text-gray-600 dark:text-gray-400" size={16} />
                            ) : null}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* FUEL TYPE Section */}
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('fuel')}
                  className="w-full flex items-center justify-between text-left focus:outline-none group"
                >
                  <h3 className="uppercase text-xs font-semibold text-gray-700 dark:text-gray-300 tracking-wider group-hover:text-orange-500 transition-colors">
                    FUEL TYPE
                  </h3>
                  {expandedSections.fuel ? (
                    <MdExpandLess className="text-gray-500 dark:text-gray-400 group-hover:text-orange-500 transition-colors" size={20} />
                  ) : (
                    <MdExpandMore className="text-gray-500 dark:text-gray-400 group-hover:text-orange-500 transition-colors" size={20} />
                  )}
                </button>
                {expandedSections.fuel && (
                  <div className="mt-3 space-y-2">
                    {getUniqueFuels().map((fuel) => (
                      <div key={fuel} className="flex items-center py-1">
                        <input
                          type="checkbox"
                          id={`fuel-${fuel}`}
                          className="h-4 w-4 text-orange-500 focus:ring-orange-500 rounded cursor-pointer"
                          checked={filters.fuel?.includes(fuel)}
                          onChange={() => toggleFuelFilter(fuel)}
                        />
                        <label
                          htmlFor={`fuel-${fuel}`}
                          className="ml-2 text-sm text-gray-700 dark:text-white cursor-pointer hover:text-orange-500 transition-colors flex-1"
                        >
                          {fuel.charAt(0).toUpperCase() + fuel.slice(1)}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rechte Spalte: Fahrzeuge */}
          <div className="flex-1 w-full">
            <div className="relative min-h-[400px]">
              {showLoadingSpinner && <LoadingSpinner />}
              
              {error && (
                <div className="text-center py-10">
                  <p className="text-red-500">{error.message}</p>
                </div>
              )}
              
              {showNoVehicles && (
                <div className="text-center py-10">
                  <p className="text-gray-500 dark:text-gray-400">
                    No vehicles found.
                  </p>
                </div>
              )}

              {showVehicles && (
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {displayedVehicles.slice(0, visibleCount).map((vehicle) => (
                      <VehicleCard 
                        key={vehicle.id} 
                        vehicle={vehicle}
                        searchData={{
                          pickupLocation: searchData.pickupLocation,
                          pickupDate: searchData.pickupDate,
                          pickupTime: searchData.pickupTime,
                          dropoffLocation: searchData.dropoffLocation,
                          dropoffDate: searchData.dropoffDate,
                          dropoffTime: searchData.dropoffTime,
                        }}
                      />
                    ))}
                  </div>

                  {visibleCount < displayedVehicles.length && (
                    <div className="text-center mt-8">
                      <button
                        onClick={loadMore}
                        className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-smooth shadow-elegant hover:shadow-glow-orange button-press font-medium"
                      >
                        Show more
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
