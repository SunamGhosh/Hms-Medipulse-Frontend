import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, Navigation, MapPin, Phone, Clock, Truck, ShieldCheck, User } from 'lucide-react';
import './DeliveryRouteMapModal.css';

// Fix default leaflet marker icon issue in Vite/Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const CITY_COORDINATES = {
  jamshedpur: [22.8046, 86.2029],
  ranchi: [23.3441, 85.3096],
  kolkata: [22.5726, 88.3639],
  delhi: [28.6139, 77.2090],
  mumbai: [19.0760, 72.8777],
  bangalore: [12.9716, 77.5946],
  bengaluru: [12.9716, 77.5946],
  patna: [25.5941, 85.1376],
  dhanbad: [23.7957, 86.4304],
  bokaro: [23.6693, 86.1511],
};

const getBaseCoordinates = (address) => {
  const fullAddrStr = `${address?.street || ''} ${address?.city || ''} ${address?.state || ''} ${address?.zip_code || ''}`.toLowerCase();
  
  if (fullAddrStr.includes('jamshedpur') || address?.zip_code?.startsWith('831')) {
    return [22.8046, 86.2029]; // Jamshedpur, Jharkhand
  }
  
  for (const [city, coords] of Object.entries(CITY_COORDINATES)) {
    if (fullAddrStr.includes(city)) {
      return coords;
    }
  }

  if (fullAddrStr.includes('jharkhand')) {
    return [22.8046, 86.2029];
  }

  // Default to Jamshedpur
  return [22.8046, 86.2029];
};

