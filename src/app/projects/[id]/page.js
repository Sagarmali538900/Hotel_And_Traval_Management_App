'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  Building, 
  Truck, 
  Train,
  ChevronLeft, 
  Printer, 
  Calendar, 
  User, 
  DollarSign, 
  Phone,
  Briefcase,
  Loader2,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Users,
  Search,
  Plus,
  Edit3,
  X,
  FileText,
  Plane,
  Share2
} from 'lucide-react';

export default function ProjectDetail() {
  const params = useParams();
  const { id } = params;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('guests'); // 'guests' or 'billing'
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Add/Edit Guest Modal state
  const [activeGuestModal, setActiveGuestModal] = useState(null); // 'add' or 'edit'
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [guestForm, setGuestForm] = useState({
    guestName: '',
    guestMobile: '',
    numberOfGuests: 1,
    travelMode: 'None',
    travelCode: '',
    arrivalDate: '',
    arrivalTime: '',
    departureDate: '',
    departureTime: '',
    hotelName: '',
    roomNumber: '',
    roomNotAvailableReason: '',
    checkInDate: '',
    checkOutDate: '',
    daysUsed: 0,
    roomCostPerDay: 0,
    assignedDriverName: '',
    assignedDriverMobile: '',
    isCheckedIn: false,
    notes: ''
  });
  const [guestError, setGuestError] = useState('');
  const [guestSubmitting, setGuestSubmitting] = useState(false);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${id}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || 'Failed to load project details');
      }
    } catch (err) {
      setError('Error connecting to database');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCheckIn = async (guestId, currentStatus) => {
    try {
      const res = await fetch(`/api/guests/${guestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCheckedIn: !currentStatus })
      });
      const json = await res.json();
      if (json.success) {
        fetchProjectDetails();
      } else {
        alert(json.error || 'Failed to toggle check-in status');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating check-in status');
    }
  };

  useEffect(() => {
    if (id) {
      fetchProjectDetails();
    }
  }, [id]);

  // Recalculate daysUsed (nights) when check-in or check-out date changes
  useEffect(() => {
    if (guestForm.checkInDate && guestForm.checkOutDate) {
      const start = new Date(guestForm.checkInDate);
      const end = new Date(guestForm.checkOutDate);
      if (end >= start) {
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setGuestForm(prev => ({ ...prev, daysUsed: diffDays }));
      } else {
        setGuestForm(prev => ({ ...prev, daysUsed: 0 }));
      }
    }
  }, [guestForm.checkInDate, guestForm.checkOutDate]);

  const handleToggleStatus = async () => {
    if (!data) return;
    const nextStatus = data.project.status === 'Active' ? 'Completed' : 'Active';
    try {
      setUpdatingStatus(true);
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      const json = await res.json();
      if (json.success) {
        setData({
          ...data,
          project: json.data
        });
      }
    } catch (err) {
      console.error(err);
      alert('Error updating status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleGuestInputChange = (e) => {
    const { name, value } = e.target;
    setGuestForm(prev => ({
      ...prev,
      [name]: name === 'numberOfGuests' ? parseInt(value) || 1 :
              name === 'roomCostPerDay' ? parseFloat(value) || 0 :
              name === 'daysUsed' ? parseInt(value) || 0 : value
    }));
  };

  const triggerAddGuestModal = () => {
    setGuestForm({
      guestName: '',
      guestMobile: '',
      numberOfGuests: 1,
      travelMode: 'None',
      travelCode: '',
      arrivalDate: '',
      arrivalTime: '',
      departureDate: '',
      departureTime: '',
      hotelName: '',
      roomNumber: '',
      roomNotAvailableReason: '',
      checkInDate: '',
      checkOutDate: '',
      daysUsed: 0,
      roomCostPerDay: 0,
      assignedDriverName: '',
      assignedDriverMobile: '',
      isCheckedIn: false,
      notes: ''
    });
    setGuestError('');
    setActiveGuestModal('add');
  };

  const triggerEditGuestModal = (guest) => {
    setSelectedGuest(guest);
    setGuestForm({
      guestName: guest.guestName,
      guestMobile: guest.guestMobile || '',
      numberOfGuests: guest.numberOfGuests || 1,
      travelMode: guest.travelMode || 'None',
      travelCode: guest.travelCode || '',
      arrivalDate: guest.arrivalDate ? new Date(guest.arrivalDate).toISOString().split('T')[0] : '',
      arrivalTime: guest.arrivalTime || '',
      departureDate: guest.departureDate ? new Date(guest.departureDate).toISOString().split('T')[0] : '',
      departureTime: guest.departureTime || '',
      hotelName: guest.hotelName || '',
      roomNumber: guest.roomNumber || '',
      roomNotAvailableReason: guest.roomNotAvailableReason || '',
      checkInDate: guest.checkInDate ? new Date(guest.checkInDate).toISOString().split('T')[0] : '',
      checkOutDate: guest.checkOutDate ? new Date(guest.checkOutDate).toISOString().split('T')[0] : '',
      daysUsed: guest.daysUsed || 0,
      roomCostPerDay: guest.roomCostPerDay || 0,
      assignedDriverName: guest.assignedDriverName || '',
      assignedDriverMobile: guest.assignedDriverMobile || '',
      isCheckedIn: guest.isCheckedIn || false,
      notes: guest.notes || ''
    });
    setGuestError('');
    setActiveGuestModal('edit');
  };

  const handleGuestSubmit = async (e) => {
    e.preventDefault();
    if (!guestForm.guestName.trim()) {
      setGuestError('Guest name is required');
      return;
    }

    try {
      setGuestSubmitting(true);
      setGuestError('');
      
      const payload = {
        ...guestForm,
        projectId: id
      };

      const url = activeGuestModal === 'add' ? '/api/guests' : `/api/guests/${selectedGuest._id}`;
      const method = activeGuestModal === 'add' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();

      if (json.success) {
        setActiveGuestModal(null);
        fetchProjectDetails();
      } else {
        setGuestError(json.error || 'Failed to submit guest RSVP');
      }
    } catch (err) {
      setGuestError('An error occurred during submission');
      console.error(err);
    } finally {
      setGuestSubmitting(false);
    }
  };

  const handleGuestDelete = async (guestId, name) => {
    if (!confirm(`Are you sure you want to remove guest "${name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/guests/${guestId}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        fetchProjectDetails();
      } else {
        alert(json.error || 'Failed to delete guest');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting guest');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // SMART LOGISTICS 1: Get Carpool suggestions (guests arriving within 90 minutes)
  const getCarpoolSuggestions = () => {
    if (guestForm.travelMode === 'None' || !guestForm.arrivalDate || !guestForm.arrivalTime) return [];
    if (!data || !data.guests) return [];

    const myArrivalDateStr = guestForm.arrivalDate;
    const myTimeStr = guestForm.arrivalTime;
    
    const myDateTime = new Date(`${myArrivalDateStr}T${myTimeStr}`);
    if (isNaN(myDateTime.getTime())) return [];

    return data.guests.filter(g => {
      // Don't match current guest
      if (selectedGuest && g._id === selectedGuest._id) return false;
      // Must match travel mode
      if (g.travelMode !== guestForm.travelMode) return false;
      // Must have scheduled arrival
      if (!g.arrivalDate || !g.arrivalTime) return false;
      
      const gDateStr = new Date(g.arrivalDate).toISOString().split('T')[0];
      if (gDateStr !== myArrivalDateStr) return false;

      const gDateTime = new Date(`${gDateStr}T${g.arrivalTime}`);
      if (isNaN(gDateTime.getTime())) return false;

      // Difference within 90 minutes
      const diffMins = Math.abs(gDateTime - myDateTime) / (1000 * 60);
      return diffMins <= 90;
    });
  };

  // SMART LOGISTICS 2: Get drivers active on a specific date (both from transport bookings & guests)
  const getActiveDriversForDate = (targetDateStr) => {
    if (!targetDateStr || !data) return [];
    
    const driversMap = new Map();

    // 1. Scan general transport fleet bookings
    if (data.transportBookings) {
      data.transportBookings.forEach(tb => {
        const tbDate = new Date(tb.bookingDate).toISOString().split('T')[0];
        if (tbDate === targetDateStr && tb.driverName && tb.driverName.trim()) {
          const key = tb.driverName.trim().toLowerCase();
          driversMap.set(key, {
            name: tb.driverName.trim(),
            mobile: tb.driverMobile || '',
            busySlots: ['Active on general fleet']
          });
        }
      });
    }

    // 2. Scan other guest shuttle pickups
    if (data.guests) {
      data.guests.forEach(g => {
        if (selectedGuest && g._id === selectedGuest._id) return;
        
        if (g.arrivalDate) {
          const gArrDate = new Date(g.arrivalDate).toISOString().split('T')[0];
          if (gArrDate === targetDateStr && g.assignedDriverName && g.assignedDriverName.trim()) {
            const key = g.assignedDriverName.trim().toLowerCase();
            const slotStr = g.arrivalTime ? `Pickup @ ${g.arrivalTime} (Guest: ${g.guestName})` : `Pickup (Guest: ${g.guestName})`;
            
            const existing = driversMap.get(key);
            if (existing) {
              existing.busySlots.push(slotStr);
            } else {
              driversMap.set(key, {
                name: g.assignedDriverName.trim(),
                mobile: g.assignedDriverMobile || '',
                busySlots: [slotStr]
              });
            }
          }
        }
      });
    }

    return Array.from(driversMap.values());
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 className="spinner" size={40} style={{ color: 'var(--accent-blue)', marginBottom: '1rem' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Compiling consolidated event ledger...</p>
        <style jsx global>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .spinner {
            animation: spin 1s linear infinite;
          }
        `}</style>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', maxWidth: '500px', margin: '2rem auto' }}>
        <h2 style={{ color: 'var(--accent-rose)', marginBottom: '1rem' }}>Ledger Error</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error || 'Project not found'}</p>
        <Link href="/" className="btn btn-primary">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const { 
    project, 
    hotelBookings, 
    transportBookings, 
    trainBookings, 
    guests, 
    totalHotelCost, 
    totalTransportCost, 
    totalGuestHotelCost, 
    grandTotal 
  } = data;

  const filteredGuests = guests.filter(g => 
    g.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (g.hotelName && g.hotelName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (g.assignedDriverName && g.assignedDriverName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (g.travelCode && g.travelCode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const carpoolMatches = getCarpoolSuggestions();
  const activeDrivers = getActiveDriversForDate(guestForm.arrivalDate);

  const localStats = guests.reduce((acc, g) => {
    acc.totalGuests += g.numberOfGuests || 0;
    if (g.travelMode === 'Train') {
      acc.trainGuests += g.numberOfGuests || 0;
    } else if (g.travelMode === 'Flight') {
      acc.flightGuests += g.numberOfGuests || 0;
    }
    if (g.isCheckedIn) {
      acc.checkedInGuests += g.numberOfGuests || 0;
    }
    return acc;
  }, { totalGuests: 0, trainGuests: 0, flightGuests: 0, checkedInGuests: 0 });

  return (
    <div>
      {/* Top action header bar */}
      <div className="page-header no-print">
        <div>
          <Link href="/" className="btn btn-secondary btn-icon" style={{ marginBottom: '1rem' }} id="btn-back-dashboard">
            <ChevronLeft size={16} /> Back to Dashboard
          </Link>
          <h1 className="page-title">{project.name}</h1>
          <p className="page-subtitle">Unified Event Coordinator Portal & Integrated Billing Console.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={handleToggleStatus} 
            className="btn btn-secondary"
            disabled={updatingStatus}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <CheckCircle size={16} style={{ color: project.status === 'Active' ? 'var(--text-muted)' : 'var(--accent-emerald)' }} />
            {project.status === 'Active' ? 'Mark Completed' : 'Reopen Event'}
          </button>
          <button 
            onClick={handlePrint} 
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            id="btn-print-invoice"
          >
            <Printer size={16} /> Print Ledger
          </button>
        </div>
      </div>

      {/* Tabs Selection Bar */}
      <div className="no-print" style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem' }}>
        <button 
          onClick={() => setActiveTab('guests')}
          className="btn"
          style={{ 
            borderRadius: 0,
            borderBottom: activeTab === 'guests' ? '2px solid var(--accent-blue)' : 'none',
            background: 'none',
            color: activeTab === 'guests' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: '700',
            padding: '1rem'
          }}
        >
          <Users size={16} /> Guest RSVP Hub ({guests.length})
        </button>
        <button 
          onClick={() => setActiveTab('billing')}
          className="btn"
          style={{ 
            borderRadius: 0,
            borderBottom: activeTab === 'billing' ? '2px solid var(--accent-blue)' : 'none',
            background: 'none',
            color: activeTab === 'billing' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: '700',
            padding: '1rem'
          }}
        >
          <FileText size={16} /> Consolidated Invoice
        </button>
      </div>

      {/* Active Tab View */}
      {activeTab === 'guests' ? (
        <div className="no-print">
          {/* Guest Stats Banner */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
            gap: '1.5rem',
            marginBottom: '2rem',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            padding: '1.25rem',
            borderRadius: '12px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Total Attendees</span>
              <strong style={{ fontSize: '1.4rem', color: 'var(--text-primary)' }}>{localStats.totalGuests} <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>persons</span></strong>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: '1px solid var(--border-color)', paddingLeft: '1.25rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-violet)', textTransform: 'uppercase', fontWeight: '600' }}>Train Arrivals</span>
              <strong style={{ fontSize: '1.4rem', color: 'var(--accent-violet)' }}>{localStats.trainGuests} <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>persons</span></strong>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: '1px solid var(--border-color)', paddingLeft: '1.25rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', textTransform: 'uppercase', fontWeight: '600' }}>Flight Arrivals</span>
              <strong style={{ fontSize: '1.4rem', color: 'var(--accent-blue)' }}>{localStats.flightGuests} <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>persons</span></strong>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: '1px solid var(--border-color)', paddingLeft: '1.25rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', textTransform: 'uppercase', fontWeight: '600' }}>Checked In</span>
              <strong style={{ fontSize: '1.4rem', color: 'var(--accent-emerald)' }}>{localStats.checkedInGuests} <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>persons</span></strong>
            </div>
          </div>
          {/* Guest RSVP Directory Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ position: 'relative', width: '300px' }}>
              <input
                type="text"
                id="guest-search-input"
                className="form-input"
                placeholder="Search guest, room, vehicle, flight..."
                style={{ paddingLeft: '2.5rem' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search size={14} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>

            <button onClick={triggerAddGuestModal} className="btn btn-primary" style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))' }}>
              <Plus size={16} /> Add Guest RSVP
            </button>
          </div>

          {/* Guest Spreadsheet Grid */}
          {filteredGuests.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
              <Users size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <p>{searchTerm ? 'No attendees match your search query.' : 'No attendees added to this event RSVP list yet.'}</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Attendee Details</th>
                    <th>Travel Details</th>
                    <th>Hotel Stay Allocation</th>
                    <th>Pickup Shuttle Driver</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGuests.map((g) => {
                    const needsDriver = g.travelMode !== 'None' && (!g.assignedDriverName || !g.assignedDriverName.trim());
                    const needsRoom = !g.roomNumber || !g.roomNumber.trim();
                    const isCarpool = g.notes && g.notes.toLowerCase().includes('carpooling');
                    
                    return (
                      <tr 
                        key={g._id}
                        style={{ 
                          borderLeft: needsDriver ? '4px solid var(--accent-rose)' : needsRoom ? '4px solid var(--accent-amber)' : isCarpool ? '4px solid var(--accent-violet)' : 'none',
                          backgroundColor: needsDriver ? 'rgba(244, 63, 94, 0.02)' : needsRoom ? 'rgba(245, 158, 11, 0.02)' : isCarpool ? 'rgba(139, 92, 246, 0.02)' : 'transparent'
                        }}
                      >
                        <td>
                          <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{g.guestName}</div>
                          {g.guestMobile && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>📞 {g.guestMobile}</div>}
                          <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '0.15rem 0.5rem', fontSize: '0.65rem', marginTop: '0.35rem' }}>
                            <Users size={10} /> {g.numberOfGuests} {g.numberOfGuests === 1 ? 'person' : 'persons'}
                          </span>
                        </td>
                        <td>
                          {g.travelMode === 'None' ? (
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Self Arranged / Local</span>
                          ) : (
                            <div>
                              <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {g.travelMode === 'Flight' ? <Plane size={12} style={{ color: 'var(--accent-blue)' }} /> : <Train size={12} style={{ color: 'var(--accent-violet)' }} />}
                                {g.travelMode} : {g.travelCode}
                              </div>
                              {g.arrivalDate && (
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                                  In: {new Date(g.arrivalDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} @ {g.arrivalTime || 'TBD'}
                                </div>
                              )}
                              {g.departureDate && (
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                                  Out: {new Date(g.departureDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} @ {g.departureTime || 'TBD'}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td>
                          {needsRoom ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                              <span className="badge badge-warning" style={{ fontSize: '0.65rem', display: 'inline-flex', alignItems: 'center', gap: '3px', backgroundColor: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.25)', color: 'var(--accent-amber)', width: 'fit-content' }}>
                                <AlertTriangle size={10} /> No Room: {g.roomNotAvailableReason || 'Pending Allocation'}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleToggleCheckIn(g._id, g.isCheckedIn)}
                                className="btn"
                                style={{
                                  fontSize: '0.65rem',
                                  padding: '0.2rem 0.5rem',
                                  width: 'fit-content',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  border: g.isCheckedIn ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-color)',
                                  backgroundColor: g.isCheckedIn ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                                  color: g.isCheckedIn ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                                  borderRadius: '4px',
                                  cursor: 'pointer'
                                }}
                              >
                                {g.isCheckedIn ? '✓ Checked In' : '🏨 Check In'}
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                              <div style={{ fontWeight: '600' }}>{g.hotelName}</div>
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>Room {g.roomNumber}</span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                  ({g.daysUsed} nights)
                                </span>
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Cost: ₹{g.roomCostPerDay.toLocaleString('en-IN')}/night (Total: ₹{g.hotelCost.toLocaleString('en-IN')})
                              </div>
                              <button
                                type="button"
                                onClick={() => handleToggleCheckIn(g._id, g.isCheckedIn)}
                                className="btn"
                                style={{
                                  fontSize: '0.65rem',
                                  padding: '0.2rem 0.5rem',
                                  width: 'fit-content',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  border: g.isCheckedIn ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-color)',
                                  backgroundColor: g.isCheckedIn ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                                  color: g.isCheckedIn ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                                  borderRadius: '4px',
                                  cursor: 'pointer'
                                }}
                              >
                                {g.isCheckedIn ? '✓ Checked In' : '🏨 Check In'}
                              </button>
                            </div>
                          )}
                        </td>
                        <td>
                          {needsDriver ? (
                            <span className="badge badge-warning" style={{ fontSize: '0.65rem', display: 'inline-flex', alignItems: 'center', gap: '3px', backgroundColor: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.25)', color: 'var(--accent-rose)' }}>
                              <AlertTriangle size={10} /> No Driver (Needs Pickup)
                            </span>
                          ) : g.assignedDriverName ? (
                            <div>
                              <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                                <CheckCircle size={12} style={{ color: 'var(--accent-emerald)' }} /> {g.assignedDriverName}
                                {isCarpool && (
                                  <span className="badge" style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-violet)', fontSize: '0.6rem', padding: '0.1rem 0.3rem', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                    <Share2 size={8} /> Pooled
                                  </span>
                                )}
                              </div>
                              {g.assignedDriverMobile && (
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                                  📞 {g.assignedDriverMobile}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No Shuttle needed</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                            <button
                              onClick={() => triggerEditGuestModal(g)}
                              className="btn btn-secondary btn-icon"
                              title="Edit Guest RSVP"
                            >
                              <Edit3 size={12} />
                            </button>
                            <button
                              onClick={() => handleGuestDelete(g._id, g.guestName)}
                              className="btn btn-danger btn-icon"
                              title="Remove Guest"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Invoice Details View (Printable version) */
        <div className="invoice-container">
          <div className="invoice-header">
            <div className="invoice-header-left">
              <div className="nav-brand" style={{ fontSize: '1.75rem', marginBottom: '1.5rem', pointerEvents: 'none' }}>
                Hotel & Transport Hub
              </div>
              <div className="invoice-title">CONSOLIDATED INVOICE</div>
              
              <div className="invoice-client-info">
                <span className="invoice-client-label">Billed To</span>
                <div className="invoice-client-name">{project.clientName}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  <Briefcase size={14} style={{ color: 'var(--text-muted)' }} /> Project: {project.name}
                </div>
              </div>
            </div>

            <div className="invoice-meta">
              <div>
                <span className="invoice-client-label" style={{ display: 'block', marginBottom: '0.25rem' }}>Status</span>
                <span className={`badge ${project.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                  {project.status}
                </span>
              </div>
              <div className="invoice-meta-item" style={{ marginTop: '1rem' }}>
                <span className="invoice-client-label">Invoice Date:</span>{' '}
                <span className="invoice-meta-val">
                  {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="invoice-meta-item">
                <span className="invoice-client-label">Project Created:</span>{' '}
                <span className="invoice-meta-val">
                  {new Date(project.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          <div className="invoice-body">
            {/* Section 1: Attendee Lodging (Guest-centric) */}
            <div className="invoice-section">
              <h3 className="invoice-section-title">
                <Building size={18} style={{ color: 'var(--accent-blue)' }} /> 
                1. Attendee Room Accommodations
              </h3>
              
              {guests.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1rem 0' }}>
                  No guest stays or room details registered for this event.
                </p>
              ) : (
                <div className="table-container" style={{ border: 'none' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ paddingLeft: 0 }}>Guest Name</th>
                        <th>Hotel Stay details</th>
                        <th>Room Number</th>
                        <th>Check-in / Check-out</th>
                        <th>Duration (Nights)</th>
                        <th>Nightly Price</th>
                        <th style={{ textAlign: 'right', paddingRight: 0 }}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {guests.map((g) => (
                        <tr key={g._id}>
                          <td style={{ paddingLeft: 0, fontWeight: '600' }}>{g.guestName}</td>
                          <td>{g.hotelName || <span style={{ color: 'var(--text-muted)' }}>N/A</span>}</td>
                          <td>
                            {g.roomNumber ? (
                              <span className="badge badge-info">{g.roomNumber}</span>
                            ) : (
                              <span style={{ color: 'var(--accent-rose)', fontSize: '0.8rem' }}>Unallocated: {g.roomNotAvailableReason}</span>
                            )}
                          </td>
                          <td>
                            {g.checkInDate ? (
                              <div style={{ fontSize: '0.85rem' }}>
                                {new Date(g.checkInDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} -{' '}
                                {new Date(g.checkOutDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>N/A</span>
                            )}
                          </td>
                          <td>{g.daysUsed} nights</td>
                          <td>₹{g.roomCostPerDay.toLocaleString('en-IN')}</td>
                          <td style={{ textAlign: 'right', paddingRight: 0, fontWeight: '600' }}>
                            ₹{g.hotelCost.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan="6" style={{ borderBottom: 'none', paddingLeft: 0, fontWeight: '700', fontSize: '0.95rem' }}>
                          Attendee Lodging Total Expenditure
                        </td>
                        <td style={{ borderBottom: 'none', textAlign: 'right', paddingRight: 0, fontWeight: '800', fontSize: '1.1rem', color: 'var(--accent-blue)' }}>
                          ₹{totalGuestHotelCost.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Section 2: General Hotel Block Bookings */}
            {hotelBookings.length > 0 && (
              <div className="invoice-section" style={{ marginTop: '3rem' }}>
                <h3 className="invoice-section-title">
                  <Building size={18} style={{ color: 'var(--accent-cyan)' }} /> 
                  2. General Hotel Block Bookings (Bulk bookings / Crew Lodging)
                </h3>
                <div className="table-container" style={{ border: 'none' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ paddingLeft: 0 }}>Hotel Details</th>
                        <th>Room assigned</th>
                        <th>Check-in Date</th>
                        <th>Days Used</th>
                        <th>Cost Per Day</th>
                        <th style={{ textAlign: 'right', paddingRight: 0 }}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hotelBookings.map((b) => (
                        <tr key={b._id}>
                          <td style={{ paddingLeft: 0, fontWeight: '600' }}>
                            <div>{b.hotelName}</div>
                            {b.notes && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.notes}</div>}
                          </td>
                          <td><span className="badge badge-info">{b.roomNumber}</span></td>
                          <td>{new Date(b.bookingDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</td>
                          <td>{b.daysUsed} days</td>
                          <td>₹{b.roomCostPerDay.toLocaleString('en-IN')}</td>
                          <td style={{ textAlign: 'right', paddingRight: 0, fontWeight: '600' }}>
                            ₹{b.totalCost.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan="5" style={{ borderBottom: 'none', paddingLeft: 0, fontWeight: '700', fontSize: '0.95rem' }}>
                          Hotel Bulk Blocks Total
                        </td>
                        <td style={{ borderBottom: 'none', textAlign: 'right', paddingRight: 0, fontWeight: '800', fontSize: '1.1rem', color: 'var(--accent-cyan)' }}>
                          ₹{totalHotelCost.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Section 3: Transport & Fleets */}
            <div className="invoice-section" style={{ marginTop: '3rem' }}>
              <h3 className="invoice-section-title">
                <Truck size={18} style={{ color: 'var(--accent-emerald)' }} /> 
                {hotelBookings.length > 0 ? '3.' : '2.'} General Transport & Fleet Rentals
              </h3>

              {transportBookings.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1rem 0' }}>
                  No general utility vehicles or fleet rentals registered for this project.
                </p>
              ) : (
                <div className="table-container" style={{ border: 'none' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ paddingLeft: 0 }}>Vehicle & Driver Details</th>
                        <th>Schedule Date</th>
                        <th>Rate & Duration</th>
                        <th>Fuel Policy & Cost</th>
                        <th>Tolls/Other</th>
                        <th style={{ textAlign: 'right', paddingRight: 0 }}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transportBookings.map((b) => (
                        <tr key={b._id}>
                          <td style={{ paddingLeft: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: '600' }}>{b.vehicleName}</span>
                              <span className={`badge ${b.ownershipType === 'Owned' ? 'badge-success' : 'badge-info'}`} style={{ textTransform: 'capitalize', fontSize: '0.65rem' }}>
                                {b.ownershipType}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                              Plate: {b.vehicleNumber} {b.driverName && `| Driver: ${b.driverName} (${b.driverMobile})`}
                            </div>
                          </td>
                          <td>{new Date(b.bookingDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</td>
                          <td>
                            <div>₹{b.costRate.toLocaleString('en-IN')} / {b.costModel === 'daily' ? 'day' : 'hr'}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Duration: {b.duration} {b.costModel === 'daily' ? 'days' : 'hrs'}</div>
                          </td>
                          <td>
                            {b.fuelPolicy === 'included' ? (
                              <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Fuel Included</span>
                            ) : (
                              <div>
                                <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>Fuel Excluded</span>
                                <div style={{ fontSize: '0.85rem', color: 'var(--accent-rose)', fontWeight: '600', marginTop: '0.15rem' }}>
                                  Diesel: ₹{b.fuelCost.toLocaleString('en-IN')}
                                </div>
                              </div>
                            )}
                          </td>
                          <td>₹{b.otherExpenses.toLocaleString('en-IN')}</td>
                          <td style={{ textAlign: 'right', paddingRight: 0, fontWeight: '600' }}>
                            ₹{b.totalCost.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan="5" style={{ borderBottom: 'none', paddingLeft: 0, fontWeight: '700', fontSize: '0.95rem' }}>
                          Transport Fleet Total
                        </td>
                        <td style={{ borderBottom: 'none', textAlign: 'right', paddingRight: 0, fontWeight: '800', fontSize: '1.1rem', color: 'var(--accent-emerald)' }}>
                          ₹{totalTransportCost.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Section 4: Train Coordinator logs in invoice print */}
            {trainBookings.length > 0 && (
              <div className="invoice-section" style={{ marginTop: '3rem' }}>
                <h3 className="invoice-section-title">
                  <Train size={18} style={{ color: 'var(--accent-violet)' }} /> 
                  {hotelBookings.length > 0 ? '4.' : '3.'} Train Arrivals pickup Coordination Logs
                </h3>
                <div className="table-container" style={{ border: 'none' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ paddingLeft: 0 }}>Guest Group & Contact</th>
                        <th>Train Details</th>
                        <th>Arrival (Pune-In)</th>
                        <th>Departure (Pune-Out)</th>
                        <th style={{ textAlign: 'right', paddingRight: 0 }}>Assigned Driver (Pickup)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trainBookings.map((b) => {
                        const isUnassigned = !b.assignedDriverName || !b.assignedDriverName.trim();
                        return (
                          <tr key={b._id}>
                            <td style={{ paddingLeft: 0 }}>
                              <div style={{ fontWeight: '600' }}>{b.guestName}</div>
                              {b.guestMobile && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>📞 {g.guestMobile}</div>}
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Persons: {b.numberOfGuests}</div>
                            </td>
                            <td>
                              <div style={{ fontWeight: '600' }}>{b.trainName}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Code: {b.trainCode}</div>
                            </td>
                            <td>{b.arrivalTime} ({new Date(b.arrivalDate).toLocaleDateString('en-GB')})</td>
                            <td>{b.departureTime} ({new Date(b.departureDate).toLocaleDateString('en-GB')})</td>
                            <td style={{ textAlign: 'right', paddingRight: 0 }}>
                              {isUnassigned ? (
                                <span style={{ color: 'var(--accent-rose)', fontWeight: '600' }}>Pending</span>
                              ) : (
                                <div>
                                  <div style={{ fontWeight: '600' }}>{b.assignedDriverName}</div>
                                  {b.assignedDriverMobile && <div style={{ fontSize: '0.8rem' }}>{b.assignedDriverMobile}</div>}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Financial Summary Card */}
            <div className="invoice-summary">
              <div className="invoice-summary-grid">
                <div className="summary-row">
                  <span style={{ color: 'var(--text-secondary)' }}>Attendee Room Lodging:</span>
                  <span>₹{totalGuestHotelCost.toLocaleString('en-IN')}</span>
                </div>
                {hotelBookings.length > 0 && (
                  <div className="summary-row">
                    <span style={{ color: 'var(--text-secondary)' }}>Hotel Bulk Blocks:</span>
                    <span>₹{totalHotelCost.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="summary-row">
                  <span style={{ color: 'var(--text-secondary)' }}>Transport & Fleets:</span>
                  <span>₹{totalTransportCost.toLocaleString('en-IN')}</span>
                </div>
                <div className="summary-row summary-row-total">
                  <span>Grand Total:</span>
                  <span>₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Guest RSVP Modal (Add / Edit) */}
      {activeGuestModal && (
        <div className="modal-overlay no-print">
          <div className="card modal-content" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: '700', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={20} style={{ color: 'var(--accent-blue)' }} /> 
                {activeGuestModal === 'add' ? 'Add Guest RSVP Log' : 'Edit Guest RSVP Log'}
              </h3>
              <button onClick={() => setActiveGuestModal(null)} className="btn btn-secondary btn-icon" style={{ padding: '0.25rem' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleGuestSubmit}>
              {/* Category 1: Guest Profile */}
              <h4 style={{ fontSize: '0.85rem', color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Guest profile</h4>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Primary Guest Name</label>
                  <input
                    type="text"
                    name="guestName"
                    className="form-input"
                    placeholder="e.g. Sanjay Shah"
                    value={guestForm.guestName}
                    onChange={handleGuestInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Total Persons</label>
                  <input
                    type="number"
                    name="numberOfGuests"
                    className="form-input"
                    min="1"
                    value={guestForm.numberOfGuests}
                    onChange={handleGuestInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Guest Contact Mobile (Optional)</label>
                <input
                  type="tel"
                  name="guestMobile"
                  className="form-input"
                  placeholder="e.g. 9822******"
                  value={guestForm.guestMobile}
                  onChange={handleGuestInputChange}
                />
              </div>

              {/* Category 2: Travel Details */}
              <h4 style={{ fontSize: '0.85rem', color: 'var(--accent-violet)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '1.5rem 0 0.75rem 0' }}>Travel & Arrivals</h4>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Travel Mode</label>
                  <select
                    name="travelMode"
                    className="form-select"
                    value={guestForm.travelMode}
                    onChange={handleGuestInputChange}
                  >
                    <option value="None">None (Self / Local)</option>
                    <option value="Train">Train Arrival</option>
                    <option value="Flight">Flight Arrival</option>
                  </select>
                </div>
                {guestForm.travelMode !== 'None' && (
                  <div className="form-group">
                    <label className="form-label">{guestForm.travelMode} Code / Number</label>
                    <input
                      type="text"
                      name="travelCode"
                      className="form-input"
                      placeholder="e.g. AI-101 / 12124"
                      value={guestForm.travelCode}
                      onChange={handleGuestInputChange}
                      required
                    />
                  </div>
                )}
              </div>

              {guestForm.travelMode !== 'None' && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Arrival Date</label>
                      <input
                        type="date"
                        name="arrivalDate"
                        className="form-input"
                        value={guestForm.arrivalDate}
                        onChange={handleGuestInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Arrival Time</label>
                      <input
                        type="time"
                        name="arrivalTime"
                        className="form-input"
                        value={guestForm.arrivalTime}
                        onChange={handleGuestInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Departure Date</label>
                      <input
                        type="date"
                        name="departureDate"
                        className="form-input"
                        value={guestForm.departureDate}
                        onChange={handleGuestInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Departure Time</label>
                      <input
                        type="time"
                        name="departureTime"
                        className="form-input"
                        value={guestForm.departureTime}
                        onChange={handleGuestInputChange}
                        required
                      />
                    </div>
                  </div>

                  {/* SMART CARPOOL RECOMMENDATIONS */}
                  {carpoolMatches.length > 0 && (
                    <div style={{ backgroundColor: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.2)', padding: '1rem', borderRadius: '8px', margin: '1rem 0' }}>
                      <div style={{ color: 'var(--accent-violet)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                        <Share2 size={14} /> 💡 SMART CARPOOL RECOMMENDATIONS ({carpoolMatches.length})
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                        The following guests are arriving at the same place within 90 minutes. You can pool them in the same car!
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {carpoolMatches.map(match => (
                          <div key={match._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '6px', fontSize: '0.8rem' }}>
                            <div>
                              <strong>{match.guestName}</strong> ({match.numberOfGuests} guests)
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                Arriving: {match.arrivalTime} (Code: {match.travelCode})
                                {match.assignedDriverName && ` | Driver: ${match.assignedDriverName}`}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', borderColor: 'var(--accent-violet)', color: 'var(--accent-violet)' }}
                              onClick={() => {
                                setGuestForm(prev => ({
                                  ...prev,
                                  travelCode: match.travelCode,
                                  arrivalTime: match.arrivalTime,
                                  arrivalDate: new Date(match.arrivalDate).toISOString().split('T')[0],
                                  assignedDriverName: match.assignedDriverName || '',
                                  assignedDriverMobile: match.assignedDriverMobile || '',
                                  notes: (prev.notes ? prev.notes + '; ' : '') + `Carpooling with ${match.guestName}`
                                }));
                              }}
                            >
                              Link & Pool Ride
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Category 3: Hotel Lodging stay details */}
              <h4 style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '1.5rem 0 0.75rem 0' }}>Lodging Stays</h4>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Hotel Name (Optional)</label>
                  <input
                    type="text"
                    name="hotelName"
                    className="form-input"
                    placeholder="e.g. Radisson Blu"
                    value={guestForm.hotelName}
                    onChange={handleGuestInputChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Room Number (Optional)</label>
                  <input
                    type="text"
                    name="roomNumber"
                    className="form-input"
                    placeholder="e.g. 302"
                    value={guestForm.roomNumber}
                    onChange={handleGuestInputChange}
                  />
                </div>
              </div>

              {/* Show Room Unavailability Reason if hotelName is given but roomNumber is blank */}
              {guestForm.hotelName && !guestForm.roomNumber.trim() && (
                <div className="form-group" style={{ backgroundColor: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                  <label className="form-label" style={{ color: 'var(--accent-amber)' }}>Reason for Room Pending / Unavailability</label>
                  <select
                    name="roomNotAvailableReason"
                    className="form-select"
                    value={guestForm.roomNotAvailableReason}
                    onChange={handleGuestInputChange}
                  >
                    <option value="">-- Choose Reason --</option>
                    <option value="Hotel Fully Booked">Hotel Fully Booked (Sold Out)</option>
                    <option value="Pending Confirmation">Pending Booking Confirmation</option>
                    <option value="Guest Demanded Suit Upgrade">Guest Demanded Suite Upgrade</option>
                    <option value="Awaiting Check-in Clearance">Awaiting Check-in Clearance</option>
                    <option value="Other / See Notes">Other (Specify in Notes)</option>
                  </select>
                  {!guestForm.roomNotAvailableReason && (
                    <input
                      type="text"
                      name="roomNotAvailableReason"
                      className="form-input"
                      placeholder="Or type a custom reason..."
                      style={{ marginTop: '0.5rem' }}
                      value={guestForm.roomNotAvailableReason}
                      onChange={handleGuestInputChange}
                    />
                  )}
                </div>
              )}

              {guestForm.hotelName && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Check-in Date</label>
                      <input
                        type="date"
                        name="checkInDate"
                        className="form-input"
                        value={guestForm.checkInDate}
                        onChange={handleGuestInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Check-out Date</label>
                      <input
                        type="date"
                        name="checkOutDate"
                        className="form-input"
                        value={guestForm.checkOutDate}
                        onChange={handleGuestInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Stay Duration (Nights - Auto)</label>
                      <input
                        type="number"
                        name="daysUsed"
                        className="form-input"
                        value={guestForm.daysUsed}
                        readOnly
                        style={{ backgroundColor: 'rgba(0,0,0,0.1)', cursor: 'not-allowed' }}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Nightly Rate (₹)</label>
                      <input
                        type="number"
                        name="roomCostPerDay"
                        className="form-input"
                        min="0"
                        placeholder="0"
                        value={guestForm.roomCostPerDay || ''}
                        onChange={handleGuestInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.9rem', padding: '0.5rem 0', borderTop: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                    <span>Calculated Room Stay Cost:</span>
                    <strong style={{ color: 'var(--accent-cyan)' }}>₹{(guestForm.daysUsed * guestForm.roomCostPerDay).toLocaleString('en-IN')}</strong>
                  </div>
                </>
              )}

              {/* Category 4: Shuttle Driver Details */}
              <h4 style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '1.5rem 0 0.75rem 0' }}>Pickup Shuttle driver</h4>
              
              {/* ACTIVE DRIVERS LOOKUP BADGES */}
              {guestForm.arrivalDate && activeDrivers.length > 0 && (
                <div style={{ marginBottom: '1rem', backgroundColor: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.15)', padding: '0.75rem', borderRadius: '8px' }}>
                  <label className="form-label" style={{ color: 'var(--accent-emerald)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '0.4rem' }}>
                    <CheckCircle size={12} /> Active Drivers on {new Date(guestForm.arrivalDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}:
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {activeDrivers.map((d, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="badge badge-success"
                        style={{ 
                          fontSize: '0.65rem', 
                          padding: '0.25rem 0.5rem', 
                          cursor: 'pointer',
                          backgroundColor: 'rgba(16, 185, 129, 0.12)',
                          color: 'var(--accent-emerald)',
                          border: '1px solid rgba(16, 185, 129, 0.3)'
                        }}
                        title={d.busySlots.join('\n')}
                        onClick={() => {
                          setGuestForm(prev => ({
                            ...prev,
                            assignedDriverName: d.name,
                            assignedDriverMobile: d.mobile
                          }));
                        }}
                      >
                        {d.name} {d.busySlots.length > 1 ? `(${d.busySlots.length} tasks)` : ''}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Driver Name (Optional)</label>
                  <input
                    type="text"
                    name="assignedDriverName"
                    className="form-input"
                    placeholder="e.g. Sunil Patil"
                    value={guestForm.assignedDriverName}
                    onChange={handleGuestInputChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Driver Mobile (Optional)</label>
                  <input
                    type="tel"
                    name="assignedDriverMobile"
                    className="form-input"
                    placeholder="e.g. 9888******"
                    value={guestForm.assignedDriverMobile}
                    onChange={handleGuestInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Special Coordinator Instructions</label>
                <textarea
                  name="notes"
                  className="form-input"
                  placeholder="e.g. Needs immediate airport pickup, VIP client..."
                  rows="2"
                  value={guestForm.notes}
                  onChange={handleGuestInputChange}
                />
              </div>

              <div className="form-group" style={{ marginTop: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: 0 }}>
                  <input
                    type="checkbox"
                    name="isCheckedIn"
                    checked={guestForm.isCheckedIn}
                    onChange={(e) => setGuestForm(prev => ({ ...prev, isCheckedIn: e.target.checked }))}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Confirm Attendee Check-In Status (Yes / Checked In)</span>
                </label>
              </div>

              {guestError && <p style={{ color: 'var(--accent-rose)', fontSize: '0.85rem', marginBottom: '1rem' }}>{guestError}</p>}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <button type="button" onClick={() => setActiveGuestModal(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={guestSubmitting}>
                  {guestSubmitting ? <Loader2 size={16} className="spinner" /> : 'Save RSVP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinner {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
