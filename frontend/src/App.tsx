import { useEffect, useState, type FormEvent } from 'react';
import axios from 'axios';
import { Ticket } from './types';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthForms from './components/AuthForms';
import ResetPassword from './components/ResetPassword';
import { apiUrl } from './config';
import {
  PlusCircle, 
  CheckCircle, 
  Clock, 
  ShieldAlert, 
  Activity, 
  CheckSquare, 
  Filter, 
  LogOut, 
  User as UserIcon, 
  Shield,
  Ticket as TicketIcon,
  X,
  BookOpen,
  Clock3,
  Mail,
  Pencil,
  Trash2
} from 'lucide-react';

const API_URL = apiUrl('/api/tickets');

interface Metrics {
  total: number;
  open: number;
  critical: number;
  resolved: number;
  slaBreachRate: string;
  manualTriageReduction: string;
  monthly: ComplaintPeriod[];
  yearly: ComplaintPeriod[];
}

interface ComplaintPeriod {
  period: string;
  user_name: string;
  complaint_count: number;
}

function ComplaintBreakdown({ title, rows }: { title: string; rows: ComplaintPeriod[] }) {
  return (
    <section className="bg-[#1E293B]/80 backdrop-blur-md rounded-2xl border border-slate-700/60 shadow-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700/60">
        <h2 className="text-sm font-bold text-slate-100">{title}</h2>
        <p className="text-[11px] text-slate-400 mt-1">Complaint count grouped by registered user email</p>
      </div>
      {rows.length === 0 ? (
        <p className="p-4 text-xs text-slate-400">No complaint data available yet.</p>
      ) : (
        <div className="max-h-64 overflow-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-900/95 text-slate-400">
              <tr>
                <th className="px-4 py-2 font-semibold">Period</th>
                <th className="px-4 py-2 font-semibold">User</th>
                <th className="px-4 py-2 text-right font-semibold">Complaints</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.period}-${row.user_name}`} className="border-t border-slate-700/40 text-slate-300">
                  <td className="px-4 py-2.5 whitespace-nowrap">{row.period}</td>
                  <td className="px-4 py-2.5 break-all">{row.user_name}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-indigo-300">{row.complaint_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function TicketDashboard() {
  const { user, token, logout } = useAuth();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    total: 0, open: 0, critical: 0, resolved: 0, slaBreachRate: '0%', manualTriageReduction: '90%', monthly: [], yearly: []
  });
  
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [editingTicketId, setEditingTicketId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingDescription, setEditingDescription] = useState('');

  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };

  const fetchData = async () => {
    if (!token) return;
    try {
      const ticketsRes = await axios.get(API_URL, axiosConfig);
      const ticketData = Array.isArray(ticketsRes.data) ? ticketsRes.data : ticketsRes.data.data;
      setTickets(ticketData || []);

      if (user?.role === 'ADMIN') {
        const metricsRes = await axios.get(`${API_URL}/metrics`, axiosConfig);
        if (metricsRes.data?.data) {
          setMetrics(metricsRes.data.data);
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, token]);

  useEffect(() => {
    if (!token || user?.role !== 'ADMIN') return;

    const refreshDashboard = () => {
      if (document.visibilityState === 'visible') fetchData();
    };
    const intervalId = window.setInterval(refreshDashboard, 10000);
    document.addEventListener('visibilitychange', refreshDashboard);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', refreshDashboard);
    };
  }, [token, user?.role]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    setLoading(true);
    setFormError(null);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      if (attachment) formData.append('attachment', attachment);
      await axios.post(API_URL, formData, axiosConfig);
      setTitle('');
      setDescription('');
      setAttachment(null);
      await fetchData();
      setShowSuccessPopup(true);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Could not register the complaint.';
      setFormError(message);
      console.error('Error creating ticket:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      await axios.patch(`${API_URL}/${id}/status`, { status }, axiosConfig);
      await fetchData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Could not update ticket status.');
      console.error('Error updating status:', err);
    }
  };

  const canModifyTicket = (createdAt: string, hours: number) =>
    Date.now() - new Date(createdAt).getTime() <= hours * 60 * 60 * 1000;

  const startEditing = (ticket: Ticket) => {
    setEditingTicketId(ticket.id);
    setEditingTitle(ticket.title);
    setEditingDescription(ticket.description);
    setFormError(null);
  };

  const cancelEditing = () => {
    setEditingTicketId(null);
    setEditingTitle('');
    setEditingDescription('');
  };

  const handleTicketEdit = async (id: number) => {
    if (!editingTitle.trim() || !editingDescription.trim()) {
      setFormError('Title and description are required.');
      return;
    }

    try {
      await axios.patch(`${API_URL}/${id}`, {
        title: editingTitle,
        description: editingDescription
      }, axiosConfig);
      cancelEditing();
      await fetchData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Could not edit complaint.');
      console.error('Error editing ticket:', err);
    }
  };

  const handleTicketDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this complaint?')) return;

    try {
      await axios.delete(`${API_URL}/${id}`, axiosConfig);
      await fetchData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Could not delete complaint.');
      console.error('Error deleting ticket:', err);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-300';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-green-100 text-green-800 border-green-300';
    }
  };

  const filteredTickets = tickets.filter(t => {
    const priorityMatch = selectedPriority === 'ALL' || t.priority === selectedPriority;
    const statusMatch = selectedStatus === 'ALL' || t.status === selectedStatus;
    return priorityMatch && statusMatch;
  });

  return (
    <div className="min-h-[100dvh] w-full bg-[#0A0A0B] text-slate-100 p-4 md:p-6 font-[Helvetica,Arial,sans-serif]">
      {showSuccessPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-emerald-400/30 bg-[#1E293B] p-7 text-center shadow-2xl">
            <button
              type="button"
              onClick={() => setShowSuccessPopup(false)}
              aria-label="Close confirmation"
              className="absolute right-4 top-4 text-slate-400 transition-colors hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15">
              <CheckCircle className="h-7 w-7 text-emerald-400" />
            </div>
            <h2 className="text-lg font-bold text-white">Complaint Registered Successfully</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Thank you for registering your complaint. Our team will review it and get back to you as soon as possible.
            </p>
            <button
              type="button"
              onClick={() => setShowSuccessPopup(false)}
              className="mt-6 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
            >
              Continue
            </button>
          </div>
        </div>
      )}
      <div className="w-full min-h-[calc(100dvh-3rem)] space-y-6">
        
        {/* Header Navigations */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#1E293B]/80 backdrop-blur-md p-5 rounded-2xl border border-slate-700/60 shadow-lg gap-4">
          <div>
            <div className="inline-flex items-center px-3 py-1 rounded-xl bg-indigo-600/20 text-indigo-400 font-bold text-sm tracking-tight border border-indigo-500/30 mb-1">
              Support<span className="text-emerald-400">IQ</span>
            </div>
            <p className="text-xs text-slate-400">Automated Support & Ticketing Engine</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-700">
              <UserIcon className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-slate-200">{user?.email}</span>
              <span className="inline-flex items-center gap-1 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-indigo-500/30">
                <Shield className="w-3 h-3 text-indigo-400" />
                {user?.role}
              </span>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-1.5 bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors shadow-sm cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Admin Analytics Grid */}
        {user?.role === 'ADMIN' && (
          <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#1E293B]/80 backdrop-blur-md p-4 rounded-2xl border border-slate-700/60 shadow-lg flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400">Total Tickets</p>
                <h3 className="text-2xl font-bold text-slate-100">{metrics.total}</h3>
              </div>

              <Activity className="w-7 h-7 text-indigo-400 opacity-80" />
            </div>

            <div className="bg-[#1E293B]/80 backdrop-blur-md p-4 rounded-2xl border border-slate-700/60 shadow-lg flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400">Open Issues</p>
                <h3 className="text-2xl font-bold text-amber-400">{metrics.open}</h3>
              </div>
              <Clock className="w-7 h-7 text-amber-400 opacity-80" />
            </div>

            <div className="bg-[#1E293B]/80 backdrop-blur-md p-4 rounded-2xl border border-slate-700/60 shadow-lg flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400">Critical Priority</p>
                <h3 className="text-2xl font-bold text-rose-400">{metrics.critical}</h3>
              </div>
              <ShieldAlert className="w-7 h-7 text-rose-400 opacity-80" />
            </div>

            <div className="bg-[#1E293B]/80 backdrop-blur-md p-4 rounded-2xl border border-slate-700/60 shadow-lg flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400">Resolved</p>
                <h3 className="text-2xl font-bold text-emerald-400">{metrics.resolved}</h3>
              </div>
              <CheckSquare className="w-7 h-7 text-emerald-400 opacity-80" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ComplaintBreakdown title="Monthly complaints by user" rows={metrics.monthly} />
            <ComplaintBreakdown title="Yearly complaints by user" rows={metrics.yearly} />
          </div>
          </>
        )}

        {/* Main Content View */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Submit Issue Card (Users only) */}
          {user?.role === 'USER' && (
          <div className="lg:col-span-1 space-y-4">
          <div className="bg-[#1E293B]/80 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-slate-700/60 h-fit">
            <h2 className="text-lg font-bold mb-4 text-slate-100 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-indigo-400" />
              Submit Issue
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Issue Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Payment Gateway Error"
                  required
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none border-slate-700 text-xs text-slate-100 placeholder-slate-500 bg-slate-900/60"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Detailed Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain the bug or issue..."
                  rows={4}
                  required
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none border-slate-700 text-xs text-slate-100 placeholder-slate-500 bg-slate-900/60"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Screenshot or file (optional, max 5 MB)</label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-indigo-700"
                />
                {attachment && <p className="mt-1 text-[11px] text-slate-400">Selected: {attachment.name}</p>}
              </div>

              {formError && <p className="text-xs text-rose-400">{formError}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50 text-xs cursor-pointer shadow-sm"
              >
                {loading ? 'Categorizing via LLM...' : 'Submit Ticket'}
              </button>
            </form>
          </div>
          </div>
          )}

          {/* Tickets Stream and Filtering */}
          <div className={`${user?.role === 'USER' ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-4 min-h-0`}>
            
            {/* Filters Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-[#1E293B]/80 backdrop-blur-md p-4 rounded-2xl border border-slate-700/60 shadow-lg">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-300">Filter Tickets</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select 
                  value={selectedPriority} 
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="text-xs bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-1.5 outline-none font-medium text-slate-300"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>

                <select 
                  value={selectedStatus} 
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="text-xs bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-1.5 outline-none font-medium text-slate-300"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="REJECTED">Not Genuine</option>
                </select>
              </div>
            </div>

            {/* Ticket Stream List */}
            {filteredTickets.length === 0 ? (
              <div className="bg-[#1E293B]/80 backdrop-blur-md p-10 text-center rounded-2xl border border-slate-700/60 text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                <TicketIcon className="w-8 h-8 text-slate-500" />
                <p>No support tickets found matching your filter selections.</p>
              </div>
            ) : (
              <div className="max-h-[calc(100vh-25rem)] min-h-[20rem] overflow-y-auto space-y-4 pr-1">
              {filteredTickets.map((ticket) => (
                <div key={ticket.id} className="bg-[#1E293B]/80 backdrop-blur-md p-5 rounded-2xl shadow-lg border border-slate-700/60 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    {editingTicketId === ticket.id ? (
                      <input
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm font-bold text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    ) : (
                      <h3 className="font-bold text-slate-100 text-sm">{ticket.title}</h3>
                    )}
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </div>

                  {editingTicketId === ticket.id ? (
                    <textarea
                      value={editingDescription}
                      onChange={(e) => setEditingDescription(e.target.value)}
                      rows={4}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs leading-relaxed text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  ) : (
                    <p className="text-slate-300 text-xs leading-relaxed">{ticket.description}</p>
                  )}

                  {ticket.attachment_url && (
                    <a
                      href={ticket.attachment_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex text-xs text-sky-400 hover:text-sky-300 underline"
                    >
                      View attachment: {ticket.attachment_name || 'file'}
                    </a>
                  )}

                  <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-700/50 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium bg-slate-900/60 text-slate-300 px-2.5 py-1 rounded-lg text-[10px] border border-slate-700">
                        Category: {ticket.category || 'General'}
                      </span>
                      <span className={`flex items-center gap-1 font-semibold text-[11px] ${ticket.status === 'REJECTED' ? 'text-rose-400' : ticket.status === 'RESOLVED' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        <CheckCircle className="w-3.5 h-3.5" />
                        {ticket.status}
                      </span>
                    </div>

                    {user?.role === 'ADMIN' && !['RESOLVED', 'REJECTED'].includes(ticket.status) && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleStatusUpdate(ticket.id, 'RESOLVED')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] px-3 py-1 rounded-lg transition-colors font-semibold cursor-pointer shadow-sm"
                        >
                          Mark Resolved
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(ticket.id, 'REJECTED')}
                          className="bg-rose-600 hover:bg-rose-700 text-white text-[11px] px-3 py-1 rounded-lg transition-colors font-semibold cursor-pointer shadow-sm"
                        >
                          Mark Not Genuine
                        </button>
                      </div>
                    )}
                    {user?.role === 'USER' && editingTicketId === ticket.id && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleTicketEdit(ticket.id)}
                          className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-indigo-700"
                        >
                          <Pencil className="h-3 w-3" /> Save Changes
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="flex items-center gap-1 rounded-lg bg-slate-600 px-3 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-slate-500"
                        >
                          <X className="h-3 w-3" /> Cancel
                        </button>
                      </div>
                    )}
                    {user?.role === 'USER' && editingTicketId !== ticket.id && (
                      <div className="flex flex-wrap gap-2">
                        {canModifyTicket(ticket.created_at, 12) && (
                          <button
                            onClick={() => startEditing(ticket)}
                            className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-indigo-700"
                          >
                            <Pencil className="h-3 w-3" /> Edit
                          </button>
                        )}
                        {canModifyTicket(ticket.created_at, 24) && (
                          <button
                            onClick={() => handleTicketDelete(ticket.id)}
                            className="flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-rose-700"
                          >
                            <Trash2 className="h-3 w-3" /> Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              </div>
            )}
          </div>

        </div>

        {user?.role === 'USER' && (
          <section className="w-full bg-[#1E293B]/80 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-slate-700/60">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-400" />
              Knowledge Base / Quick Help
            </h2>
            <div className="mt-5 grid grid-cols-1 gap-2 md:grid-cols-2">
              <details className="group rounded-xl border border-slate-700/60 bg-slate-900/40 p-4">
                <summary className="cursor-pointer list-none pr-4 text-xs font-bold text-slate-200 group-open:text-emerald-300">How long does resolution take?</summary>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-400">Most complaints are reviewed within 1-2 business days.</p>
              </details>
              <details className="group rounded-xl border border-slate-700/60 bg-slate-900/40 p-4">
                <summary className="cursor-pointer list-none pr-4 text-xs font-bold text-slate-200 group-open:text-emerald-300">How can I upload logs?</summary>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-400">Attach screenshots, PDFs, or supported log files while submitting your complaint.</p>
              </details>
              <details className="group rounded-xl border border-slate-700/60 bg-slate-900/40 p-4">
                <summary className="cursor-pointer list-none pr-4 text-xs font-bold text-slate-200 group-open:text-emerald-300">How do I track my complaint?</summary>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-400">Your submitted complaints and their latest status appear in the ticket list.</p>
              </details>
              <details className="group rounded-xl border border-slate-700/60 bg-slate-900/40 p-4">
                <summary className="cursor-pointer list-none pr-4 text-xs font-bold text-slate-200 group-open:text-emerald-300">What information should I include?</summary>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-400">Include the issue details, steps to reproduce it, and any relevant error messages.</p>
              </details>
            </div>
            <div className="mt-5 flex flex-col gap-3 border-t border-slate-700/60 pt-4 text-xs sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-slate-300">
                <Clock3 className="w-4 h-4 text-amber-400" />
                <span><strong className="text-slate-100">Support hours:</strong> Mon-Sat, 10 AM - 6 PM</span>
              </div>
              <a href="mailto:nishadabhay549@gmail.com" className="flex items-center gap-2 text-sky-400 transition-colors hover:text-sky-300">
                <Mail className="w-4 h-4" />
                <span><strong className="text-slate-100">Reach out to us:</strong> nishadabhay549@gmail.com</span>
              </a>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}

function MainAppLayout() {
  const { user } = useAuth();

  const queryParams = new URLSearchParams(window.location.search);
  if (window.location.pathname === '/reset-password' || queryParams.has('token')) {
    return <ResetPassword />;
  }

  if (!user) {
    return <AuthForms />;
  }

  return <TicketDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppLayout />
    </AuthProvider>
  );
}
