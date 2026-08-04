'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Truck, 
  User, 
  Calendar, 
  Plus, 
  Trash2, 
  Search, 
  Briefcase, 
  Phone, 
  DollarSign, 
  ChevronLeft,
  Loader2,
  Info,
  Fuel
} from 'lucide-react';

export default function TransportManagement() {
  const [projects, setProjects] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [form, setForm] = useState({
    projectId: '',
    vehicleName: '',
    vehicleNumber: '',
    driverName: '',
    driverMobile: '',
    bookingDate: '',
    costModel: 'daily', // 'daily' or 'hourly'
    costRate: 0,
    duration: 1,
    fuelPolicy: 'included', // 'included' or 'excluded'
    fuelCost: 0,
    otherExpenses: 0,
    rentPayable: 0,
    ownershipType: 'Hired',
    startTime: '',
    endTime: '',
    destination: ''
  });
  const [error, setError] = useState('');

  // Transport Stats
  const [stats, setStats] = useState({
    vehicleCount: 0,
    totalBilled: 0,
    totalDieselSpent: 0,
    totalRentPaid: 0
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
      const res = await fetch('/api/transport');
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
    let billed = 0;
    let diesel = 0;
    let rent = 0;

    list.forEach(b => {
      billed += b.totalCost || 0;
      diesel += b.fuelCost || 0;
      rent += b.rentPayable || 0;
    });

    setStats({
      vehicleCount: list.length,
      totalBilled: billed,
      totalDieselSpent: diesel,
      totalRentPaid: rent
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: ['costRate', 'duration', 'fuelCost', 'otherExpenses', 'rentPayable'].includes(name)
        ? parseFloat(value) || 0
        : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.projectId) {
      setError('Please select a project');
      return;
    }

    if (
      !form.vehicleName.trim() ||
      !form.vehicleNumber.trim() ||
      !form.bookingDate
    ) {
      setError('Vehicle details and scheduling date are required');
      return;
    }
    if (form.duration <= 0) {
      setError('Duration must be greater than 0');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      // Normalize fuelCost if fuel is included in rent
      const submittedForm = {
        ...form,
        fuelCost: form.fuelPolicy === 'included' ? 0 : form.fuelCost
      };

      const res = await fetch('/api/transport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submittedForm)
      });
      const json = await res.json();

      if (json.success) {
        setForm({
          projectId: '',
          vehicleName: '',
          vehicleNumber: '',
          driverName: '',
          driverMobile: '',
          bookingDate: '',
          costModel: 'daily',
          costRate: 0,
          duration: 1,
          fuelPolicy: 'included',
          fuelCost: 0,
          otherExpenses: 0,
          rentPayable: 0,
          ownershipType: 'Hired',
          startTime: '',
          endTime: '',
          destination: ''
        });
        fetchBookings();
      } else {
        setError(json.error || 'Failed to submit transport scheduling');
      }
    } catch (err) {
      setError('An error occurred during submission');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this transport record?')) {
      return;
    }

    try {
      const res = await fetch(`/api/transport?id=${id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        fetchBookings();
      } else {
        alert(json.error || 'Failed to delete transport entry');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting transport booking');
    }
  };

  // Live total calculation for the form
  const getLiveTotal = () => {
    const baseCost = form.costRate * form.duration;
    const fuel = form.fuelPolicy === 'included' ? 0 : form.fuelCost;
    return baseCost + fuel + form.otherExpenses;
  };

  const [selectedProjectFilter, setSelectedProjectFilter] = useState('');

  // Filter logic
  const filteredBookings = bookings.filter(b => {
    const matchesSearch = 
      b.vehicleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.projectName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProject = !selectedProjectFilter || b.projectId === selectedProjectFilter;
    
    return matchesSearch && matchesProject;
  });

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <Link href="/" className="btn btn-secondary btn-icon" style={{ marginBottom: '1rem' }} id="btn-back-dashboard">
            <ChevronLeft size={16} /> Back to Dashboard
          </Link>
          <h1 className="page-title">Transport Scheduler & Financials</h1>
          <p className="page-subtitle">Schedule vehicles per project, track fuel policies, and manage driver/rent ledgers.</p>
        </div>
      </div>

      {/* Transport mini stats */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
          gap: '1.5rem',
          marginBottom: '2.5rem'
        }}
      >
        <div className="card">
          <div className="stat-item">
            <span className="stat-val" style={{ color: 'var(--accent-emerald)' }}>{stats.vehicleCount}</span>
            <span className="stat-lbl">Vehicles Scheduled</span>
          </div>
        </div>
        <div className="card">
          <div className="stat-item">
            <span className="stat-val" style={{ color: 'var(--accent-cyan)' }}>₹{stats.totalBilled.toLocaleString('en-IN')}</span>
            <span className="stat-lbl">Total Billing Billed</span>
          </div>
        </div>
        <div className="card">
          <div className="stat-item">
            <span className="stat-val" style={{ color: 'var(--accent-rose)' }}>₹{stats.totalDieselSpent.toLocaleString('en-IN')}</span>
            <span className="stat-lbl">Total Diesel/Fuel Spent</span>
          </div>
        </div>
        <div className="card">
          <div className="stat-item">
            <span className="stat-val" style={{ color: 'var(--accent-amber)' }}>₹{stats.totalRentPaid.toLocaleString('en-IN')}</span>
            <span className="stat-lbl">Total Rent Paid to Owners</span>
          </div>
        </div>
      </div>

      <div className="panel-grid">
        {/* Form to Create Transport Booking */}
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', fontFamily: 'var(--font-heading)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Truck size={20} style={{ color: 'var(--accent-blue)' }} /> Schedule Vehicle
          </h2>

          {projectsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem' }}>
              <Loader2 className="spinner" size={24} style={{ color: 'var(--accent-blue)' }} />
            </div>
          ) : projects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                You must have an active project ledger before scheduling vehicles.
              </p>
              <Link href="/" className="btn btn-primary" style={{ width: '100%' }}>
                Create a Project First
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="transport-project-select">Associated Project</label>
                <select
                  id="transport-project-select"
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

              {/* Vehicle specs */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="vehicle-name-input">Vehicle Name / Type</label>
                  <input
                    type="text"
                    id="vehicle-name-input"
                    name="vehicleName"
                    className="form-input"
                    placeholder="e.g., Innova Crysta"
                    value={form.vehicleName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="vehicle-number-input">License Plate Number</label>
                  <input
                    type="text"
                    id="vehicle-number-input"
                    name="vehicleNumber"
                    className="form-input"
                    placeholder="e.g., MH-12-AB-1234"
                    value={form.vehicleNumber}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              {/* Ownership Type select */}
              <div className="form-group">
                <label className="form-label" htmlFor="ownership-type-select">Vehicle Ownership</label>
                <select
                  id="ownership-type-select"
                  name="ownershipType"
                  className="form-select"
                  value={form.ownershipType}
                  onChange={handleInputChange}
                >
                  <option value="Hired">Hired (Contractual / Rental)</option>
                  <option value="Owned">Owned (Company Vehicle)</option>
                </select>
              </div>

              {/* Driver details */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="driver-name-input">Driver Name (Optional)</label>
                  <input
                    type="text"
                    id="driver-name-input"
                    name="driverName"
                    className="form-input"
                    placeholder="e.g., Sunil Patil"
                    value={form.driverName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="driver-mobile-input">Driver Mobile (Optional)</label>
                  <input
                    type="tel"
                    id="driver-mobile-input"
                    name="driverMobile"
                    className="form-input"
                    placeholder="e.g., 9876543210"
                    value={form.driverMobile}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Schedule Timeline & Route */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="start-time-input">Start Time (Optional)</label>
                  <input
                    type="time"
                    id="start-time-input"
                    name="startTime"
                    className="form-input"
                    value={form.startTime}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="end-time-input">End Time (Optional)</label>
                  <input
                    type="time"
                    id="end-time-input"
                    name="endTime"
                    className="form-input"
                    value={form.endTime}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="destination-input">Destination / Route (Optional)</label>
                <input
                  type="text"
                  id="destination-input"
                  name="destination"
                  className="form-input"
                  placeholder="e.g., Hotel Hyatt to Airport"
                  value={form.destination}
                  onChange={handleInputChange}
                />
              </div>

              {/* Date & Rent structure */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="vehicle-booking-date">Schedule Date</label>
                  <input
                    type="date"
                    id="vehicle-booking-date"
                    name="bookingDate"
                    className="form-input"
                    value={form.bookingDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="cost-model-select">Billing Rate Model</label>
                  <select
                    id="cost-model-select"
                    name="costModel"
                    className="form-select"
                    value={form.costModel}
                    onChange={handleInputChange}
                  >
                    <option value="daily">Daily Rent</option>
                    <option value="hourly">Hourly Rent</option>
                  </select>
                </div>
              </div>

              {/* Rates and Duration */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="cost-rate-input">
                    Rate per {form.costModel === 'daily' ? 'Day' : 'Hour'} (₹)
                  </label>
                  <input
                    type="number"
                    id="cost-rate-input"
                    name="costRate"
                    className="form-input"
                    min="0"
                    placeholder="0"
                    value={form.costRate || ''}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="duration-input">
                    Duration ({form.costModel === 'daily' ? 'Days' : 'Hours'})
                  </label>
                  <input
                    type="number"
                    id="duration-input"
                    name="duration"
                    className="form-input"
                    step="any"
                    min="0.1"
                    value={form.duration}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              {/* Fuel policy */}
              <div className="form-group">
                <label className="form-label" htmlFor="fuel-policy-select">Fuel Policy</label>
                <select
                  id="fuel-policy-select"
                  name="fuelPolicy"
                  className="form-select"
                  value={form.fuelPolicy}
                  onChange={handleInputChange}
                >
                  <option value="included">Fuel Included in Rent</option>
                  <option value="excluded">Fuel Excluded (Paid Separately)</option>
                </select>
              </div>

              {/* Conditionally show Fuel Cost based on Fuel Policy */}
              {form.fuelPolicy === 'excluded' && (
                <div className="form-group">
                  <label className="form-label" htmlFor="fuel-cost-input" style={{ color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Fuel size={14} /> Diesel / Petrol Cost (₹)
                  </label>
                  <input
                    type="number"
                    id="fuel-cost-input"
                    name="fuelCost"
                    className="form-input"
                    min="0"
                    placeholder="Enter fuel cost spent"
                    value={form.fuelCost || ''}
                    onChange={handleInputChange}
                  />
                </div>
              )}

              {/* Other money parameters */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="other-exp-input">Toll/Other Expenses (₹)</label>
                  <input
                    type="number"
                    id="other-exp-input"
                    name="otherExpenses"
                    className="form-input"
                    min="0"
                    placeholder="0"
                    value={form.otherExpenses || ''}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="rent-payable-input" style={{ color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Rent Pay to Driver/Owner (₹)
                  </label>
                  <input
                    type="number"
                    id="rent-payable-input"
                    name="rentPayable"
                    className="form-input"
                    min="0"
                    placeholder="0"
                    value={form.rentPayable || ''}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div style={{ padding: '0.5rem 0', display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.9rem', borderTop: '1px solid var(--border-color)', margin: '1rem 0' }}>
                <span>Calculated Project Billing:</span>
                <strong style={{ color: 'var(--accent-cyan)' }}>₹{getLiveTotal().toLocaleString('en-IN')}</strong>
              </div>

              {error && <p style={{ color: 'var(--accent-rose)', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}

              <button 
                type="submit" 
                className="btn btn-primary" 
                id="btn-submit-transport"
                disabled={submitting}
                style={{ width: '100%', background: 'linear-gradient(135deg, var(--accent-emerald), var(--accent-cyan))', color: '#0b0f19' }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="spinner" /> Scheduling Vehicle...
                  </>
                ) : (
                  <>
                    <Plus size={16} /> Schedule Vehicle
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Transport Bookings Ledger */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Truck size={20} style={{ color: 'var(--accent-emerald)' }} /> Transport Allocations Ledger
            </h2>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Event Filter */}
              <select
                className="form-select"
                style={{ width: '180px', fontSize: '0.85rem', padding: '0.4rem', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                value={selectedProjectFilter}
                onChange={(e) => setSelectedProjectFilter(e.target.value)}
              >
                <option value="">All Events / Projects</option>
                {projects.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>

              {/* Search Input */}
              <div style={{ position: 'relative', width: '220px' }}>
                <input
                  type="text"
                  id="transport-search-input"
                  className="form-input"
                  placeholder="Search vehicle, driver..."
                  style={{ paddingLeft: '2.5rem', fontSize: '0.85rem' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search size={14} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
              <Loader2 className="spinner" size={32} style={{ color: 'var(--accent-blue)' }} />
            </div>
          ) : filteredBookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
              <Truck size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <p>{searchTerm ? 'No bookings match your search query.' : 'No vehicles scheduled yet.'}</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table" id="transport-bookings-table">
                <thead>
                  <tr>
                    <th>Vehicle Details</th>
                    <th>Driver Info</th>
                    <th>Project</th>
                    <th>Schedule Date</th>
                    <th>Billing Rate</th>
                    <th>Fuel policy</th>
                    <th>Rent Payout</th>
                    <th>Total Cost</th>
                    <th className="no-print" style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((b) => (
                    <tr key={b._id}>
                      <td>
                        <div style={{ fontWeight: '600' }}>{b.vehicleName}</div>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                          <span className="badge badge-info">{b.vehicleNumber}</span>
                          <span className={`badge ${b.ownershipType === 'Owned' ? 'badge-success' : 'badge-info'}`} style={{ textTransform: 'capitalize', fontSize: '0.65rem' }}>
                            {b.ownershipType}
                          </span>
                        </div>
                      </td>
                      <td>
                        {b.driverName ? (
                          <>
                            <div style={{ fontWeight: '500' }}>{b.driverName}</div>
                            {b.driverMobile && (
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '0.15rem' }}>
                                <Phone size={10} style={{ color: 'var(--text-muted)' }} /> {b.driverMobile}
                              </div>
                            )}
                          </>
                        ) : (
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Not Assigned</div>
                        )}
                        {(b.startTime || b.endTime || b.destination) && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.25rem' }}>
                            {b.startTime && <span>🕒 {b.startTime} - {b.endTime || 'End'}</span>}
                            {b.destination && <div style={{ wordBreak: 'break-all', marginTop: '0.1rem' }}>📍 {b.destination}</div>}
                          </div>
                        )}
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
                        <div style={{ fontWeight: '600' }}>
                          ₹{b.costRate.toLocaleString('en-IN')} x {b.duration} {b.costModel === 'daily' ? 'days' : 'hrs'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Base: ₹{(b.costRate * b.duration).toLocaleString('en-IN')}
                        </div>
                      </td>
                      <td>
                        {b.fuelPolicy === 'included' ? (
                          <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Fuel Included</span>
                        ) : (
                          <div>
                            <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>Fuel Excluded</span>
                            <div style={{ fontSize: '0.85rem', color: 'var(--accent-rose)', fontWeight: '600', marginTop: '0.25rem' }}>
                              Diesel: ₹{b.fuelCost.toLocaleString('en-IN')}
                            </div>
                          </div>
                        )}
                        {b.otherExpenses > 0 && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            Toll/Exp: ₹{b.otherExpenses.toLocaleString('en-IN')}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: '600', color: 'var(--accent-amber)' }}>
                          ₹{b.rentPayable.toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Net Profit: ₹{(b.totalCost - b.rentPayable).toLocaleString('en-IN')}
                        </div>
                      </td>
                      <td style={{ fontWeight: '700', color: 'var(--accent-cyan)' }}>
                        ₹{b.totalCost.toLocaleString('en-IN')}
                      </td>
                      <td className="no-print" style={{ textAlign: 'center' }}>
                        <button 
                          onClick={() => handleDelete(b._id)} 
                          className="btn btn-danger btn-icon"
                          title="Delete Record"
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
