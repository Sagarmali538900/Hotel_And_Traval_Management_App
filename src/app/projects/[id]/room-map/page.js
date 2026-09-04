'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  Building, 
  ChevronLeft, 
  Loader2, 
  CheckCircle, 
  AlertTriangle, 
  Users, 
  Plus, 
  X, 
  Bed, 
  UserPlus, 
  UserMinus,
  RefreshCw,
  Calendar,
  Clock,
  Pencil
} from 'lucide-react';

const parseDateParts = (dateInput) => {
  if (!dateInput) return null;
  let str = typeof dateInput === 'string' ? dateInput.split('T')[0] : '';
  if (!str && dateInput instanceof Date) {
    try { str = dateInput.toISOString().split('T')[0]; } catch(e){}
  }
  const parts = str.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m, d);
    }
  }
  const dt = new Date(dateInput);
  return isNaN(dt.getTime()) ? null : dt;
};

const formatDateSafe = (d) => {
  const dt = parseDateParts(d);
  if (!dt) return null;
  const day = String(dt.getDate()).padStart(2, '0');
  const month = String(dt.getMonth() + 1).padStart(2, '0');
  const year = dt.getFullYear();
  return `${day}/${month}/${year}`;
};

export default function RoomMapPortal() {
  const params = useParams();
  const { id } = params;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null); // { hotelName, roomNumber, occupants }
  const [assigningGuestId, setAssigningGuestId] = useState('');
  const [submittingAssign, setSubmittingAssign] = useState(false);

  // Add Room Modal States
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [newRoomForm, setNewRoomForm] = useState({
    hotelName: '',
    roomNumber: '',
    roomCostPerDay: 0,
    daysUsed: 1,
    bookingDate: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [addingRoom, setAddingRoom] = useState(false);
  const [addRoomError, setAddRoomError] = useState('');

  // Edit Room Modal States
  const [showEditRoomModal, setShowEditRoomModal] = useState(false);
  const [editRoomForm, setEditRoomForm] = useState({
    oldHotelName: '',
    oldRoomNumber: '',
    newHotelName: '',
    newRoomNumber: '',
    roomCostPerDay: 0,
    daysUsed: 1,
    bookingDate: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [editingRoom, setEditingRoom] = useState(false);
  const [editRoomError, setEditRoomError] = useState('');

  const handleEditRoomFormChange = (e) => {
    const { name, value } = e.target;
    setEditRoomForm(prev => ({
      ...prev,
      [name]: name === 'daysUsed' ? parseInt(value) || 1 :
              name === 'roomCostPerDay' ? parseFloat(value) || 0 : value
    }));
  };

  const handleOpenEditRoomModal = (room) => {
    setEditRoomForm({
      oldHotelName: room.hotelName || '',
      oldRoomNumber: room.roomNumber || '',
      newHotelName: room.hotelName || '',
      newRoomNumber: room.roomNumber || '',
      roomCostPerDay: room.roomCostPerDay || 0,
      daysUsed: room.daysUsed || 1,
      bookingDate: room.inDate ? new Date(room.inDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      notes: room.notes || ''
    });
    setEditRoomError('');
    setShowEditRoomModal(true);
  };

  const handleUpdateRoom = async (e) => {
    e.preventDefault();
    if (!editRoomForm.newHotelName.trim() || !editRoomForm.newRoomNumber.trim()) {
      setEditRoomError('Hotel name and Room number are required');
      return;
    }

    setEditingRoom(true);
    setEditRoomError('');

    try {
      const res = await fetch('/api/hotels', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: id,
          ...editRoomForm
        })
      });

      const json = await res.json();
      if (json.success) {
        setShowEditRoomModal(false);
        setSelectedRoom(null);
        await fetchProjectDetails();
      } else {
        setEditRoomError(json.error || 'Failed to update room');
      }
    } catch (err) {
      console.error(err);
      setEditRoomError('Failed to update room');
    } finally {
      setEditingRoom(false);
    }
  };

  const handleRoomFormChange = (e) => {
    const { name, value } = e.target;
    setNewRoomForm(prev => ({
      ...prev,
      [name]: name === 'daysUsed' ? parseInt(value) || 1 :
              name === 'roomCostPerDay' ? parseFloat(value) || 0 : value
    }));
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomForm.hotelName.trim() || !newRoomForm.roomNumber.trim()) {
      setAddRoomError('Hotel name and Room number are required');
      return;
    }

    setAddingRoom(true);
    setAddRoomError('');

    try {
      const res = await fetch('/api/hotels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newRoomForm,
          projectId: id
        })
      });

      const json = await res.json();
      if (json.success) {
        setShowAddRoomModal(false);
        // Reset form
        setNewRoomForm({
          hotelName: '',
          roomNumber: '',
          roomCostPerDay: 0,
          daysUsed: 1,
          bookingDate: new Date().toISOString().split('T')[0],
          notes: ''
        });
        await fetchProjectDetails();
      } else {
        setAddRoomError(json.error || 'Failed to create room allocation');
      }
    } catch (err) {
      console.error(err);
      setAddRoomError('Error connecting to API server');
    } finally {
      setAddingRoom(false);
    }
  };

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${id}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        
        // Refresh selected room detail if it's currently open
        if (selectedRoom) {
          const freshGuests = json.data.guests || [];
          const occupants = freshGuests.filter(g => 
            (g.hotelName || '').trim().toLowerCase() === selectedRoom.hotelName.toLowerCase() &&
            (g.roomNumber || '').trim().toLowerCase() === selectedRoom.roomNumber.toLowerCase()
          );
          setSelectedRoom({
            hotelName: selectedRoom.hotelName,
            roomNumber: selectedRoom.roomNumber,
            occupants
          });
        }
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

  useEffect(() => {
    if (id) {
      fetchProjectDetails();
    }
  }, [id]);

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: '1rem' }}>
        <Loader2 className="spinner" size={40} style={{ color: 'var(--accent-blue)' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading Room Map layout...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ maxWidth: '500px', margin: '4rem auto', textAlign: 'center', padding: '2rem' }}>
        <AlertTriangle size={48} style={{ color: 'var(--accent-rose)', marginBottom: '1rem' }} />
        <h3 style={{ marginBottom: '0.5rem' }}>Error Loading Data</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error}</p>
        <Link href="/" className="btn btn-primary">Back to Dashboard</Link>
      </div>
    );
  }

  const { project, hotelBookings = [], guests = [] } = data;

  // Compile list of unique hotels & room numbers
  const roomsByHotel = {};

  // 1. Gather rooms from bulk hotel blocks
  (hotelBookings || []).forEach(hb => {
    if (!hb) return;
    const hotel = (hb.hotelName || '').trim();
    const room = (hb.roomNumber || '').trim();
    if (room && hotel.toLowerCase() !== 'unallocated' && room.toLowerCase() !== 'unallocated' && hotel.toLowerCase() !== 'unassigned') {
      if (!roomsByHotel[hotel]) {
        roomsByHotel[hotel] = {};
      }
      roomsByHotel[hotel][room] = {
        roomNumber: room,
        isBulkBlock: true,
        daysUsed: hb.daysUsed,
        roomCostPerDay: hb.roomCostPerDay,
        bookingDate: hb.bookingDate,
        inDate: hb.bookingDate,
        notes: hb.notes
      };
    }
  });

  // 2. Gather rooms from active guest allocations
  (guests || []).forEach(g => {
    if (!g) return;
    const hotel = (g.hotelName || '').trim();
    const room = (g.roomNumber || '').trim();
    if (hotel && room && hotel.toLowerCase() !== 'unallocated' && room.toLowerCase() !== 'unallocated' && hotel.toLowerCase() !== 'unassigned') {
      if (!roomsByHotel[hotel]) {
        roomsByHotel[hotel] = {};
      }
      if (!roomsByHotel[hotel][room]) {
        roomsByHotel[hotel][room] = {
          roomNumber: room,
          isBulkBlock: false,
          daysUsed: g.daysUsed || 1,
          roomCostPerDay: g.roomCostPerDay || 0,
          bookingDate: g.checkInDate || g.arrivalDate
        };
      } else if (!roomsByHotel[hotel][room].bookingDate) {
        roomsByHotel[hotel][room].bookingDate = g.checkInDate || g.arrivalDate;
      }
    }
  });

  // 3. Attach occupants to each room and calculate statuses
  const hotelList = Object.keys(roomsByHotel).map(hotelName => {
    const roomsMap = roomsByHotel[hotelName];
    const rooms = Object.keys(roomsMap).map(roomNum => {
      const roomInfo = roomsMap[roomNum];
      
      // Find occupants in this room
      const occupants = (guests || []).filter(g => 
        (g.hotelName || '').trim().toLowerCase() === hotelName.toLowerCase() &&
        (g.roomNumber || '').trim().toLowerCase() === roomNum.toLowerCase()
      );

      // Determine visual status:
      // - Empty (0 occupants)
      // - Single Occupancy (1 occupant)
      // - Double Occupancy (2+ occupants)
      let status = 'empty';
      if (occupants.length === 1) status = 'single';
      else if (occupants.length >= 2) status = 'double';

      return {
        ...roomInfo,
        occupants,
        status
      };
    });

    // Sort rooms numerically/alphabetically
    rooms.sort((a, b) => {
      const numA = parseInt(a.roomNumber, 10);
      const numB = parseInt(b.roomNumber, 10);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a.roomNumber.localeCompare(b.roomNumber);
    });

    return {
      hotelName,
      rooms
    };
  });

  // Compile list of unallocated guests (who need a room)
  const unallocatedGuests = (guests || []).filter(g => {
    if (!g) return false;
    const rm = (g.roomNumber || '').trim().toLowerCase();
    const htl = (g.hotelName || '').trim().toLowerCase();
    return !rm || rm === 'unallocated' || rm === 'unassigned' || rm === 'none' || htl === 'unallocated' || htl === 'unassigned';
  });

  // Assign a guest to a specific room
  const handleAssignGuest = async (e) => {
    e.preventDefault();
    if (!assigningGuestId || !selectedRoom) return;

    setSubmittingAssign(true);
    try {
      // Find target guest details
      const targetGuest = guests.find(g => g._id === assigningGuestId);
      if (!targetGuest) return;

      const res = await fetch(`/api/guests/${assigningGuestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelName: selectedRoom.hotelName,
          roomNumber: selectedRoom.roomNumber,
          // Prefill check-in dates with project default if empty
          checkInDate: targetGuest.checkInDate || targetGuest.arrivalDate || '',
          checkOutDate: targetGuest.checkOutDate || targetGuest.departureDate || '',
        })
      });

      const json = await res.json();
      if (json.success) {
        setAssigningGuestId('');
        await fetchProjectDetails();
      } else {
        alert(json.error || 'Failed to assign guest to room');
      }
    } catch (err) {
      console.error(err);
      alert('Error assigning guest');
    } finally {
      setSubmittingAssign(false);
    }
  };

  // Unassign/Remove guest from room
  const handleUnassignGuest = async (guestId) => {
    if (!confirm('Are you sure you want to remove this guest from this room?')) return;

    try {
      const res = await fetch(`/api/guests/${guestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelName: '',
          roomNumber: '',
          daysUsed: 0,
          roomCostPerDay: 0
        })
      });

      const json = await res.json();
      if (json.success) {
        await fetchProjectDetails();
      } else {
        alert(json.error || 'Failed to remove guest');
      }
    } catch (err) {
      console.error(err);
      alert('Error removing guest');
    }
  };

  // Quick toggle checked-in status from map
  const handleToggleCheckIn = async (guestId, currentStatus) => {
    try {
      const res = await fetch(`/api/guests/${guestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCheckedIn: !currentStatus })
      });
      const json = await res.json();
      if (json.success) {
        await fetchProjectDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <Link href={`/projects/${id}`} className="btn btn-secondary btn-icon" style={{ marginBottom: '1rem' }}>
            <ChevronLeft size={16} /> Back to Event Portal
          </Link>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bed size={28} style={{ color: 'var(--accent-cyan)' }} /> Room Allocation Grid
          </h1>
          <p className="page-subtitle">Interactive theater-seat selector console for {project.name}.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={fetchProjectDetails} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={14} /> Refresh Map
          </button>
          <button 
            onClick={() => setShowAddRoomModal(true)} 
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))' }}
          >
            <Plus size={14} /> Add Room
          </button>
        </div>
      </div>

      {/* Stats Legends Bar */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem', padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-block', width: '16px', height: '16px', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1.5px solid var(--accent-emerald)' }}></span>
            <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>Double Occupancy (Full)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-block', width: '16px', height: '16px', borderRadius: '4px', backgroundColor: 'rgba(59, 130, 246, 0.15)', border: '1.5px solid var(--accent-blue)' }}></span>
            <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>Single Occupancy (Shareable)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-block', width: '16px', height: '16px', borderRadius: '4px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1.5px solid var(--border-color)' }}></span>
            <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>Empty Room</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.35rem 0.75rem', borderRadius: '8px', backgroundColor: unallocatedGuests.length > 0 ? 'rgba(244, 63, 94, 0.08)' : 'rgba(255,255,255,0.02)', border: unallocatedGuests.length > 0 ? '1px solid rgba(244, 63, 94, 0.2)' : '1px solid var(--border-color)' }}>
          <Users size={14} style={{ color: unallocatedGuests.length > 0 ? 'var(--accent-rose)' : 'var(--text-secondary)' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: unallocatedGuests.length > 0 ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
            {unallocatedGuests.length} unallocated guests
          </span>
        </div>
      </div>

      {/* Main Grid Workstation */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Visual Hotel Map Layouts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {hotelList.length === 0 ? (
            <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Building size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <h3>No Hotels Registered</h3>
              <p>Add bulk hotel bookings or assign hotels to guests in the RSVP portal to see maps.</p>
            </div>
          ) : (
            hotelList.map((hotel, idx) => (
              <div className="card" key={idx} style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                  <Building size={18} style={{ color: 'var(--accent-blue)' }} /> {hotel.hotelName}
                </h3>
                
                {/* Visual Seat Grid */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', 
                  gap: '0.75rem' 
                }}>
                  {hotel.rooms.map((room) => {
                    // Color definitions based on occupancy status
                    let bg = 'rgba(255, 255, 255, 0.02)';
                    let border = '1px solid var(--border-color)';
                    let textColor = 'var(--text-primary)';
                    let glow = 'none';

                    if (room.status === 'single') {
                      bg = 'rgba(59, 130, 246, 0.1)';
                      border = '1.5px solid var(--accent-blue)';
                      textColor = 'var(--accent-blue)';
                      glow = '0 0 8px rgba(59, 130, 246, 0.15)';
                    } else if (room.status === 'double') {
                      bg = 'rgba(16, 185, 129, 0.1)';
                      border = '1.5px solid var(--accent-emerald)';
                      textColor = 'var(--accent-emerald)';
                      glow = '0 0 8px rgba(16, 185, 129, 0.15)';
                    }

                    const isSelected = selectedRoom && 
                      selectedRoom.hotelName === hotel.hotelName && 
                      selectedRoom.roomNumber === room.roomNumber;

                    // Calculate Room IN and OUT stay dates
                    let inDate = null;
                    let outDate = null;
                    if (room.occupants && room.occupants.length > 0) {
                      room.occupants.forEach(o => {
                        const checkIn = o.checkInDate || o.arrivalDate;
                        const checkOut = o.checkOutDate || o.departureDate;
                        if (checkIn) {
                          const d = parseDateParts(checkIn);
                          if (d && (!inDate || d < inDate)) inDate = d;
                        }
                        if (checkOut) {
                          const d = parseDateParts(checkOut);
                          if (d && (!outDate || d > outDate)) outDate = d;
                        }
                      });
                    } else if (room.bookingDate) {
                      const d = parseDateParts(room.bookingDate);
                      if (d) {
                        inDate = d;
                        if (room.daysUsed) {
                          outDate = new Date(d.getFullYear(), d.getMonth(), d.getDate() + Number(room.daysUsed));
                        }
                      }
                    }

                    const formattedIn = inDate ? formatDateSafe(inDate) : null;
                    const formattedOut = outDate ? formatDateSafe(outDate) : null;

                    return (
                      <button
                        key={room.roomNumber}
                        onClick={() => setSelectedRoom({
                          hotelName: hotel.hotelName,
                          roomNumber: room.roomNumber,
                          occupants: room.occupants,
                          roomCostPerDay: room.roomCostPerDay || 0,
                          daysUsed: room.daysUsed || 1,
                          inDate: inDate,
                          notes: room.notes || ''
                        })}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0.65rem 0.35rem',
                          minHeight: '85px',
                          borderRadius: '8px',
                          backgroundColor: bg,
                          border: isSelected ? '2px solid var(--accent-cyan)' : border,
                          boxShadow: isSelected ? '0 0 12px rgba(6, 182, 212, 0.4)' : glow,
                          color: isSelected ? 'var(--accent-cyan)' : textColor,
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          transform: isSelected ? 'scale(1.03)' : 'none',
                        }}
                        title={`Room ${room.roomNumber} | IN: ${formattedIn || 'TBD'} | OUT: ${formattedOut || 'TBD'}\nOccupants: ${room.occupants.map(o => o.guestName).join(', ') || 'Empty'}`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                          <Bed size={14} style={{ opacity: 0.8 }} />
                          <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>{room.roomNumber}</span>
                        </div>

                        {/* Room IN & OUT Stay Dates */}
                        <div style={{ fontSize: '0.62rem', opacity: 0.9, marginTop: '2px', display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: '1.25' }}>
                          {formattedIn && (
                            <span style={{ color: 'var(--accent-cyan)', fontWeight: '600' }}>
                              IN: {formattedIn}
                            </span>
                          )}
                          {formattedOut && (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.58rem' }}>
                              OUT: {formattedOut}
                            </span>
                          )}
                          {!formattedIn && !formattedOut && (
                            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.58rem' }}>No dates</span>
                          )}
                        </div>
                        
                        {/* Occupancy dots indicator */}
                        {room.occupants.length > 0 && (
                          <div style={{ display: 'flex', gap: '3px', position: 'absolute', bottom: '4px' }}>
                            {room.occupants.map(o => (
                              <span 
                                key={o._id} 
                                style={{ 
                                  width: '4px', 
                                  height: '4px', 
                                  borderRadius: '50%', 
                                  backgroundColor: o.isCheckedIn ? 'var(--accent-emerald)' : 'var(--text-muted)' 
                                }} 
                              />
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* RIGHT COLUMN: Interactive Control Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '2rem' }}>
          
          {/* Card A: Selected Room Occupants & Actions */}
          <div className="card" style={{ padding: '1.25rem', minHeight: '260px' }}>
            {!selectedRoom ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '230px', textAlign: 'center', color: 'var(--text-secondary)', opacity: 0.6 }}>
                <Bed size={32} style={{ marginBottom: '0.75rem' }} />
                <p style={{ fontSize: '0.85rem' }}>Select a room from the map to view occupants and manage allocations.</p>
              </div>
            ) : (
              <div>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>Room {selectedRoom.roomNumber}</h4>
                      <button
                        onClick={() => handleOpenEditRoomModal(selectedRoom)}
                        className="btn btn-secondary"
                        style={{ padding: '0.15rem 0.45rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        title="Edit Room details, rate, and dates"
                      >
                        <Pencil size={12} /> Edit Room
                      </button>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{selectedRoom.hotelName}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedRoom(null)} 
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Occupants list */}
                <h5 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Occupants ({selectedRoom.occupants.length}/2)</h5>
                
                {selectedRoom.occupants.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '1.5rem' }}>No guests assigned to this room.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    {selectedRoom.occupants.map(occ => (
                      <div 
                        key={occ._id}
                        style={{ 
                          backgroundColor: 'rgba(255,255,255,0.01)', 
                          border: '1px solid var(--border-color)', 
                          borderRadius: '8px', 
                          padding: '0.6rem 0.75rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{occ.guestName}</div>
                          {occ.guestMobile && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>📞 {occ.guestMobile}</div>}
                          
                          {/* Stay IN and OUT dates */}
                          <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={11} /> 
                            <span>IN: {occ.checkInDate ? new Date(occ.checkInDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : (occ.arrivalDate ? new Date(occ.arrivalDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'TBD')}</span>
                            <span>•</span>
                            <span>OUT: {occ.checkOutDate ? new Date(occ.checkOutDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : (occ.departureDate ? new Date(occ.departureDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'TBD')}</span>
                          </div>
                          
                          {/* Live check-in badge switch */}
                          <button
                            onClick={() => handleToggleCheckIn(occ._id, occ.isCheckedIn)}
                            style={{
                              marginTop: '0.35rem',
                              border: 'none',
                              background: occ.isCheckedIn ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.04)',
                              color: occ.isCheckedIn ? 'var(--accent-emerald)' : 'var(--text-muted)',
                              fontSize: '0.65rem',
                              padding: '0.15rem 0.4rem',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            {occ.isCheckedIn ? '✓ Checked In' : '🏨 Pending Check-in'}
                          </button>
                        </div>
                        
                        <button
                          onClick={() => handleUnassignGuest(occ._id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--accent-rose)',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px'
                          }}
                          title="Remove guest from room"
                        >
                          <UserMinus size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Assignment tool */}
                {selectedRoom.occupants.length < 2 && (
                  <form onSubmit={handleAssignGuest} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                    <h5 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Assign Attendee</h5>
                    
                    {unallocatedGuests.length === 0 ? (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>All guests have rooms assigned.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <select
                          className="form-select"
                          value={assigningGuestId}
                          onChange={(e) => setAssigningGuestId(e.target.value)}
                          style={{ fontSize: '0.8rem', padding: '0.4rem' }}
                          required
                        >
                          <option value="">-- Choose guest --</option>
                          {unallocatedGuests.map(ug => (
                            <option key={ug._id} value={ug._id}>
                              {ug.guestName} ({ug.numberOfGuests} pax)
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={submittingAssign || !assigningGuestId}
                          style={{ 
                            fontSize: '0.8rem', 
                            padding: '0.4rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                        >
                          {submittingAssign ? <Loader2 size={12} className="spinner" /> : <UserPlus size={12} />} Assign to Room
                        </button>
                      </div>
                    )}
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Card B: Quick-List of Unallocated Guests */}
          <div className="card" style={{ padding: '1.25rem', flex: '1', display: 'flex', flexDirection: 'column', maxHeight: '400px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={14} style={{ color: unallocatedGuests.length > 0 ? 'var(--accent-rose)' : 'var(--text-muted)' }} /> Unallocated Stays ({unallocatedGuests.length})
            </h4>
            
            <div style={{ overflowY: 'auto', flex: '1', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '4px' }}>
              {unallocatedGuests.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', marginTop: '2rem' }}>All attendees have room allocations!</p>
              ) : (
                unallocatedGuests.map(ug => (
                  <div 
                    key={ug._id}
                    style={{ 
                      fontSize: '0.8rem', 
                      backgroundColor: 'rgba(255,255,255,0.01)', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '6px', 
                      padding: '0.5rem 0.6rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600' }}>{ug.guestName} ({ug.numberOfGuests} pax)</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <span style={{ color: 'var(--accent-cyan)' }}>
                          IN: {ug.checkInDate ? new Date(ug.checkInDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : (ug.arrivalDate ? new Date(ug.arrivalDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'TBD')}
                        </span>
                        <span>•</span>
                        <span>
                          OUT: {ug.checkOutDate ? new Date(ug.checkOutDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : (ug.departureDate ? new Date(ug.departureDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'TBD')}
                        </span>
                      </div>
                    </div>

                    {/* Quick-select focus */}
                    {selectedRoom && selectedRoom.occupants.length < 2 && (
                      <button
                        onClick={async () => {
                          setAssigningGuestId(ug._id);
                          // Trigger direct assignment
                          try {
                            const res = await fetch(`/api/guests/${ug._id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                hotelName: selectedRoom.hotelName,
                                roomNumber: selectedRoom.roomNumber,
                                checkInDate: ug.checkInDate || ug.arrivalDate || '',
                                checkOutDate: ug.checkOutDate || ug.departureDate || '',
                              })
                            });
                            const json = await res.json();
                            if (json.success) {
                              await fetchProjectDetails();
                            } else {
                              alert(json.error || 'Failed to assign guest');
                            }
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="btn btn-primary"
                        style={{ fontSize: '0.65rem', padding: '0.2rem 0.4rem' }}
                      >
                        Assign here
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Add Room Modal Overlay */}
      {showAddRoomModal && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-card" style={{ maxWidth: '450px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={18} style={{ color: 'var(--accent-cyan)' }} /> Add Room Allocation
              </h3>
              <button 
                onClick={() => {
                  setShowAddRoomModal(false);
                  setAddRoomError('');
                }} 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRoom}>
              <div className="form-group">
                <label className="form-label">Hotel Name</label>
                <input
                  type="text"
                  name="hotelName"
                  className="form-input"
                  placeholder="e.g. Radisson Blue"
                  value={newRoomForm.hotelName}
                  onChange={handleRoomFormChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Room Number / Block</label>
                  <input
                    type="text"
                    name="roomNumber"
                    className="form-input"
                    placeholder="e.g. 502"
                    value={newRoomForm.roomNumber}
                    onChange={handleRoomFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nightly Rate (₹ - Optional)</label>
                  <input
                    type="number"
                    name="roomCostPerDay"
                    className="form-input"
                    min="0"
                    placeholder="0"
                    value={newRoomForm.roomCostPerDay || ''}
                    onChange={handleRoomFormChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Stay Duration (Nights)</label>
                  <input
                    type="number"
                    name="daysUsed"
                    className="form-input"
                    min="1"
                    value={newRoomForm.daysUsed}
                    onChange={handleRoomFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Booking Date</label>
                  <input
                    type="date"
                    name="bookingDate"
                    className="form-input"
                    value={newRoomForm.bookingDate}
                    onChange={handleRoomFormChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes (Optional)</label>
                <textarea
                  name="notes"
                  className="form-input"
                  placeholder="e.g. Crew lodging block, near elevator..."
                  rows="2"
                  value={newRoomForm.notes}
                  onChange={handleRoomFormChange}
                />
              </div>

              {addRoomError && (
                <p style={{ color: 'var(--accent-rose)', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertTriangle size={14} /> {addRoomError}
                </p>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowAddRoomModal(false);
                    setAddRoomError('');
                  }} 
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={addingRoom}>
                  {addingRoom ? <Loader2 size={16} className="spinner" /> : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Room Modal Overlay */}
      {showEditRoomModal && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-card" style={{ maxWidth: '450px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Pencil size={18} style={{ color: 'var(--accent-blue)' }} /> Edit Room {editRoomForm.oldRoomNumber}
              </h3>
              <button 
                onClick={() => {
                  setShowEditRoomModal(false);
                  setEditRoomError('');
                }} 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateRoom}>
              <div className="form-group">
                <label className="form-label">Hotel Name</label>
                <input
                  type="text"
                  name="newHotelName"
                  className="form-input"
                  placeholder="e.g. Clark inn"
                  value={editRoomForm.newHotelName}
                  onChange={handleEditRoomFormChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Room Number / Block</label>
                  <input
                    type="text"
                    name="newRoomNumber"
                    className="form-input"
                    placeholder="e.g. 502"
                    value={editRoomForm.newRoomNumber}
                    onChange={handleEditRoomFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Full Room Nightly Rate (₹)</label>
                  <input
                    type="number"
                    name="roomCostPerDay"
                    className="form-input"
                    min="0"
                    placeholder="4000"
                    value={editRoomForm.roomCostPerDay || ''}
                    onChange={handleEditRoomFormChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Stay Duration (Nights)</label>
                  <input
                    type="number"
                    name="daysUsed"
                    className="form-input"
                    min="1"
                    value={editRoomForm.daysUsed}
                    onChange={handleEditRoomFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Check-in Date</label>
                  <input
                    type="date"
                    name="bookingDate"
                    className="form-input"
                    value={editRoomForm.bookingDate}
                    onChange={handleEditRoomFormChange}
                    required
                  />
                </div>
              </div>

              {editRoomForm.daysUsed > 0 && editRoomForm.roomCostPerDay > 0 && (
                <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.08)', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--accent-blue)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Total Calculated Room Cost:</span>
                  <strong style={{ fontSize: '0.95rem' }}>₹{(editRoomForm.daysUsed * editRoomForm.roomCostPerDay).toLocaleString('en-IN')}</strong>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Notes (Optional)</label>
                <textarea
                  name="notes"
                  className="form-input"
                  placeholder="e.g. Deluxe Suite, double occupancy..."
                  rows="2"
                  value={editRoomForm.notes}
                  onChange={handleEditRoomFormChange}
                />
              </div>

              {editRoomError && (
                <p style={{ color: 'var(--accent-rose)', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertTriangle size={14} /> {editRoomError}
                </p>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowEditRoomModal(false);
                    setEditRoomError('');
                  }} 
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={editingRoom}>
                  {editingRoom ? <Loader2 size={16} className="spinner" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
