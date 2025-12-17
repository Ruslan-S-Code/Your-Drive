import { useNavigate } from "react-router-dom";

export default function HeroBanner() {
  const navigate = useNavigate();

  const handleBookNowClick = () => {
    navigate("/search");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      {/* Erster Banner */}
      <div className="relative overflow-hidden rounded-lg bg-gray-900 text-white p-4 md:p-6 min-h-[200px] md:min-h-[250px]">
        <div className="flex flex-col justify-between h-full relative z-10">
          <div className="mb-4 md:mb-8">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2">
              Der beste Platz, um ein Auto zu mieten
            </h2>
            <p className="text-gray-200 text-xs md:text-sm lg:text-base">
              Finden Sie für jeden Anlass das perfekte Fahrzeug
            </p>
          </div>

          <div>
            <button
              onClick={handleBookNowClick}
              className="bg-orange-500 text-white font-medium px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm md:text-base shadow-lg hover:shadow-xl"
            >
              Buchen Sie jetzt
            </button>
          </div>
        </div>

        {/* Hintergrundbild */}
        <div className="absolute top-0 right-0 w-2/3 h-full opacity-30 md:opacity-50">
          <img
            src="https://images.unsplash.com/photo-1580273916550-e323be2ae537?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60"
            alt="Luxus-Auto"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Zweiter Banner */}
      <div className="relative overflow-hidden rounded-lg bg-violet-700 text-white p-4 md:p-6 min-h-[200px] md:min-h-[250px]">
        <div className="flex flex-col justify-between h-full relative z-10">
          <div className="mb-4 md:mb-8">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2">
              Fahren leicht gemacht
            </h2>
            <p className="text-violet-100 text-xs md:text-sm lg:text-base">
              Einfache Buchung, schnelle Bereitstellung
            </p>
          </div>

          <div>
            <button className="bg-white text-violet-700 font-medium px-4 py-2 rounded-lg hover:bg-violet-50 transition-colors text-sm md:text-base">
              Mehr erfahren
            </button>
          </div>
        </div>

        {/* Hintergrundbild */}
        <div className="absolute top-0 right-0 w-2/3 h-full opacity-30 md:opacity-50">
          <img
            src="https://images.unsplash.com/photo-1494905998402-395d579af36f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60"
            alt="Luxus-Auto"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}
