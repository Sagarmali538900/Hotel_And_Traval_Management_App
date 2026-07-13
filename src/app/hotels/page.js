'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building, 
  Calendar, 
  Plus, 
  Trash2, 
  Search, 
  Briefcase, 
  Bed, 
  DollarSign, 
  ChevronLeft,
  Loader2 
} from 'lucide-react';

export default function HotelManagement() {
  const [projects, setProjects] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [form, setForm] = useState({
    projectId: '',
    hotelName: '',
    bookingDate: '',
    roomNumber: '',
    daysUsed: 1,
    roomCostPerDay: 0,
    notes: ''
  });
  const [error, setError] = useState('');

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
      const res = await fetch('/api/hotels');
      const json = await res.json();
      if (json.success) {
        setBookings(json.data);
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: name === 'daysUsed' || name === 'roomCostPerDay' ? parseFloat(value) || 0 : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.projectId) {
      setError('Please select a project');
      return;
    }
    if (!form.hotelName.trim() || !form.roomNumber.trim() || !form.bookingDate) {
      setError('All primary booking details are required');
      return;
    }
    if (form.daysUsed <= 0) {
      setError('Days used must be at least 1');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await fetch('/api/hotels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const json = await res.json();
      
      if (json.success) {
        setForm({
          projectId: '',
          hotelName: '',
          bookingDate: '',
          roomNumber: '',
          daysUsed: 1,
          roomCostPerDay: 0,
          notes: ''
        });
        fetchBookings();
      } else {
        setError(json.error || 'Failed to submit booking');
      }
    } catch (err) {
      setError('An error occurred during submission');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this hotel booking?')) {
      return;
    }

    try {
      const res = await fetch(`/api/hotels?id=${id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        fetchBookings();
      } else {
        alert(json.error || 'Failed to delete booking');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting booking');
    }
  };

  // Filter logic
  const filteredBookings = bookings.filter(b => 
    b.hotelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.roomNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <Link href="/" className="btn btn-secondary btn-icon" style={{ marginBottom: '1rem' }} id="btn-back-dashboard">
            <ChevronLeft size={16} /> Back to Dashboard
          </Link>
          <h1 className="page-title">Hotel Allocation Panel</h1>
          <p className="page-subtitle">Assign rooms to projects, calculate days used, and manage hotel expenditures.</p>
        </div>
      </div>

      <div className="panel-grid">
        {/* Booking Form Card */}
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', fontFamily: 'var(--font-heading)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building size={20} style={{ color: 'var(--accent-blue)' }} /> Add Room Allocation
          </h2>
          
          {projectsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem' }}>
              <Loader2 className="spinner" size={24} style={{ color: 'var(--accent-blue)' }} />
            </div>
          ) : projects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                You must have an active project ledger before logging bookings.
              </p>
              <Link href="/" className="btn btn-primary" style={{ width: '100%' }}>
                Create a Project First
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="hotel-project-select">Associated Project</label>
                <select
                  id="hotel-project-select"
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

              <div className="form-group">
                <label className="form-label" htmlFor="hotel-name-input">Hotel Name</label>
                <input
                  type="text"
                  id="hotel-name-input"
                  name="hotelName"
                  className="form-input"
                  placeholder="e.g., Radisson Blu Resort"
                  value={form.hotelName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="booking-date-input">Check-in Date</label>
                  <input
                    type="date"
                    id="booking-date-input"
                    name="bookingDate"
                    className="form-input"
                    value={form.bookingDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="room-number-input">Room Assigned</label>
                  <input
                    type="text"
                    id="room-number-input"
                    name="roomNumber"
                    className="form-input"
                    placeholder="e.g., Suite 402"
                    value={form.roomNumber}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="days-used-input">Days Used</label>
                  <input
                    type="number"
                    id="days-used-input"
                    name="daysUsed"
                    className="form-input"
                    min="1"
                    value={form.daysUsed}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="room-cost-input">Cost Per Day (₹)</label>
                  <input
                    type="number"
                    id="room-cost-input"
                    name="roomCostPerDay"
                    className="form-input"
                    min="0"
                    placeholder="0"
                    value={form.roomCostPerDay || ''}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="hotel-notes-input">Special Instructions / Remarks</label>
                <textarea
                  id="hotel-notes-input"
                  name="notes"
                  className="form-input"
                  placeholder="e.g. VIP guests, early check-in requested..."
                  rows="2"
                  value={form.notes}
                  onChange={handleInputChange}
                />
              </div>

              <div style={{ padding: '0.5rem 0', display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.9rem', borderTop: '1px solid var(--border-color)', margin: '1rem 0' }}>
                <span>Calculated Cost:</span>
                <strong style={{ color: 'var(--accent-cyan)' }}>₹{(form.daysUsed * form.roomCostPerDay).toLocaleString('en-IN')}</strong>
              </div>

              {error && <p style={{ color: 'var(--accent-rose)', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}

              <button 
                type="submit" 
                className="btn btn-primary" 
                id="btn-submit-hotel"
                disabled={submitting}
                style={{ width: '100%' }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="spinner" /> Allocating Room...
                  </>
                ) : (
                  <>
                    <Plus size={16} /> Allocate Room
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Bookings List Card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bed size={20} style={{ color: 'var(--accent-emerald)' }} /> Room Allocations Ledger
            </h2>

            {/* Search Input */}
            <div style={{ position: 'relative', width: '250px' }}>
              <input
                type="text"
                id="hotel-search-input"
                className="form-input"
                placeholder="Search hotel, project, room..."
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
              <Building size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <p>{searchTerm ? 'No bookings match your search query.' : 'No rooms assigned yet.'}</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table" id="hotel-bookings-table">
                <thead>
                  <tr>
                    <th>Hotel Name</th>
                    <th>Room</th>
                    <th>Project</th>
                    <th>Booking Date</th>
                    <th>Duration</th>
                    <th>Cost/Day</th>
                    <th>Total Cost</th>
                    <th className="no-print" style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((b) => (
                    <tr key={b._id}>
                      <td style={{ fontWeight: '600' }}>
                        <div>{b.hotelName}</div>
                        {b.notes && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal', marginTop: '0.25rem' }}>Note: {b.notes}</div>}
                      </td>
                      <td>
                        <span className="badge badge-info">{b.roomNumber}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Briefcase size={12} /> {b.projectName}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                          <Calendar size={12} style={{ color: 'var(--text-muted)' }} />
                          {new Date(b.bookingDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                      <td>
                        <strong>{b.daysUsed}</strong> {b.daysUsed === 1 ? 'day' : 'days'}
                      </td>
                      <td>₹{b.roomCostPerDay.toLocaleString('en-IN')}</td>
                      <td style={{ fontWeight: '700', color: 'var(--accent-cyan)' }}>
                        ₹{b.totalCost.toLocaleString('en-IN')}
                      </td>
                      <td className="no-print" style={{ textAlign: 'center' }}>
                        <button 
                          onClick={() => handleDelete(b._id)} 
                          className="btn btn-danger btn-icon"
                          title="Delete Booking"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
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