const DeliveryRouteMapModal = ({ order, onClose }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Get Base City Center (Jamshedpur default)
    const baseCoords = getBaseCoordinates(order?.delivery_address);
    const pickupCoords = baseCoords; // Central Pharmacy Hub in Jamshedpur
    
    // Generate deterministic dropoff location offset nearby in Jamshedpur
    const hash = (order._id || '12345678').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const latOffset = (((hash % 30) - 15) / 1000);
    const lngOffset = ((((hash * 7) % 30) - 15) / 1000);
    const dropoffCoords = [baseCoords[0] + 0.015 + latOffset, baseCoords[1] + 0.02 + lngOffset];

    // Midpoint for directional arrow marker
    const midLat = (pickupCoords[0] + dropoffCoords[0]) / 2;
    const midLng = (pickupCoords[1] + dropoffCoords[1]) / 2;
    const midCoords = [midLat, midLng];

    // Calculate angle/heading for directional arrow
    const dy = dropoffCoords[0] - pickupCoords[0];
    const dx = dropoffCoords[1] - pickupCoords[1];
    const angleRad = Math.atan2(dy, dx);
    const angleDeg = (angleRad * 180) / Math.PI;

    // Create Map Instance
    const map = L.map(mapRef.current, {
      center: midCoords,
      zoom: 13,
      zoomControl: true,
    });
    mapInstanceRef.current = map;

    // Add OpenStreetMap Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Custom Pharmacy Pin Icon
    const pharmacyIcon = L.divIcon({
      className: 'custom-map-marker marker-pharmacy',
      html: `<div class="marker-pin green-pin">🏥</div><div class="marker-pulse"></div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    });

    // Custom Customer Pin Icon
    const customerIcon = L.divIcon({
      className: 'custom-map-marker marker-customer',
      html: `<div class="marker-pin red-pin">📍</div><div class="marker-pulse red-pulse"></div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    });

    // Directional Arrow Icon (Rotated along movement vector)
    const arrowIcon = L.divIcon({
      className: 'custom-map-marker marker-arrow',
      html: `<div class="arrow-container" style="transform: rotate(${90 - angleDeg}deg);">
              <div class="arrow-body">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="#0284c7" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
                </svg>
              </div>
             </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    // Add Markers
    L.marker(pickupCoords, { icon: pharmacyIcon })
      .addTo(map)
      .bindPopup('<b>MediPulse Central Pharmacy</b><br/>Pickup Point');

    L.marker(dropoffCoords, { icon: customerIcon })
      .addTo(map)
      .bindPopup(`<b>Deliver to: ${order?.user_id?.first_name || 'Customer'}</b><br/>${order?.delivery_address?.street || ''}`);

    L.marker(midCoords, { icon: arrowIcon })
      .addTo(map)
      .bindPopup('<b>In Transit</b><br/>Moving towards delivery destination');

    // Draw Route Polyline
    const routeLine = L.polyline([pickupCoords, midCoords, dropoffCoords], {
      color: '#0d9488',
      weight: 5,
      opacity: 0.85,
      dashArray: '8, 8',
    }).addTo(map);

    // Fit map bounds around route
    map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [order]);

  const user = order?.user_id || {};
  const address = order?.delivery_address || {};
  const formattedAddress = `${address.street || ''}, ${address.city || ''}, ${address.state || ''} ${address.zip_code || ''}`.replace(/^, |, $/g, '').trim();

  return (
    <div className="drm-overlay" onClick={onClose}>
      <div className="drm-modal" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="drm-header">
          <div className="drm-title-group">
            <div className="drm-icon-bg">
              <Navigation size={22} color="#ffffff" />
            </div>
            <div>
              <h3>Delivery Route & Directional Navigation</h3>
              <p>Order #{order._id?.slice(-6).toUpperCase()} &bull; {order.status?.replace(/_/g, ' ').toUpperCase()}</p>
            </div>
          </div>
          <button className="drm-close-btn" onClick={onClose} title="Close Map">
            <X size={20} />
          </button>
        </div>

        {/* Info Stats Bar */}
        <div className="drm-stats-bar">
          <div className="drm-stat-item">
            <Clock size={16} color="#0d9488" />
            <div>
              <span className="drm-stat-label">Estimated Time</span>
              <strong className="drm-stat-val">~{order.estimated_delivery_minutes || 25} Mins</strong>
            </div>
          </div>
          <div className="drm-stat-divider"></div>
          <div className="drm-stat-item">
            <Truck size={16} color="#2563eb" />
            <div>
              <span className="drm-stat-label">Route Distance</span>
              <strong className="drm-stat-val">4.8 km</strong>
            </div>
          </div>
          <div className="drm-stat-divider"></div>
          <div className="drm-stat-item">
            <ShieldCheck size={16} color="#16a34a" />
            <div>
              <span className="drm-stat-label">OTP Verification</span>
              <strong className="drm-stat-val" style={{ color: order.is_otp_verified ? '#16a34a' : '#d97706' }}>
                {order.is_otp_verified ? 'Verified ✓' : 'Pending OTP'}
              </strong>
            </div>
          </div>
        </div>

        {/* Leaflet Map Canvas */}
        <div className="drm-map-wrapper">
          <div ref={mapRef} className="drm-map-canvas" />
          
          {/* Map Directional Indicator Box Overlay */}
          <div className="drm-map-overlay-card">
            <div className="drm-overlay-row">
              <div className="drm-dot green"></div>
              <span><strong>Pickup:</strong> MediPulse Central Pharmacy, Main Hub</span>
            </div>
            <div className="drm-overlay-arrow">⬇ Directional Route Arrow</div>
            <div className="drm-overlay-row">
              <div className="drm-dot red"></div>
              <span><strong>Drop-off:</strong> {formattedAddress || 'Customer Address'}</span>
            </div>
          </div>
        </div>

        {/* Customer Info & Actions Footer */}
        <div className="drm-footer">
          <div className="drm-customer-info">
            <div className="drm-c-name">
              <User size={16} color="#475569" />
              <span>{user.first_name || 'Customer'} {user.last_name || ''}</span>
            </div>
            <div className="drm-c-address">
              <MapPin size={16} color="#0d9488" />
              <span>{formattedAddress || 'No address details specified'}</span>
            </div>
          </div>
          {user.phone && (
            <a href={`tel:${user.phone}`} className="drm-call-btn">
              <Phone size={16} /> Call Customer
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryRouteMapModal;
