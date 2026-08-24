import React, { useEffect, useRef, useState } from 'react';
import { X, MapPin, Navigation, ExternalLink, Loader2, Stethoscope, Phone, Mail } from 'lucide-react';

const DoctorLocationMapModal = ({ isOpen, onClose, doctor, appointment }) => {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markerRef = useRef(null);

  const [geocoding, setGeocoding] = useState(false);

  const docFirstName = doctor?.first_name || appointment?.doctor_id?.first_name || '';
  const docLastName = doctor?.last_name || appointment?.doctor_id?.last_name || '';
  const docName = docFirstName ? `Dr. ${docFirstName} ${docLastName}`.trim() : 'Attending Doctor';
  const docSpec = doctor?.specialization || appointment?.doctor_id?.specialization || 'Specialist Doctor';
  const visitAddress = doctor?.visit_address || appointment?.doctor_id?.visit_address || 'Medipulse Multispecialty OPD Block, Sector 4';
  const docPhone = doctor?.phone || appointment?.doctor_id?.phone || '';
  const docEmail = doctor?.email || appointment?.doctor_id?.email || '';

  const setupLeaflet = (lat, lng) => {
    if (!mapRef.current || !window.L) return;
    const L = window.L;

    if (leafletMap.current) {
      leafletMap.current.remove();
      leafletMap.current = null;
    }

    const map = L.map(mapRef.current).setView([lat, lng], 15);
    leafletMap.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const customIcon = L.divIcon({
      className: 'custom-doctor-pin',
      html: `<div style="background:linear-gradient(135deg,#0d9488,#0f766e);width:40px;height:40px;border-radius:50%;border:3px solid white;box-shadow:0 6px 16px rgba(13,148,136,0.6);display:flex;align-items:center;justify-content:center;color:white;font-size:20px;">🏥</div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 40]
    });

    const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
    markerRef.current = marker;

    marker.bindPopup(`
      <div style="font-family:sans-serif;padding:4px;">
        <strong style="color:#0f172a;font-size:13px;display:block;">${docName}</strong>
        <span style="color:#0d9488;font-size:11px;font-weight:700;">${docSpec}</span>
        <p style="margin:4px 0 0;font-size:11px;color:#475569;">${visitAddress}</p>
      </div>
    `).openPopup();
  };

  const geocodeAddress = async (addr) => {
    if (!addr) return;
    setGeocoding(true);
    try {
      const query = encodeURIComponent(`${addr}, India`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`, {
        headers: { 'Accept-Language': 'en' }
      });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setupLeaflet(lat, lng);
      } else {
        setupLeaflet(28.6139, 77.2090); // New Delhi default fallback
      }
    } catch {
      setupLeaflet(28.6139, 77.2090);
    } finally {
      setGeocoding(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (!window.L) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => geocodeAddress(visitAddress);
      document.body.appendChild(script);
    } else {
      setTimeout(() => geocodeAddress(visitAddress), 150);
    }

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, [isOpen, visitAddress]);

  if (!isOpen) return null;

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${docName} ${visitAddress}`)}`;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
      zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
    }}>
      <div style={{
        background: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '640px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden',
        border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column'
      }}>
        {/* Modal Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
          color: '#ffffff', padding: '18px 24px', position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '12px' }}>
              <MapPin size={22} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>Doctor Clinic Visit Location</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#ccfbf1', opacity: 0.9 }}>
                Offline consultation address details
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)', border: 'none', color: '#ffffff',
              borderRadius: '50%', width: '32px', height: '32px', display: 'flex',
              alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Doctor Summary Header Card */}
        <div style={{ padding: '16px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Stethoscope size={18} color="#0d9488" /> {docName}
              </h4>
              <span style={{ fontSize: '13px', color: '#0d9488', fontWeight: 700, marginLeft: 24 }}>
                {docSpec}
              </span>
            </div>

            <span style={{
              background: '#f0fdfa', border: '1px solid #99f6e4', color: '#0d9488',
              padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 800
            }}>
              📍 Offline Meet
            </span>
          </div>

          {/* Real-time Address fetched from Doctor Profile */}
          <div style={{ marginTop: '12px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '12px 14px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
              Doctor Clinic Address:
            </span>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}>
              {visitAddress}
            </p>
            {(docPhone || docEmail) && (
              <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '12px', color: '#475569', flexWrap: 'wrap' }}>
                {docPhone && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={12} color="#0d9488" /> {docPhone}</span>}
                {docEmail && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={12} color="#0d9488" /> {docEmail}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Map Canvas */}
        <div style={{ position: 'relative', height: '280px', width: '100%', background: '#e2e8f0' }}>
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
          {geocoding && (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(2px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 500, fontSize: '13px', color: '#0f766e', fontWeight: 700, gap: '8px'
            }}>
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Locating clinic address on map...
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '14px 24px', background: '#ffffff', borderTop: '1px solid #e2e8f0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px'
        }}>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              color: '#0d9488', fontWeight: 700, fontSize: '13px', textDecoration: 'none'
            }}
          >
            <ExternalLink size={15} /> Open in Google Maps
          </a>

          <button
            onClick={onClose}
            style={{
              padding: '8px 20px', borderRadius: '10px', border: 'none',
              background: '#0d9488', color: '#ffffff', fontWeight: 700,
              fontSize: '13px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(13,148,136,0.3)'
            }}
          >
            Close Map
          </button>
        </div>
      </div>
    </div>
  );
};

export default DoctorLocationMapModal;
