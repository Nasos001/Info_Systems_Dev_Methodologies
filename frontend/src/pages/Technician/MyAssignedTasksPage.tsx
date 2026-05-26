import { useEffect, useState } from 'react';
import { Wrench, Clock, CheckCircle, AlertCircle, MapPin, Calendar, Loader2 } from 'lucide-react';
import apiClient from '../../api/client';

type ReportStatus = 'NEW' | 'REJECTED' | 'DUPLICATE' | 'ONGOING' | 'COMPLETED';

interface TechReport {
  id: number;
  address: string;
  description: string;
  status: ReportStatus;
  image_path: string;
  created_at: string;
}

const statusConfig: Record<ReportStatus, { label: string; color: string }> = {
  NEW:       { label: 'New',       color: 'bg-blue-100 text-blue-700' },
  ONGOING:   { label: 'Ongoing',   color: 'bg-amber-100 text-amber-700' },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-700' },
  REJECTED:  { label: 'Rejected',  color: 'bg-red-100 text-red-700' },
  DUPLICATE: { label: 'Duplicate', color: 'bg-slate-100 text-slate-600' },
};

// Status options a technician is allowed to set
const statusOptions: ReportStatus[] = ['NEW', 'ONGOING', 'COMPLETED', 'REJECTED', 'DUPLICATE'];

const getImageUrl = (filename: string) =>
  `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api'}/files/${filename}`;

const MyAssignedTasksPage = () => {
  const [tasks, setTasks] = useState<TechReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await apiClient.get('/tech/my-reports');
        setTasks(Array.isArray(res.data) ? res.data : []);
      } catch {
        setError('Could not load tasks. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    if (!newStatus) return;
    setUpdatingId(taskId);
    try {
      await apiClient.patch(`/tech/report/${taskId}/status`, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => t.id === taskId ? { ...t, status: newStatus as ReportStatus } : t)
      );
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Status update failed.');
    } finally {
      setUpdatingId(null);
    }
  };

  const total    = tasks.length;
  const ongoing  = tasks.filter((t) => t.status === 'ONGOING').length;
  const completed = tasks.filter((t) => t.status === 'COMPLETED').length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <Wrench size={20} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Assigned Tasks</h1>
            <p className="text-sm text-slate-500">Issues assigned to you for resolution</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Assigned',  value: total,     icon: Wrench,      bg: 'bg-blue-50',  text: 'text-blue-600' },
            { label: 'Ongoing',   value: ongoing,   icon: Clock,       bg: 'bg-amber-50', text: 'text-amber-600' },
            { label: 'Completed', value: completed, icon: CheckCircle, bg: 'bg-green-50', text: 'text-green-600' },
          ].map(({ label, value, icon: Icon, bg, text }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center mb-3`}>
                <Icon size={18} className={text} />
              </div>
              <p className="text-2xl font-bold text-slate-800">{loading ? '—' : value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 flex gap-4 animate-pulse">
                <div className="w-16 h-16 bg-slate-100 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-slate-100 rounded w-2/3" />
                  <div className="h-3 bg-slate-100 rounded w-full" />
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex items-center gap-2.5 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && tasks.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-14 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
              <Wrench size={28} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-1">No tasks assigned yet</h3>
            <p className="text-sm text-slate-400 max-w-sm">
              You have no assigned reports at the moment. Check back later.
            </p>
          </div>
        )}

        {/* Task list */}
        {!loading && !error && tasks.length > 0 && (
          <div className="space-y-4">
            {tasks.map((task) => {
              const st = statusConfig[task.status] ?? { label: task.status, color: 'bg-slate-100 text-slate-600' };
              return (
                <div key={task.id} className="bg-white rounded-2xl border border-slate-100 p-5">
                  <div className="flex gap-4">
                    {/* Thumbnail */}
                    <img
                      src={getImageUrl(task.image_path)}
                      alt="Task"
                      className="w-16 h-16 rounded-xl object-cover shrink-0 bg-slate-100"
                      onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }}
                    />
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                        <p className="font-semibold text-slate-900 text-sm truncate">{task.address}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${st.color}`}>
                          {st.label}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 line-clamp-2 mb-3">{task.description}</p>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Calendar size={11} />
                          {new Date(task.created_at).toLocaleDateString('en-GB', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })}
                          <span className="text-slate-300">·</span>
                          <MapPin size={11} />
                          <span>Report #{task.id}</span>
                        </div>
                        {/* Status update dropdown */}
                        <div className="relative">
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task.id, e.target.value)}
                            disabled={updatingId === task.id}
                            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-600 disabled:opacity-50 appearance-none cursor-pointer pr-6"
                          >
                            {statusOptions.map((s) => (
                              <option key={s} value={s}>{statusConfig[s].label}</option>
                            ))}
                          </select>
                          {updatingId === task.id && (
                            <Loader2 size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

export default MyAssignedTasksPage;
