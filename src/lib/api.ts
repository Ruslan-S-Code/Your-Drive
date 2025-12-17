// API Client для работы с backend

// Determine API URL based on environment
const getApiUrl = (): string => {
  // If VITE_API_URL is explicitly set, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // In production (Vercel), default to Render backend
  if (import.meta.env.PROD) {
    // Default production backend URL
    return 'https://your-drive.onrender.com/api';
  }
  
  // Development default
  return 'http://localhost:3001/api';
};

const API_URL = getApiUrl();

// Log API URL for debugging (both dev and prod)
console.log('[API] Environment:', import.meta.env.MODE);
console.log('[API] Using API URL:', API_URL);
console.log('[API] VITE_API_URL env var:', import.meta.env.VITE_API_URL || 'not set');

// Helper function to check if backend is ready
async function waitForBackend(maxAttempts = 10, delay = 1000): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`${API_URL.replace('/api', '')}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      });
      if (response.ok) {
        return true;
      }
    } catch (error) {
      // Backend not ready yet, wait and retry
      if (i < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  return false;
}

// Check backend on module load (only in development)
if (import.meta.env.DEV) {
  waitForBackend().catch(() => {
    // Backend health check failed, but continuing...
  });
}

// Types
export type Vehicle = {
  id: string;
  vehicleid: string;
  brand: string;
  model: string;
  year: number;
  vehicletype: string;
  colors: string;
  locations: string[] | string;
  priceperday: number;
  availability: boolean;
  electricvehicle: boolean;
  carimg: string;
  seats: number;
  doors?: number;
  luggage: number;
  horstpower: string;
  ps: number;
  consumption: string;
  fuel: string;
  geartype: string;
  created_at: string;
  featured?: boolean;
  rating?: number;
  discount?: number;
};

export type Location = {
  country: any;
  city: any;
  postal_code: any;
  address: any;
  name: any;
  id: string;
  locations: string[];
  created_at: string;
};

export type Review = {
  id: string;
  vehicleid: string;
  name: string;
  text: string;
  stars: number;
  date: string;
  created_at: string;
};

export type Booking = {
  id: string;
  vehicle_id: string;
  user_id: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_date: string;
  dropoff_date: string;
  total_price: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  full_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  email: string | null;
  address: string | null;
  country_code: string | null;
  country: string | null;
  zip_code: string | null;
  city: string | null;
  state: string | null;
  updated_at: string | null;
};

// Helper function to get auth token
function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

// Helper function to set auth token
function setAuthToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

// Helper function to remove auth token
function removeAuthToken(): void {
  localStorage.removeItem('auth_token');
}

// API request helper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const fullUrl = `${API_URL}${endpoint}`;
    console.log(`[API] Requesting: ${fullUrl}`);
    
    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { error: errorText || `HTTP error! status: ${response.status}` };
      }
      console.error(`[API] Error response from ${fullUrl}:`, error);
      throw new Error(error.error || error.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error(`[API] Failed to fetch from ${API_URL}${endpoint}:`, error);
      throw new Error(`Failed to connect to server. Please make sure the backend is running on ${API_URL}`);
    }
    throw error;
  }
}

// Auth API
export const authAPI = {
  async register(email: string, password: string, fullName?: string) {
    const data = await apiRequest<{ token: string; user: { id: string; email: string } }>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({ email, password, fullName }),
      }
    );
    if (data.token) {
      setAuthToken(data.token);
    }
    return data;
  },

  async login(email: string, password: string) {
    const data = await apiRequest<{ token: string; user: { id: string; email: string } }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
    if (data.token) {
      setAuthToken(data.token);
    }
    return data;
  },

  async logout() {
    removeAuthToken();
  },

  async getCurrentUser() {
    return apiRequest<Profile & { id: string; email: string; created_at: string }>(
      '/auth/me'
    );
  },

  async resetPasswordRequest(email: string) {
    return apiRequest<{ message: string }>('/auth/reset-password-request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(token: string, password: string) {
    return apiRequest<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  },

  async updatePassword(currentPassword: string, newPassword: string) {
    return apiRequest<{ message: string }>('/auth/update-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
};

// Vehicles API
export const vehiclesAPI = {
  async getVehicles(filters?: Partial<Vehicle>) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const queryString = params.toString();
    return apiRequest<Vehicle[]>(`/vehicles${queryString ? `?${queryString}` : ''}`);
  },

  async getVehicleById(id: string) {
    return apiRequest<Vehicle & { reviews: Review[]; locationCoordinates: any[] }>(
      `/vehicles/${id}`
    );
  },
};

// Locations API
export const locationsAPI = {
  async getLocations() {
    return apiRequest<Location[]>('/locations');
  },

  async getLocationById(id: string) {
    return apiRequest<Location>(`/locations/${id}`);
  },
};

// Reviews API
export const reviewsAPI = {
  async getReviews(vehicleId: string) {
    return apiRequest<Review[]>(`/reviews/vehicle/${vehicleId}`);
  },

  async createReview(data: {
    vehicleId: string;
    text: string;
    stars: number;
    bookingId?: string;
  }) {
    return apiRequest<Review>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async checkCanReview(bookingId: string) {
    return apiRequest<{
      canReview: boolean;
      reason?: string;
      reviewId?: string;
      booking?: Booking;
      vehicleId?: string;
      vehicleid?: string;
    }>(`/reviews/booking/${bookingId}/check`);
  },
};

// Bookings API
export const bookingsAPI = {
  async createBooking(booking: Omit<Booking, "id" | "created_at" | "updated_at">) {
    return apiRequest<Booking>('/bookings', {
      method: 'POST',
      body: JSON.stringify(booking),
    });
  },

  async getUserBookings(userId: string) {
    return apiRequest<(Booking & { vehicles: Vehicle | null })[]>(
      `/bookings/user/${userId}`
    );
  },

  async getBookingById(id: string) {
    return apiRequest<Booking>(`/bookings/${id}`);
  },

  async updateBookingStatus(id: string, status: Booking['status']) {
    return apiRequest<Booking>(`/bookings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

