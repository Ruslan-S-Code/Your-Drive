import { useState } from "react";
import { reviewsAPI } from "../lib/api";
import { FaStar } from "react-icons/fa";

interface ReviewFormProps {
  bookingId: string;
  vehicleId: string;
  vehicleName: string;
  onReviewSubmitted: () => void;
  onCancel?: () => void;
}

export default function ReviewForm({
  bookingId,
  vehicleId,
  vehicleName,
  onReviewSubmitted,
  onCancel,
}: ReviewFormProps) {
  const [text, setText] = useState("");
  const [stars, setStars] = useState(5);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!text.trim()) {
      setError("Bitte geben Sie einen Kommentar ein");
      return;
    }

    if (stars < 1 || stars > 5) {
      setError("Bitte wählen Sie eine Bewertung zwischen 1 und 5 Sternen");
      return;
    }

    setIsSubmitting(true);
    try {
      await reviewsAPI.createReview({
        vehicleId,
        text: text.trim(),
        stars,
        bookingId,
      });
      setText("");
      setStars(5);
      onReviewSubmitted();
    } catch (err: any) {
      setError(err.message || "Fehler beim Erstellen des Kommentars");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-elegant-lg border border-gray-100 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        Bewertung für {vehicleName}
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Bewertung
          </label>
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setStars(star)}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                className="focus:outline-none transition-transform hover:scale-110"
                aria-label={`${star} Sterne`}
              >
                <FaStar
                  className={`w-6 h-6 transition-colors ${
                    star <= (hoveredStar || stars)
                      ? "text-yellow-400 fill-current"
                      : "text-gray-300 dark:text-gray-600"
                  }`}
                />
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
              {stars} {stars === 1 ? "Stern" : "Sterne"}
            </span>
          </div>
        </div>

        <div>
          <label
            htmlFor="review-text"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Kommentar
          </label>
          <textarea
            id="review-text"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white resize-none"
            placeholder="Teilen Sie Ihre Erfahrungen mit diesem Fahrzeug..."
            required
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-smooth shadow-elegant hover:shadow-glow-orange button-press font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Wird gesendet..." : "Bewertung absenden"}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="sm:w-auto px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Abbrechen
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

