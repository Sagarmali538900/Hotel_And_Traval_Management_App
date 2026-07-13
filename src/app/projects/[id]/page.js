'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  Building, 
  Truck, 
  ChevronLeft, 
  Printer, 
  Calendar, 
  FileText, 
  User, 
  DollarSign, 
  Phone,
  Briefcase,
  Loader2,
  Trash2,
  CheckCircle
} from 'lucide-react';

export default function ProjectDetail() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

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

  useEffect(() => {
    if (id) {
      fetchProjectDetails();
    }
  }, [id]);

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
      } else {
        alert('Failed to update project status');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating project status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 className="spinner" size={40} style={{ color: 'var(--accent-blue)', marginBottom: '1rem' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Compiling consolidated billing ledger...</p>
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

  const { project, hotelBookings, transportBookings, totalHotelCost, totalTransportCost, grandTotal } = data;

  return (
    <div>
      {/* Top action header bar */}
      <div className="page-header no-print">
        <div>
          <Link href="/" className="btn btn-secondary btn-icon" style={{ marginBottom: '1rem' }} id="btn-back-dashboard">
            <ChevronLeft size={16} /> Back to Dashboard
          </Link>
          <h1 className="page-title">Consolidated Billing Ledger</h1>
          <p className="page-subtitle">View detailed breakdown of hotel and transport expenses for {project.name}.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={handleToggleStatus} 
            className="btn btn-secondary"
            disabled={updatingStatus}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <CheckCircle size={16} style={{ color: project.status === 'Active' ? 'var(--text-muted)' : 'var(--accent-emerald)' }} />
            {project.status === 'Active' ? 'Mark Completed' : 'Reopen Project'}
          </button>
          <button 
            onClick={handlePrint} 
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            id="btn-print-invoice"
          >
            <Printer size={16} /> Print Bill
          </button>
        </div>
      </div>

      {/* Invoice Layout */}
      <div className="invoice-container">
        {/* Invoice Top Header */}
        <div className="invoice-header">
          <div className="invoice-header-left">
            <div className="nav-brand" style={{ fontSize: '1.75rem', marginBottom: '1.5rem', pointerEvents: 'none' }}>
              Hotel & Transport Hub
            </div>
            
            <div className="invoice-title">INVOICE</div>
            
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

        {/* Invoice Body Content */}
        <div className="invoice-body">
          {/* Section 1: Hotel Bookings */}
          <div className="invoice-section">
            <h3 className="invoice-section-title">
              <Building size={18} style={{ color: 'var(--accent-blue)' }} /> 
              1. Hotel Lodging Expenses
            </h3>
            
            {hotelBookings.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1rem 0' }}>
                No hotel allocations or lodging charges registered for this project ledger.
              </p>
            ) : (
              <div className="table-container" style={{ border: 'none' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ paddingLeft: 0 }}>Hotel Name</th>
                      <th>Room Assigned</th>
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
                          {b.notes && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal', marginTop: '0.25rem' }}>{b.notes}</div>}
                        </td>
                        <td>
                          <span className="badge badge-info">{b.roomNumber}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                            <Calendar size={12} style={{ color: 'var(--text-muted)' }} />
                            {new Date(b.bookingDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                        </td>
                        <td>{b.daysUsed} {b.daysUsed === 1 ? 'day' : 'days'}</td>
                        <td>₹{b.roomCostPerDay.toLocaleString('en-IN')}</td>
                        <td style={{ textAlign: 'right', paddingRight: 0, fontWeight: '600' }}>
                          ₹{b.totalCost.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan="5" style={{ borderBottom: 'none', paddingLeft: 0, fontWeight: '700', fontSize: '0.95rem' }}>
                        Hotel Total Expenditure
                      </td>
                      <td style={{ borderBottom: 'none', textAlign: 'right', paddingRight: 0, fontWeight: '800', fontSize: '1.1rem', color: 'var(--accent-blue)' }}>
                        ₹{totalHotelCost.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 2: Transport Bookings */}
          <div className="invoice-section" style={{ marginTop: '3rem' }}>
            <h3 className="invoice-section-title">
              <Truck size={18} style={{ color: 'var(--accent-emerald)' }} /> 
              2. Vehicle & Transport Logistics
            </h3>

            {transportBookings.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1rem 0' }}>
                No vehicle allocations or logistics charges registered for this project ledger.
              </p>
            ) : (
              <div className="table-container" style={{ border: 'none' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ paddingLeft: 0 }}>Vehicle & Driver</th>
                      <th>Schedule Date</th>
                      <th>Rate & Duration</th>
                      <th>Fuel Policy & Cost</th>
                      <th>Other Tolls</th>
                      <th style={{ textAlign: 'right', paddingRight: 0 }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transportBookings.map((b) => (
                      <tr key={b._id}>
                        <td style={{ paddingLeft: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>{b.vehicleName}</span>
                            <span className={`badge ${b.ownershipType === 'Owned' ? 'badge-success' : 'badge-info'}`} style={{ textTransform: 'capitalize', fontSize: '0.6rem', padding: '0.15rem 0.5rem' }}>
                              {b.ownershipType}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            Plate: <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{b.vehicleNumber}</span>
                            {b.driverName && (
                              <>
                                {' '}| Driver: <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{b.driverName}</span>
                                {b.driverMobile && <span> ({b.driverMobile})</span>}
                              </>
                            )}
                          </div>
                          {(b.startTime || b.endTime || b.destination) && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                              {b.startTime && <span>🕒 {b.startTime} - {b.endTime || 'End'}</span>}
                              {b.destination && <span> | 📍 {b.destination}</span>}
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                            <Calendar size={12} style={{ color: 'var(--text-muted)' }} />
                            {new Date(b.bookingDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                        </td>
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
                              <div style={{ fontSize: '0.85rem', color: 'var(--accent-rose)', fontWeight: '600', marginTop: '0.25rem' }}>
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
                        Transport Total Expenditure
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

          {/* Section 3: Financial Summary Card */}
          <div className="invoice-summary">
            <div className="invoice-summary-grid">
              <div className="summary-row">
                <span style={{ color: 'var(--text-secondary)' }}>Hotel Lodging:</span>
                <span>₹{totalHotelCost.toLocaleString('en-IN')}</span>
              </div>
              <div className="summary-row">
                <span style={{ color: 'var(--text-secondary)' }}>Transport & Fleet:</span>
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
    </div>
  );
}
