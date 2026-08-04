'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building, 
  Truck, 
  Train,
  Plus, 
  ArrowRight, 
  Briefcase, 
  User, 
  Trash2, 
  DollarSign, 
  ExternalLink,
  Loader2 
} from 'lucide-react';

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newProject, setNewProject] = useState({ name: '', clientName: '' });
  const [error, setError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Stats variables including trains
  const [stats, setStats] = useState({
    activeProjects: 0,
    roomsCount: 0,
    vehiclesCount: 0,
    trainsCount: 0,
    totalSpend: 0
  });

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/projects');
      const json = await res.json();
      if (json.success) {
        setProjects(json.data);
        calculateStats(json.data);
      }
    } catch (err) {
      console.error('Error loading projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const calculateStats = (projList) => {
    let active = 0;
    let rooms = 0;
    let vehicles = 0;
    let trains = 0;
    let total = 0;

    projList.forEach(p => {
      if (p.status === 'Active') active++;
      rooms += p.roomsCount || 0;
      vehicles += p.vehiclesCount || 0;
      trains += p.trainsCount || 0;
      total += p.totalCost || 0;
    });

    setStats({
      activeProjects: active,
      roomsCount: rooms,
      vehiclesCount: vehicles,
      trainsCount: trains,
      totalSpend: total
    });
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProject.name.trim() || !newProject.clientName.trim()) {
      setError('Both fields are required');
      return;
    }
    
    try {
      setFormSubmitting(true);
      setError('');
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject)
      });
      const json = await res.json();
      if (json.success) {
        setNewProject({ name: '', clientName: '' });
        fetchProjects();
      } else {
        setError(json.error || 'Failed to create project');
      }
    } catch (err) {
      setError('Something went wrong. Please check connection.');
      console.error(err);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteProject = async (id, name) => {
    if (!confirm(`Are you sure you want to delete project "${name}"?\nThis will permanently delete all associated hotel, transport, and train bookings.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        fetchProjects();
      } else {
        alert(json.error || 'Failed to delete project');
      }
    } catch (err) {
      alert('Failed to delete project. Please try again.');
      console.error(err);
    }
  };

  return (
    <div>
      {/* Hero Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 className="page-title" id="main-dashboard-title">Unified Project Console</h1>
        <p className="page-subtitle">Track room allocations, vehicle scheduling, guest train arrivals, and consolidated billing.</p>
      </div>

      {/* KPI Stats Section */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1.5rem',
          marginBottom: '2.5rem'
        }}
      >
        <div className="card">
          <div className="stat-item">
            <span className="stat-val" style={{ color: 'var(--accent-blue)' }}>{stats.activeProjects}</span>
            <span className="stat-lbl">Active Projects</span>
          </div>
        </div>
        <div className="card">
          <div className="stat-item">
            <span className="stat-val" style={{ color: 'var(--accent-cyan)' }}>{stats.roomsCount}</span>
            <span className="stat-lbl">Rooms Assigned</span>
          </div>
        </div>
        <div className="card">
          <div className="stat-item">
            <span className="stat-val" style={{ color: 'var(--accent-emerald)' }}>{stats.vehiclesCount}</span>
            <span className="stat-lbl">Vehicles Scheduled</span>
          </div>
        </div>
        <div className="card">
          <div className="stat-item">
            <span className="stat-val" style={{ color: 'var(--accent-violet)' }}>{stats.trainsCount}</span>
            <span className="stat-lbl">Trains Tracked</span>
          </div>
        </div>
        <div className="card">
          <div className="stat-item">
            <span className="stat-val stat-val-cost">₹{stats.totalSpend.toLocaleString('en-IN')}</span>
            <span className="stat-lbl">Total Consolidated Spend</span>
          </div>
        </div>
      </div>

      {/* Main Apps Selection */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {/* Hotel Hub Link */}
        <div className="card hero-card hero-card-hotel card-glow">
          <div className="hero-content">
            <div className="hero-icon-container">
              <Building size={24} />
            </div>
            <h2 className="hero-title">Hotel Allocation</h2>
            <p className="hero-desc">
              Assign rooms, track occupancy dates, log nightly prices, and check out room invoices automatically.
            </p>
          </div>
          <Link href="/hotels" className="btn btn-primary" id="btn-goto-hotels" style={{ width: '100%', marginTop: '1rem' }}>
            Go to Hotels <ArrowRight size={16} />
          </Link>
        </div>

        {/* Transport Hub Link */}
        <div className="card hero-card hero-card-transport card-glow">
          <div className="hero-content">
            <div className="hero-icon-container">
              <Truck size={24} />
            </div>
            <h2 className="hero-title">Transport Scheduler</h2>
            <p className="hero-desc">
              Manage vehicle rates (hourly/daily), organize driver logs, track diesel costs vs. rent-policy setups.
            </p>
          </div>
          <Link href="/transport" className="btn btn-primary" id="btn-goto-transport" style={{ 
            width: '100%',
            marginTop: '1rem',
            background: 'linear-gradient(135deg, var(--accent-emerald), var(--accent-cyan))',
            color: '#0b0f19'
          }}>
            Go to Transport <ArrowRight size={16} />
          </Link>
        </div>

        {/* Train Hub Link */}
        <div className="card hero-card card-glow" style={{ position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '220px' }}>
          <div className="hero-content">
            <div className="hero-icon-container" style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-violet)' }}>
              <Train size={24} />
            </div>
            <h2 className="hero-title">Train Coordination</h2>
            <p className="hero-desc">
              Monitor guest train arrival timings, passenger quantities, pickup drivers, and modify schedule histories.
            </p>
          </div>
          <Link href="/trains" className="btn btn-primary" id="btn-goto-trains" style={{ 
            width: '100%',
            marginTop: '1rem',
            background: 'linear-gradient(135deg, var(--accent-violet), var(--accent-blue))',
            color: '#0b0f19'
          }}>
            Go to Trains <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Projects Management Section */}
      <div>
        <h2 className="section-title">
          <Briefcase size={20} style={{ color: 'var(--accent-blue)' }} /> Project Ledgers & Billing
        </h2>
        
        <div className="panel-grid">
          {/* Create Project Form */}
          <div className="card">
            <h3 style={{ marginBottom: '1.25rem', fontFamily: 'var(--font-heading)', fontWeight: '600' }}>New Project Ledger</h3>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label className="form-label" htmlFor="project-name-input">Project Identifier</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    id="project-name-input"
                    className="form-input"
                    placeholder="e.g., Highway Expansion Phase 1"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="client-name-input">Client Representative</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    id="client-name-input"
                    className="form-input"
                    placeholder="e.g., L&T Infra Corp"
                    value={newProject.clientName}
                    onChange={(e) => setNewProject({ ...newProject, clientName: e.target.value })}
                    required
                  />
                </div>
              </div>
              {error && <p style={{ color: 'var(--accent-rose)', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}
              <button 
                type="submit" 
                className="btn btn-primary" 
                id="btn-submit-project"
                disabled={formSubmitting}
                style={{ width: '100%' }}
              >
                {formSubmitting ? (
                  <>
                    <Loader2 size={16} className="spinner" /> Creating...
                  </>
                ) : (
                  <>
                    <Plus size={16} /> Create Project
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Project List */}
          <div>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                <Loader2 size={32} className="spinner" style={{ color: 'var(--accent-blue)' }} />
              </div>
            ) : projects.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                <Briefcase size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                <p>No active project ledgers found. Create one on the left to start assigning resources.</p>
              </div>
            ) : (
              <div className="project-grid">
                {projects.map((project) => (
                  <div key={project._id} className="card project-card">
                    <div>
                      <div className="project-card-header">
                        <div>
                          <h3 className="project-name">{project.name}</h3>
                          <p className="project-client">
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <User size={12} /> {project.clientName}
                            </span>
                          </p>
                        </div>
                        <span className={`badge ${project.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                          {project.status}
                        </span>
                      </div>

                      <div className="project-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                        <div className="stat-item">
                          <span className="stat-val">{project.roomsCount}</span>
                          <span className="stat-lbl">Rooms</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-val">{project.vehiclesCount}</span>
                          <span className="stat-lbl">Vehicles</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-val">{project.trainsCount}</span>
                          <span className="stat-lbl">Trains</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="stat-item">
                          <span className="stat-val stat-val-cost" style={{ fontSize: '1.15rem' }}>₹{project.totalCost.toLocaleString('en-IN')}</span>
                          <span className="stat-lbl">Consolidated Cost</span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                        <Link 
                          href={`/projects/${project._id}`} 
                          className="btn btn-primary"
                          id={`btn-open-portal-${project._id}`}
                          style={{ 
                            flexGrow: 1, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            gap: '6px', 
                            fontSize: '0.8rem',
                            background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))',
                            color: '#0b0f19',
                            padding: '0.5rem 1rem'
                          }}
                        >
                          <ExternalLink size={14} /> Open Event Portal
                        </Link>
                        <button 
                          onClick={() => handleDeleteProject(project._id, project.name)} 
                          className="btn btn-danger btn-icon"
                          title="Delete Project Ledger"
                          style={{ 
                            width: '38px', 
                            height: '38px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