// Profiles API
export const profilesAPI = {
  async getUserProfile(userId: string) {
    return apiRequest<Profile>(`/profiles/${userId}`);
  },

  async updateUserProfile(userId: string, updates: Partial<Profile>) {
    return apiRequest<Profile>(`/profiles/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
};

// Favorites API
export const favoritesAPI = {
  async getFavorites(): Promise<Vehicle[]> {
    return apiRequest<Vehicle[]>('/favorites');
  },

  async addFavorite(vehicleId: string): Promise<void> {
    return apiRequest<void>(`/favorites/${vehicleId}`, {
      method: 'POST',
    });
  },

  async removeFavorite(vehicleId: string): Promise<void> {
    return apiRequest<void>(`/favorites/${vehicleId}`, {
      method: 'DELETE',
    });
  },

  async checkFavorite(vehicleId: string): Promise<boolean> {
    const result = await apiRequest<{ isFavorited: boolean }>(`/favorites/check/${vehicleId}`);
    return result.isFavorited;
  },
};

// Storage API
export const storageAPI = {
  async uploadAvatar(file: File): Promise<string> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch(`${API_URL}/storage/upload/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'Upload failed');
    }

    const data = await response.json();
    return data.url;
  },
};

// Helper function to get image URL (handles spaces in file names)
export function getImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) {
    return '';
  }
  
  // If it's already a full URL (http/https), convert http to https for security
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    // Convert http to https to avoid mixed content warnings
    if (imagePath.startsWith('http://')) {
      return imagePath.replace('http://', 'https://');
    }
    return imagePath;
  }
  
  // For local paths in Vite, we need to encode the path properly
  // Split by '/' and encode each segment separately to preserve directory structure
  const parts = imagePath.split('/').filter(part => part.length > 0);
  const encodedParts = parts.map(part => encodeURIComponent(part));
  
  // Reconstruct path with leading slash
  return '/' + encodedParts.join('/');
}

// Export token management functions
export { getAuthToken, setAuthToken, removeAuthToken };

