import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { vehiclesAPI, Review, Vehicle, getImageUrl } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { FaStar } from "react-icons/fa";
import { MdOutlineArrowBackIos } from "react-icons/md";
import { TbManualGearbox, TbAutomaticGearbox } from "react-icons/tb";
import { FaSuitcase } from "react-icons/fa";

// Erweiterten Vehicle-Typ definieren, der Reviews enthält
type VehicleWithReviews = Vehicle & {
  reviews: Review[];
  locationCoordinates: Array<{
    name: string;
    lat: number;
    lng: number;
  }>;
};

export default function CarDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [vehicle, setVehicle] = useState<VehicleWithReviews | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const navigate = useNavigate();
  const { session } = useAuth();
  
  // Данные поиска теперь хранятся в SearchContext и автоматически доступны на всех страницах

  useEffect(() => {
    async function loadVehicle() {
      if (!id) return;

      setLoading(true);
      try {
        const vehicleData = await vehiclesAPI.getVehicleById(id);
        setVehicle(vehicleData);
        if (vehicleData?.reviews) {
          setReviews(vehicleData.reviews);
        }
      } catch (error) {
        console.error("Error loading vehicle:", error);
      } finally {
        setLoading(false);
      }
    }

    loadVehicle();
  }, [id]);

  const handleRentClick = () => {
    if (!session) {
      // Если пользователь не залогинен, перенаправляем на страницу входа
      navigate('/login');
      return;
    }
    
    if (id) {
      // Данные поиска уже в контексте, просто переходим на страницу оплаты
      navigate(`/payment/${id}`);
    }
  };

  const buildMapUrl = () => {
    const coords = vehicle?.locationCoordinates || [];

    if (coords.length === 0) {
      return "https://www.openstreetmap.org/export/embed.html?bbox=8.7833,53.0793,8.8133,53.0893&layer=mapnik&marker=53.0843,8.7983";
    }

    const lats = coords.map((c) => c.lat);
    const lngs = coords.map((c) => c.lng);
    const minLat = Math.min(...lats) - 0.01;
    const maxLat = Math.max(...lats) + 0.01;
    const minLng = Math.min(...lngs) - 0.01;
    const maxLng = Math.max(...lngs) + 0.01;

    const bbox = `${minLng},${minLat},${maxLng},${maxLat}`;
    let baseUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`;

    coords.forEach((coord) => {
      baseUrl += `&marker=${coord.lat},${coord.lng}`;
    });

    return baseUrl;
  };

  if (loading) {
    return (
      <div className="h-screen bg-gray-50 overflow-hidden dark:bg-gray-900 flex flex-col">
        <Header />
        <div className="container mx-auto flex-1 flex items-center justify-center py-12 px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-center mt-4 text-gray-500 dark:text-gray-400">
              Fahrzeugdaten werden geladen...
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="h-screen bg-gray-50 overflow-hidden dark:bg-gray-900 flex flex-col">
        <Header />
        <div className="container mx-auto flex-1 flex items-center justify-center py-12 px-4 text-center">
          <div>
            <p className="text-red-500">Fahrzeug nicht gefunden</p>
            <Link
              to="/"
              className="text-orange-500 mt-4 inline-block"
            >
              Zurück zur Startseite
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const averageRating =
    reviews.length > 0
      ? Math.round(
          (reviews.reduce((acc, review) => acc + review.stars, 0) /
            reviews.length) *
            10
        ) / 10
      : 0;

  const carData = {
    rating: averageRating || 4.2,
    reviewCount: reviews.length || 0,
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header />

      <main className="container mx-auto flex-1 py-4 md:py-6 px-4">
        <div className="mb-3 md:mb-4">
          <Link
            to="/search"
            className="flex items-center text-sm md:text-base text-gray-600 dark:text-gray-300 hover:text-orange-500 transition-colors"
          >
            <MdOutlineArrowBackIos className="mr-1" /> Zurück
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-elegant-lg border border-gray-100 dark:border-gray-700">
            <div className="relative w-full overflow-hidden" style={{ aspectRatio: '4/3' }}>
              <img
                src={
                    vehicle.carimg
                      ? getImageUrl(vehicle.carimg)
                      : `https://source.unsplash.com/random/800x600/?car,${vehicle.brand},${vehicle.model}`
                }
                alt={`${vehicle.brand} ${vehicle.model}`}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ 
                  objectPosition: 'center 35%'
                }}
                onError={(e) => {
                  // Fallback to placeholder if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.src = `https://source.unsplash.com/random/800x600/?car,${vehicle.brand},${vehicle.model}`;
                }}
              />
            </div>
            <div className="p-4 md:p-6">
              <h1 className="text-xl md:text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                {vehicle.brand} {vehicle.model}
              </h1>
              <div className="flex items-center">
                <div className="flex items-center text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <span key={i}>
                      {i < Math.floor(carData.rating) ? (
                        <FaStar />
                      ) : i < Math.floor(carData.rating) + 0.5 ? (
                        <span className="relative">
                          <FaStar className="text-gray-300 dark:text-gray-600" />
                          <FaStar
                            className="absolute top-0 left-0 overflow-hidden"
                            style={{ clipPath: "inset(0 50% 0 0)" }}
                          />
                        </span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600">
                          <FaStar />
                        </span>
                      )}
                    </span>
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  {carData.reviewCount} Bewertungen
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-elegant-lg border border-gray-100 dark:border-gray-700 flex flex-col">
            <div className="flex-1">
              <div className="grid grid-cols-2 gap-2.5 md:gap-3 mb-4 md:mb-5">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5 md:p-3">
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Typ</p>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">
                    {vehicle.vehicletype || "Car"}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5 md:p-3">
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Sitzplätze</p>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">
                    {carData.capacity}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5 md:p-3">
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Motor</p>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">
                    {carData.fuel}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5 md:p-3">
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Türen</p>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">
                    {carData.doors}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5 md:p-3">
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">
                    Getriebe
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm flex items-center">
                    {carData.transmission}
                    {carData.transmission?.toLowerCase().includes('manual') ? (
                      <TbManualGearbox className="ml-1.5" size={16} />
                    ) : carData.transmission?.toLowerCase().includes('automatic') ? (
                      <TbAutomaticGearbox className="ml-1.5" size={16} />
                    ) : null}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5 md:p-3">
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Farbe</p>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">
                    {carData.color}
                  </p>
                </div>
                {carData.year && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5 md:p-3">
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Jahr</p>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      {carData.year}
                    </p>
                  </div>
                )}
                {carData.horsepower && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5 md:p-3">
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Leistung</p>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      {carData.horsepower} {typeof carData.horsepower === 'number' ? 'PS' : ''}
                    </p>
                  </div>
                )}
                {carData.luggage && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5 md:p-3">
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">
                      Kofferraum
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm flex items-center">
                      {carData.luggage} Stk
                      <FaSuitcase className="ml-1" size={12} />
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700 gap-3">
              <div>
                <span className="text-2xl md:text-3xl font-bold text-white">
                  €{carData.price}
                </span>
                <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">/Tag</span>
              </div>
              <button
                onClick={handleRentClick}
                className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-smooth shadow-elegant hover:shadow-glow-orange button-press font-medium"
              >
                Jetzt mieten
              </button>
            </div>
          </div>

          <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-elegant-lg border border-gray-100 dark:border-gray-700">
            <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4 text-gray-900 dark:text-white">
              Standort
            </h2>
            <div className="relative h-[250px] md:h-[400px] bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
              <iframe
                src={buildMapUrl()}
                className="w-full h-full border-0"
                title="Standortkarte mit verfügbaren Standorten"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>

              {vehicle.locations && vehicle.locations.length > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 bg-opacity-90 dark:bg-opacity-90 p-3 text-xs">
                    <p className="font-medium mb-1 text-gray-900 dark:text-white">
                      Verfügbare Standorte:
                    </p>
                    <div className="grid grid-cols-2 gap-1">
                      {(() => {
                        const extractCityName = (location: string): string => {
                          const match = location.match(/^([^(]+)/);
                          return match ? match[1].trim() : location.trim();
                        };
                        
                        // Handle locations as array or string (for backward compatibility)
                        const locs: string[] = Array.isArray(vehicle.locations)
                          ? vehicle.locations
                          : (vehicle.locations && typeof vehicle.locations === 'string')
                          ? (vehicle.locations as string).split(',').map((s: string) => s.trim())
                          : [];
                        
                        const uniqueCities = Array.from(new Set(locs.map(extractCityName)));
                        
                        return uniqueCities.map((city: string, index: number) => (
                        <div key={index} className="flex items-center">
                            <span className="inline-block w-2 h-2 bg-orange-500 rounded-full mr-1"></span>
                          <span className="text-gray-700 dark:text-gray-300">
                              {city}
                          </span>
                        </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>

        <div className="mt-6 md:mt-10">
          <div className="flex items-center mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
              Bewertungen
            </h2>
            <div className="ml-3 bg-orange-500 text-white text-xs md:text-sm px-2 py-1 rounded-md">
              {reviews.length}
            </div>
          </div>

          {reviews.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-elegant-lg border border-gray-100 dark:border-gray-700 text-center">
              <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">
                Keine Bewertungen für dieses Fahrzeug
              </p>
            </div>
          ) : (
            <div className="space-y-4 md:space-y-6">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-elegant-lg border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                    <div className="flex items-start flex-1">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-500 dark:text-gray-400">
                          {review.name ? review.name.charAt(0) : "?"}
                        </span>
                      </div>
                      <div className="ml-3 md:ml-4 flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white text-sm md:text-base">
                          {review.name}
                        </h3>
                        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {review.text}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right w-full sm:w-auto">
                      <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                        {review.date}
                      </p>
                      <div className="flex items-center text-yellow-400 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i}>
                            {i < review.stars ? (
                              <FaStar size={14} />
                            ) : (
                              <span className="text-gray-300 dark:text-gray-600">
                                <FaStar size={14} />
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
