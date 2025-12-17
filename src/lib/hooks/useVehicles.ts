import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { vehiclesAPI, Vehicle } from "../api";

export interface VehicleFilters {
  brand?: string;
  vehicletype?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  availability?: boolean;
  electricvehicle?: boolean;
  geartype?: string;
  seats?: number;
  luggage?: number;
}

export function useVehicles(filters?: VehicleFilters) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const filtersRef = useRef(filters);

  // Обновляем ref при изменении фильтров
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  // Мемоизируем строковое представление фильтров для стабильности зависимостей
  const filtersKey = useMemo(() => {
    if (!filters) return '';
    return JSON.stringify({
      brand: filters.brand,
      vehicletype: filters.vehicletype,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      location: filters.location,
      availability: filters.availability,
      electricvehicle: filters.electricvehicle,
      geartype: filters.geartype,
      seats: filters.seats,
      luggage: filters.luggage,
    });
  }, [
    filters?.brand,
    filters?.vehicletype,
    filters?.minPrice,
    filters?.maxPrice,
    filters?.location,
    filters?.availability,
    filters?.electricvehicle,
    filters?.geartype,
    filters?.seats,
    filters?.luggage,
  ]);

  // Данные при изменении фильтров
  useEffect(() => {
    let isMounted = true;

    const fetchVehicles = async () => {
      const currentFilters = filtersRef.current;
      
      try {
        setLoading(true);
        setError(null);

      // Prepare filters for API
      const apiFilters: any = {};
        if (currentFilters) {
          if (currentFilters.brand) apiFilters.brand = currentFilters.brand;
          if (currentFilters.vehicletype) apiFilters.vehicletype = currentFilters.vehicletype;
          if (currentFilters.minPrice) apiFilters.minPrice = currentFilters.minPrice;
          if (currentFilters.maxPrice) apiFilters.maxPrice = currentFilters.maxPrice;
          if (currentFilters.location) apiFilters.location = currentFilters.location;
          if (currentFilters.availability !== undefined) apiFilters.availability = currentFilters.availability;
          if (currentFilters.electricvehicle !== undefined) apiFilters.electricvehicle = currentFilters.electricvehicle;
          if (currentFilters.geartype) apiFilters.geartype = currentFilters.geartype;
          if (currentFilters.seats) apiFilters.seats = currentFilters.seats;
          if (currentFilters.luggage) apiFilters.luggage = currentFilters.luggage;
      }

      const data = await vehiclesAPI.getVehicles(apiFilters);

      if (!isMounted) return;

      if (!data) {
        throw new Error("Keine Daten vom Server erhalten");
      }

      // Daten sortieren
      const sortedData = [...data].sort(
        (a, b) => (a.priceperday || 0) - (b.priceperday || 0)
      );

        setVehicles(sortedData as Vehicle[]);
      } catch (err) {
        if (!isMounted) return;
        console.error('[useVehicles] Fehler beim Laden:', err);
        setError(
          err instanceof Error
            ? err
            : new Error("Ein unbekannter Fehler ist aufgetreten")
        );
        setVehicles([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchVehicles();

    return () => {
      isMounted = false;
    };
  }, [filtersKey]);

  const refresh = useCallback(async () => {
    const currentFilters = filtersRef.current;
    
    setLoading(true);
    setError(null);

    try {
      const apiFilters: any = {};
      if (currentFilters) {
        if (currentFilters.brand) apiFilters.brand = currentFilters.brand;
        if (currentFilters.vehicletype) apiFilters.vehicletype = currentFilters.vehicletype;
        if (currentFilters.minPrice) apiFilters.minPrice = currentFilters.minPrice;
        if (currentFilters.maxPrice) apiFilters.maxPrice = currentFilters.maxPrice;
        if (currentFilters.location) apiFilters.location = currentFilters.location;
        if (currentFilters.availability !== undefined) apiFilters.availability = currentFilters.availability;
        if (currentFilters.electricvehicle !== undefined) apiFilters.electricvehicle = currentFilters.electricvehicle;
        if (currentFilters.geartype) apiFilters.geartype = currentFilters.geartype;
        if (currentFilters.seats) apiFilters.seats = currentFilters.seats;
        if (currentFilters.luggage) apiFilters.luggage = currentFilters.luggage;
      }

      const data = await vehiclesAPI.getVehicles(apiFilters);
      
      if (!data) {
        throw new Error("Keine Daten vom Server erhalten");
      }

      const sortedData = [...data].sort(
        (a, b) => (a.priceperday || 0) - (b.priceperday || 0)
      );

      setVehicles(sortedData as Vehicle[]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("Ein unbekannter Fehler ist aufgetreten")
      );
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    vehicles,
    loading,
    error,
    refresh,
  };
}
