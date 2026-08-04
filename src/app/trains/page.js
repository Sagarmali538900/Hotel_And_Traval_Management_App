'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Subway,
  User, 
  Calendar, 
  Plus, 
  Trash2, 
  Search, 
  Briefcase, 
  Phone, 
  Clock, 
  Edit3,
  Users,
  ChevronLeft,
  Loader2,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  X
} from 'lucide-react';

export default function TrainManagement() {
  const [projects, setProjects] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State for creating bookings
  const [form, setForm] = useState({
    projectId: '',
    guestName: '',
    guestMobile: '',
    numberOfGuests: 1,
    trainName: '',
    trainCode: '',
    arrivalDate: '',
    arrivalTime: '',
    departureDate: '',
    departureTime: '',
    assignedDriverName: '',
    assignedDriverMobile: '',
    notes: ''
  });
  const [error, setError] = useState('');

  // Edit Modal State
  const [editingBooking, setEditingBooking] = useState(null);
  const [editForm, setEditForm] = useState({
    guestName: '',
    guestMobile: '',
    numberOfGuests: 1,
    trainName: '',
    trainCode: '',
    arrivalDate: '',
    arrivalTime: '',
    departureDate: '',
    departureTime: '',
    assignedDriverName: '',
    assignedDriverMobile: '',
    notes: '',
    changeReason: ''
  });
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // History Modal State
  const [activeHistoryLog, setActiveHistoryLog] = useState(null);

  // Global counts
  const [stats, setStats] = useState({
    totalArrivals: 0,
    totalGuests: 0,
    unassignedPickups: 0
  });

  const fetchProjects = async () => {
    try {
      setProjectsLoading(true);
      const res = await fetch('/api/projects');
      const json = await res.json();
      if (json.success) {
        setProjects(json.data.filter(p => p.status === 'Active'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProjectsLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/trains');
      const json = await res.json();
      if (json.success) {
        setBookings(json.data);
        calculateStats(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchBookings();
  }, []);

  const calculateStats = (list) => {
    let guests = 0;
    let unassigned = 0;

    list.forEach(b => {
      guests += b.numberOfGuests || 0;
      if (!b.assignedDriverName || !b.assignedDriverName.trim()) {
        unassigned++;
      }
    });

    setStats({
      totalArrivals: list.length,
      totalGuests: guests,
      unassignedPickups: unassigned
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: name === 'numberOfGuests' ? parseInt(value) || 1 : value
    });
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm({
      ...editForm,
      [name]: name === 'numberOfGuests' ? parseInt(value) || 1 : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.projectId) {
      setError('Please select a project');
      return;
    }
    if (
      !form.guestName.trim() ||
      !form.trainName.trim() ||
      !form.trainCode.trim() ||
      !form.arrivalDate ||
      !form.arrivalTime ||
      !form.departureDate ||
      !form.departureTime
    ) {
      setError('Guest name, train details, and arrival/departure timings are required');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await fetch('/api/trains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const json = await res.json();

      if (json.success) {
        setForm({
          projectId: '',
          guestName: '',
          guestMobile: '',
          numberOfGuests: 1,
          trainName: '',
          trainCode: '',
          arrivalDate: '',
          arrivalTime: '',
          departureDate: '',
          departureTime: '',
          assignedDriverName: '',
          assignedDriverMobile: '',
          notes: ''
        });
        fetchBookings();
      } else {
        setError(json.error || 'Failed to schedule train booking');
      }
    } catch (err) {
      setError('An error occurred during submission');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Trigger editing state
  const startEdit = (booking) => {
    setEditingBooking(booking);
    setEditForm({
      guestName: booking.guestName,
      guestMobile: booking.guestMobile || '',
      numberOfGuests: booking.numberOfGuests || 1,
      trainName: booking.trainName,
      trainCode: booking.trainCode,
      arrivalDate: new Date(booking.arrivalDate).toISOString().split('T')[0],
      arrivalTime: booking.arrivalTime,
      departureDate: new Date(booking.departureDate).toISOString().split('T')[0],
      departureTime: booking.departureTime,
      assignedDriverName: booking.assignedDriverName || '',
      assignedDriverMobile: booking.assignedDriverMobile || '',
      notes: booking.notes || '',
      changeReason: '' // Reset reason
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (
      !editForm.guestName.trim() ||
      !editForm.trainName.trim() ||
      !editForm.trainCode.trim() ||
      !editForm.arrivalDate ||
      !editForm.arrivalTime ||
      !editForm.departureDate ||
      !editForm.departureTime
    ) {
      setEditError('Primary train details and timings are required');
      return;
    }

    // Check if timings actually changed to require a changeReason
    const prevArrTime = editingBooking.arrivalTime;
    const prevDepTime = editingBooking.departureTime;
    const prevArrDate = new Date(editingBooking.arrivalDate).toISOString().split('T')[0];
    const prevDepDate = new Date(editingBooking.departureDate).toISOString().split('T')[0];

    const timingChanged =
      prevArrTime !== editForm.arrivalTime ||
      prevDepTime !== editForm.departureTime ||
      prevArrDate !== editForm.arrivalDate ||
      prevDepDate !== editForm.departureDate;

    if (timingChanged && !editForm.changeReason.trim()) {
      setEditError('Timings changed! Please enter a reason for the schedule adjustment.');
      return;
    }

    try {
      setEditSubmitting(true);
      setEditError('');
      const res = await fetch(`/api/trains/${editingBooking._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const json = await res.json();

      if (json.success) {
        setEditingBooking(null);
        fetchBookings();
      } else {
        setEditError(json.error || 'Failed to update schedule');
      }
    } catch (err) {
      setEditError('An error occurred during update');
      console.error(err);
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this train schedule log?')) {
      return;
    }

    try {
      const res = await fetch(`/api/trains/${id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        fetchBookings();
      } else {
        alert(json.error || 'Failed to delete train schedule');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting schedule');
    }
  };

  // Filter logic
  const filteredBookings = bookings.filter(b => 
    b.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.trainName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.trainCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.assignedDriverName && b.assignedDriverName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <Link href="/" className="btn btn-secondary btn-icon" style={{ marginBottom: '1rem' }} id="btn-back-dashboard">
            <ChevronLeft size={16} /> Back to Dashboard
          </Link>
          <h1 className="page-title">Train Arrival Coordinator</h1>
          <p className="page-subtitle">Track guests arriving by train, assign pickup drivers, and view timing edit histories.</p>
        </div>
      </div>

      {/* Train Stats Panel */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
          gap: '1.5rem',
          marginBottom: '2.5rem'
        }}
      >
        <div className="card" style={{ borderLeft: '4px solid var(--accent-blue)' }}>
          <div className="stat-item">
            <span className="stat-val" style={{ color: 'var(--accent-blue)' }}>{stats.totalArrivals}</span>
            <span className="stat-lbl">Scheduled Groups</span>
          </div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
          <div className="stat-item">
            <span className="stat-val" style={{ color: 'var(--accent-cyan)' }}>{stats.totalGuests}</span>
            <span className="stat-lbl">Total Guests Arriving</span>
          </div>
        </div>
        <div className="card" style={{ 
          borderLeft: stats.unassignedPickups > 0 ? '4px solid var(--accent-rose)' : '4px solid var(--accent-emerald)',
          background: stats.unassignedPickups > 0 ? 'rgba(244, 63, 94, 0.04)' : 'var(--bg-card)'
        }}>
          <div className="stat-item">
            <span className="stat-val" style={{ color: stats.unassignedPickups > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
              {stats.unassignedPickups}
            </span>
            <span className="stat-lbl">{stats.unassignedPickups > 0 ? 'Pickups Pending Driver' : 'All Pickups Covered'}</span>
          </div>
        </div>
      </div>

      <div className="panel-grid">
        {/* Booking Form Card */}
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', fontFamily: 'var(--font-heading)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={20} style={{ color: 'var(--accent-blue)' }} /> Log Train Schedule
          </h2>

          {projectsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem' }}>
              <Loader2 className="spinner" size={24} style={{ color: 'var(--accent-blue)' }} />
            </div>
          ) : projects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                You must have an active project ledger before scheduling train pickups.
              </p>
              <Link href="/" className="btn btn-primary" style={{ width: '100%' }}>
                Create a Project First
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="train-project-select">Associated Project</label>
                <select
                  id="train-project-select"
                  name="projectId"
                  className="form-select"
                  value={form.projectId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">-- Choose Project --</option>
                  {projects.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Guest Details */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="guest-name-input">Primary Guest Name</label>
                  <input
                    type="text"
                    id="guest-name-input"
                    name="guestName"
                    className="form-input"
                    placeholder="e.g. Ramesh Kumar"
                    value={form.guestName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="guest-qty-input">Total Persons</label>
                  <input
                    type="number"
                    id="guest-qty-input"
                    name="numberOfGuests"
                    className="form-input"
                    min="1"
                    value={form.numberOfGuests}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="guest-mobile-input">Guest Contact Mobile (Optional)</label>
                <input
                  type="tel"
                  id="guest-mobile-input"
                  name="guestMobile"
                  className="form-input"
                  placeholder="e.g. 9822******"
                  value={form.guestMobile}
                  onChange={handleInputChange}
                />
              </div>

              {/* Train details */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="train-code-input">Train Number / Code</label>
                  <input
                    type="text"
                    id="train-code-input"
                    name="trainCode"
                    className="form-input"
                    placeholder="e.g., 12124"
                    value={form.trainCode}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="train-name-input">Train Name</label>
                  <input
                    type="text"
                    id="train-name-input"
                    name="trainName"
                    className="form-input"
                    placeholder="e.g., Deccan Queen"
                    value={form.trainName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              {/* Arrival in Pune */}
              <h4 style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '1rem 0 0.5rem 0' }}>Pune Arrival</h4>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="arr-date-input">Arrival Date</label>
                  <input
                    type="date"
                    id="arr-date-input"
                    name="arrivalDate"
                    className="form-input"
                    value={form.arrivalDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="arr-time-input">Arrival Time</label>
                  <input
                    type="time"
                    id="arr-time-input"
                    name="arrivalTime"
                    className="form-input"
                    value={form.arrivalTime}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              {/* Departure from Pune */}
              <h4 style={{ fontSize: '0.85rem', color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '1rem 0 0.5rem 0' }}>Pune Departure</h4>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="dep-date-input">Departure Date</label>
                  <input
                    type="date"
                    id="dep-date-input"
                    name="departureDate"
                    className="form-input"
                    value={form.departureDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="dep-time-input">Departure Time</label>
                  <input
                    type="time"
                    id="dep-time-input"
                    name="departureTime"
                    className="form-input"
                    value={form.departureTime}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              {/* Assigned Pickup Driver */}
              <h4 style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '1rem 0 0.5rem 0' }}>Pickup Coordinator (Optional)</h4>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="assign-driver-name">Driver Name</label>
                  <input
                    type="text"
                    id="assign-driver-name"
                    name="assignedDriverName"
                    className="form-input"
                    placeholder="e.g. Sunil Patil"
                    value={form.assignedDriverName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="assign-driver-mobile">Driver Mobile</label>
                  <input
                    type="tel"
                    id="assign-driver-mobile"
                    name="assignedDriverMobile"
                    className="form-input"
                    placeholder="e.g. 9888******"
                    value={form.assignedDriverMobile}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="train-notes">Special Instructions</label>
                <textarea
                  id="train-notes"
                  name="notes"
                  className="form-input"
                  placeholder="e.g. Needs wheelchair help, carrying heavy luggage..."
                  rows="2"
                  value={form.notes}
                  onChange={handleInputChange}
                />
              </div>

              {error && <p style={{ color: 'var(--accent-rose)', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}

              <button 
                type="submit" 
                className="btn btn-primary" 
                id="btn-submit-train"
                disabled={submitting}
                style={{ width: '100%', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))', color: '#0b0f19' }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="spinner" /> Scheduling Train...
                  </>
                ) : (
                  <>
                    <Plus size={16} /> Log Train Schedule
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Train Schedule Table */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={20} style={{ color: 'var(--accent-emerald)' }} /> Chronological Arrival Ledger
            </h2>

            {/* Search Input */}
            <div style={{ position: 'relative', width: '250px' }}>
              <input
                type="text"
                id="train-search-input"
                className="form-input"
                placeholder="Search guest, train, driver, project..."
                style={{ paddingLeft: '2.5rem', fontSize: '0.85rem' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search size={14} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
              <Loader2 className="spinner" size={32} style={{ color: 'var(--accent-blue)' }} />
            </div>
          ) : filteredBookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
              <Clock size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <p>{searchTerm ? 'No schedules match your search query.' : 'No train schedules logged yet.'}</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table" id="train-bookings-table">
                <thead>
                  <tr>
                    <th>Guest Group</th>
                    <th>Train Details</th>
                    <th>Pune Arrival (Pune-In)</th>
                    <th>Pune Departure (Pune-Out)</th>
                    <th>Pickup Driver</th>
                    <th>Project</th>
                    <th className="no-print" style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((b) => {
                    const isUnassigned = !b.assignedDriverName || !b.assignedDriverName.trim();
                    
                    return (
                      <tr 
                        key={b._id}
                        style={{ 
                          borderLeft: isUnassigned ? '4px solid var(--accent-rose)' : 'none',
                          backgroundColor: isUnassigned ? 'rgba(244, 63, 94, 0.03)' : 'transparent',
                        }}
                      >
                        <td>
                          <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{b.guestName}</div>
                          {b.guestMobile && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>📞 {b.guestMobile}</div>}
                          <div style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '0.15rem 0.5rem', fontSize: '0.65rem' }}>
                              <Users size={10} /> {b.numberOfGuests} {b.numberOfGuests === 1 ? 'person' : 'persons'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: '600' }}>{b.trainName}</div>
                          <span className="badge badge-success" style={{ fontSize: '0.65rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                            Code: {b.trainCode}
                          </span>
                          {b.notes && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.2rem' }}>
                              Note: {b.notes}
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ fontWeight: '600', color: 'var(--accent-cyan)', fontSize: '0.95rem' }}>
                            {b.arrivalTime}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '0.15rem' }}>
                            <Calendar size={10} />
                            {new Date(b.arrivalDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: '600', color: 'var(--accent-blue)', fontSize: '0.95rem' }}>
                            {b.departureTime}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '0.15rem' }}>
                            <Calendar size={10} />
                            {new Date(b.departureDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                          </div>
                        </td>
                        <td>
                          {isUnassigned ? (
                            <span className="badge badge-warning" style={{ fontSize: '0.65rem', display: 'inline-flex', alignItems: 'center', gap: '3px', backgroundColor: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.25)', color: 'var(--accent-rose)' }}>
                              <AlertTriangle size={10} /> Pending
                            </span>
                          ) : (
                            <div>
                              <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                                <CheckCircle size={12} style={{ color: 'var(--accent-emerald)' }} /> {b.assignedDriverName}
                              </div>
                              {b.assignedDriverMobile && (
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                                  📞 {b.assignedDriverMobile}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Briefcase size={12} /> {b.projectName}
                          </span>
                        </td>
                        <td className="no-print" style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                            {b.history && b.history.length > 0 && (
                              <button
                                onClick={() => setActiveHistoryLog(b)}
                                className="btn btn-secondary btn-icon"
                                title="View Schedule Change History"
                                style={{ borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}
                              >
                                <Clock size={12} />
                              </button>
                            )}
                            <button
                              onClick={() => startEdit(b)}
                              className="btn btn-secondary btn-icon"
                              title="Edit Schedule"
                            >
                              <Edit3 size={12} />
                            </button>
                            <button
                              onClick={() => handleDelete(b._id)}
                              className="btn btn-danger btn-icon"
                              title="Delete Record"
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
      </div>

      {/* Edit Modal (Glassmorphism layout) */}
      {editingBooking && (
        <div className="modal-overlay no-print">
          <div className="card modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: '700', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={18} style={{ color: 'var(--accent-blue)' }} /> Edit Train Log
              </h3>
              <button onClick={() => setEditingBooking(null)} className="btn btn-secondary btn-icon" style={{ padding: '0.25rem' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label className="form-label">Guest Name</label>
                <input
                  type="text"
                  name="guestName"
                  className="form-input"
                  value={editForm.guestName}
                  onChange={handleEditInputChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Contact Mobile</label>
                  <input
                    type="tel"
                    name="guestMobile"
                    className="form-input"
                    value={editForm.guestMobile}
                    onChange={handleEditInputChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Total Persons</label>
                  <input
                    type="number"
                    name="numberOfGuests"
                    className="form-input"
                    min="1"
                    value={editForm.numberOfGuests}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Train Code</label>
                  <input
                    type="text"
                    name="trainCode"
                    className="form-input"
                    value={editForm.trainCode}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Train Name</label>
                  <input
                    type="text"
                    name="trainName"
                    className="form-input"
                    value={editForm.trainName}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>
              </div>

              <h4 style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', margin: '1rem 0 0.5rem 0' }}>Pune Arrival (In)</h4>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Arrival Date</label>
                  <input
                    type="date"
                    name="arrivalDate"
                    className="form-input"
                    value={editForm.arrivalDate}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Arrival Time</label>
                  <input
                    type="time"
                    name="arrivalTime"
                    className="form-input"
                    value={editForm.arrivalTime}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>
              </div>

              <h4 style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', textTransform: 'uppercase', margin: '1rem 0 0.5rem 0' }}>Pune Departure (Out)</h4>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Departure Date</label>
                  <input
                    type="date"
                    name="departureDate"
                    className="form-input"
                    value={editForm.departureDate}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Departure Time</label>
                  <input
                    type="time"
                    name="departureTime"
                    className="form-input"
                    value={editForm.departureTime}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>
              </div>

              <h4 style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', textTransform: 'uppercase', margin: '1rem 0 0.5rem 0' }}>Pickup Coordinator</h4>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Driver Name</label>
                  <input
                    type="text"
                    name="assignedDriverName"
                    className="form-input"
                    value={editForm.assignedDriverName}
                    onChange={handleEditInputChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Driver Mobile</label>
                  <input
                    type="tel"
                    name="assignedDriverMobile"
                    className="form-input"
                    value={editForm.assignedDriverMobile}
                    onChange={handleEditInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Special Instructions</label>
                <textarea
                  name="notes"
                  className="form-input"
                  rows="2"
                  value={editForm.notes}
                  onChange={handleEditInputChange}
                />
              </div>

              {/* Display changeReason input conditionally if timings changed */}
              {(
                editingBooking.arrivalTime !== editForm.arrivalTime ||
                editingBooking.departureTime !== editForm.departureTime ||
                new Date(editingBooking.arrivalDate).toISOString().split('T')[0] !== editForm.arrivalDate ||
                new Date(editingBooking.departureDate).toISOString().split('T')[0] !== editForm.departureDate
              ) && (
                <div className="form-group" style={{ backgroundColor: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '1rem', borderRadius: '8px', margin: '1.25rem 0' }}>
                  <label className="form-label" style={{ color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle size={14} /> Reason for Timing Change
                  </label>
                  <input
                    type="text"
                    name="changeReason"
                    className="form-input"
                    placeholder="e.g. Train delayed, flight rescheduled..."
                    value={editForm.changeReason}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>
              )}

              {editError && <p style={{ color: 'var(--accent-rose)', fontSize: '0.85rem', marginBottom: '1rem' }}>{editError}</p>}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <button type="button" onClick={() => setEditingBooking(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={editSubmitting}>
                  {editSubmitting ? <Loader2 size={16} className="spinner" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Log Modal (Glassmorphism layout) */}
      {activeHistoryLog && (
        <div className="modal-overlay no-print">
          <div className="card modal-content" style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: '700', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} style={{ color: 'var(--accent-cyan)' }} /> Schedule History Log
              </h3>
              <button onClick={() => setActiveHistoryLog(null)} className="btn btn-secondary btn-icon" style={{ padding: '0.25rem' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Guest Name</span>
              <strong style={{ fontSize: '1.1rem' }}>{activeHistoryLog.guestName}</strong>
            </div>

            {/* Timelines log */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '50vh', overflowY: 'auto', paddingRight: '0.25rem' }}>
              {/* Present timing at top */}
              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--accent-emerald)', marginBottom: '0.25rem' }}>
                  Current Active Schedule
                </div>
                <div style={{ fontSize: '0.9rem' }}>
                  <strong>Arrival:</strong> {new Date(activeHistoryLog.arrivalDate).toLocaleDateString('en-GB')} @ {activeHistoryLog.arrivalTime}
                </div>
                <div style={{ fontSize: '0.9rem', marginTop: '0.15rem' }}>
                  <strong>Departure:</strong> {new Date(activeHistoryLog.departureDate).toLocaleDateString('en-GB')} @ {activeHistoryLog.departureTime}
                </div>
              </div>

              {/* History list */}
              {activeHistoryLog.history.slice().reverse().map((h, index) => (
                <div 
                  key={index}
                  style={{ 
                    borderLeft: '2px solid var(--accent-cyan)',
                    paddingLeft: '1rem',
                    margin: '0.25rem 0'
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Edited on: {new Date(h.changedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    <strong>Prev Arrival:</strong> {new Date(h.previousArrivalDate).toLocaleDateString('en-GB')} @ {h.previousArrivalTime}
                  </div>
                  <div style={{ fontSize: '0.85rem', marginTop: '0.15rem' }}>
                    <strong>Prev Departure:</strong> {new Date(h.previousDepartureDate).toLocaleDateString('en-GB')} @ {h.previousDepartureTime}
                  </div>
                  <div style={{ fontSize: '0.8rem', fontStyle: 'italic', marginTop: '0.4rem', color: 'var(--accent-amber)', backgroundColor: 'rgba(245, 158, 11, 0.05)', padding: '0.25rem 0.5rem', borderRadius: '4px', width: 'fit-content' }}>
                    Reason: {h.reason}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <button type="button" onClick={() => setActiveHistoryLog(null)} className="btn btn-secondary" style={{ width: '100%' }}>
                Close Logs
              </button>
            </div>
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
