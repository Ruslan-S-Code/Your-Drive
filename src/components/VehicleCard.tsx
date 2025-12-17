import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Vehicle, getImageUrl, favoritesAPI } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { FaGasPump, FaUserFriends, FaHeart } from "react-icons/fa";
import { GiGearStickPattern } from "react-icons/gi";
import { TbManualGearbox, TbAutomaticGearbox } from "react-icons/tb";

interface VehicleCardProps {
  vehicle: Vehicle;
  searchData?: {
    pickupLocation?: string;
    pickupDate?: string;
    pickupTime?: string;
    dropoffLocation?: string;
    dropoffDate?: string;
    dropoffTime?: string;
  } | null;
}

export default function VehicleCard({ vehicle, searchData }: VehicleCardProps) {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);

  useEffect(() => {
    if (session) {
      favoritesAPI.checkFavorite(vehicle.id)
        .then(setIsFavorited)
        .catch(() => setIsFavorited(false));
    }
  }, [session, vehicle.id]);

  const handleRentClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/cars/${vehicle.id}`, {
      state: searchData || undefined
    });
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!session) {
      navigate('/login');
      return;
    }

    setIsLoadingFavorite(true);
    try {
      if (isFavorited) {
        await favoritesAPI.removeFavorite(vehicle.id);
        setIsFavorited(false);
      } else {
        await favoritesAPI.addFavorite(vehicle.id);
        setIsFavorited(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsLoadingFavorite(false);
    }
  };

  const isManual = vehicle.geartype?.toLowerCase().includes('manual') || 
                   vehicle.geartype?.toLowerCase() === 'manual';
  const isAutomatic = vehicle.geartype?.toLowerCase().includes('automatic') || 
                      vehicle.geartype?.toLowerCase() === 'automatic';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-elegant transition-smooth card-hover h-full flex flex-col">
      <div className="p-3 md:p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base md:text-lg text-gray-900 dark:text-white truncate">
              {vehicle.brand} {vehicle.model}
            </h3>
            <p className="text-xs uppercase text-gray-500 dark:text-gray-300">
              {vehicle.vehicletype}
            </p>
          </div>
          <button
            onClick={handleFavoriteClick}
            disabled={isLoadingFavorite}
            className={`flex-shrink-0 ml-2 transition-all ${
              isFavorited 
                ? 'text-red-500' 
                : 'text-gray-400 hover:text-red-500'
            } ${isLoadingFavorite ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            aria-label={isFavorited ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
          >
            <FaHeart size={18} className={isFavorited ? 'fill-current' : ''} />
          </button>
        </div>
      </div>

      <div className="px-3 md:px-4 pb-2 flex-shrink-0">
        <div className="relative w-full overflow-hidden rounded" style={{ aspectRatio: '16/9', position: 'relative' }}>
          <img
            src={
              vehicle.carimg
                ? getImageUrl(vehicle.carimg)
                : `https://source.unsplash.com/random/800x600/?car,${vehicle.brand},${vehicle.model}`
            }
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ 
              objectPosition: 'center 50%'
            }}
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              const target = e.target as HTMLImageElement;
              target.src = `https://source.unsplash.com/random/800x600/?car,${vehicle.brand},${vehicle.model}`;
            }}
          />
        </div>
      </div>

      <div className="px-3 md:px-4 py-3">
        <div className="flex justify-between items-center mb-3 md:mb-4 flex-wrap gap-2">
          <div className="flex items-center text-xs md:text-sm text-gray-600 dark:text-gray-300">
            <FaGasPump className="mr-1" size={12} />
            <span>{vehicle.fuel || "Benzin"}</span>
          </div>
          <div className="flex items-center text-xs md:text-sm text-gray-600 dark:text-gray-300">
            <span>{vehicle.geartype || "Manual"}</span>
            {isManual ? (
              <TbManualGearbox className="ml-1" size={14} title="Manual" />
            ) : isAutomatic ? (
              <TbAutomaticGearbox className="ml-1" size={14} title="Automatic" />
            ) : (
              <GiGearStickPattern className="ml-1" size={12} />
            )}
          </div>
          <div className="flex items-center text-xs md:text-sm text-gray-600 dark:text-gray-300">
            <FaUserFriends className="mr-1" size={12} />
            <span>{vehicle.seats || "4"}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <span className="font-bold text-base md:text-lg text-gray-900 dark:text-white">
              ${vehicle.priceperday || "55"}
            </span>
            <span className="text-xs md:text-sm text-gray-500 dark:text-gray-300">
              / day
            </span>
          </div>
          <button
            onClick={handleRentClick}
            className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-lg text-xs md:text-sm transition-smooth shadow-elegant hover:shadow-glow-orange button-press text-center font-medium"
          >
            Rent now
          </button>
        </div>
      </div>
    </div>
  );
}
