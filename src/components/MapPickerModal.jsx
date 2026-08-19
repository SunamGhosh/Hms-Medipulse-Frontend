import React, { useEffect, useRef, useState } from 'react';
import { X, MapPin, Navigation, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import './MapPickerModal.css';

const MapPickerModal = ({ isOpen, onClose, onConfirmAddress, initialAddress }) => {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markerRef = useRef(null);

  const [loadingAddr, setLoadingAddr] = useState(false);
  const [selectedAddr, setSelectedAddr] = useState({
    street: '',
    city: '',
    state: '',
    zip_code: '',
    fullText: 'Move pin on map to select location...'
  });

  useEffect(() => {
    if (!isOpen) return;

    // Load Leaflet CSS dynamically if not present
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load Leaflet JS dynamically if not present
    if (!window.L) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => initMap();
      document.body.appendChild(script);
    } else {
      setTimeout(initMap, 150);
    }

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, [isOpen]);

  const reverseGeocode = async (lat, lng) => {
    setLoadingAddr(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const streetName = [
          addr.building || addr.house_number || '',
          addr.road || addr.suburb || addr.neighbourhood || addr.residential || ''
        ].filter(Boolean).join(', ') || (data.display_name ? data.display_name.split(',')[0] : '');

        const city = addr.city || addr.town || addr.village || addr.county || addr.state_district || '';
        const state = addr.state || '';
        const zip = addr.postcode || '';

        const full = [streetName, city, state, zip].filter(Boolean).join(', ');

        setSelectedAddr({
          street: streetName || data.display_name || '',
          city: city,
          state: state,
          zip_code: zip,
          fullText: full || data.display_name || 'Selected Location'
        });
      }
    } catch (err) {
      console.error('Reverse geocode error:', err);
    } finally {
      setLoadingAddr(false);
    }
  };

  const initMap = () => {
    if (!mapRef.current || !window.L) return;
    if (leafletMap.current) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setupLeaflet(lat, lng, 15);
        },
        () => {
          setupLeaflet(20.5937, 78.9629, 5);
        }
      );
    } else {
      setupLeaflet(20.5937, 78.9629, 5);
    }
  };

  const setupLeaflet = (lat, lng, zoom) => {
    if (!mapRef.current || !window.L) return;
    const L = window.L;

    const map = L.map(mapRef.current).setView([lat, lng], zoom);
    leafletMap.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const customIcon = L.divIcon({
      className: 'custom-map-pin',
      html: `<div style="background-color:#0d9488;width:34px;height:34px;border-radius:50%;border:3px solid white;box-shadow:0 4px 14px rgba(13,148,136,0.6);display:flex;align-items:center;justify-content:center;color:white;font-size:16px;">📍</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 34]
    });

    const marker = L.marker([lat, lng], { draggable: true, icon: customIcon }).addTo(map);
    markerRef.current = marker;

    reverseGeocode(lat, lng);

    marker.on('dragend', () => {
      const position = marker.getLatLng();
      reverseGeocode(position.lat, position.lng);
    });

    map.on('click', (e) => {
      const { lat: clickLat, lng: clickLng } = e.latlng;
      marker.setLatLng([clickLat, clickLng]);
      reverseGeocode(clickLat, clickLng);
    });
  };

  const handleRecenterGPS = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }
    toast.loading('Locating...', { id: 'mapGeo' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (leafletMap.current && markerRef.current) {
          leafletMap.current.setView([latitude, longitude], 16);
          markerRef.current.setLatLng([latitude, longitude]);
          reverseGeocode(latitude, longitude);
          toast.success('Centered to your location', { id: 'mapGeo' });
        }
      },
      () => {
        toast.error('Could not get GPS location', { id: 'mapGeo' });
      }
    );
  };

  const handleConfirm = () => {
    if (!selectedAddr.street && !selectedAddr.city) {
      toast.error('Please select a location on the map');
      return;
    }
    onConfirmAddress(selectedAddr);
    toast.success('📍 Delivery location pinned!');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="map-modal-overlay">
      <div className="map-modal-container">
        <div className="map-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={20} color="#0d9488" />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Pinpoint Delivery Location</h3>
          </div>
          <button className="map-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="map-canvas-wrapper">
          <div ref={mapRef} className="map-canvas" />
          <button className="map-recenter-btn" onClick={handleRecenterGPS} title="Locate Me">
            <Navigation size={18} color="#0d9488" />
          </button>
          <div className="map-hint-pill">Drag pin or tap anywhere on map</div>
        </div>

        <div className="map-modal-footer">
          <div className="map-address-preview">
            <div className="map-address-label">Selected Delivery Location</div>
            <div className="map-address-text">
              {loadingAddr ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#64748b' }}>
                  <Loader2 size={14} className="animate-spin" /> Fetching address details...
                </span>
              ) : (
                selectedAddr.fullText
              )}
            </div>
          </div>
          <button className="map-confirm-btn" onClick={handleConfirm} disabled={loadingAddr}>
            <Check size={18} /> Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapPickerModal;
