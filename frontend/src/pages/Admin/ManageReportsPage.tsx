import { useEffect, useState } from 'react';
import {
  ClipboardList, Clock, CheckCircle, AlertTriangle,
  TrendingUp, UserCheck, AlertCircle, Loader2, ImageOff,
} from 'lucide-react';
import apiClient from '../../api/client';

type ReportStatus = 'NEW' | 'REJECTED' | 'DUPLICATE' | 'ONGOING' | 'COMPLETED';

interface Category {
  id: number;
  name: string;
}

interface AdminReport {
  id: number;
  user_id: number;
  category_id: number;
  address: string;
  description: string;
  status: ReportStatus;
  image_path: string | null;
  assigned_tech_id: number | null;
  created_at: string;
}

interface Technician {
  id: number;
  full_name: string;
  email: string;
}

const statusConfig: Record<ReportStatus, { label: string; color: string }> = {
  NEW:       { label: 'New',       color: 'bg-blue-100 text-blue-700' },
  ONGOING:   { label: 'Ongoing',   color: 'bg-amber-100 text-amber-700' },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-700' },
  REJECTED:  { label: 'Rejected',  color: 'bg-red-100 text-red-700' },
  DUPLICATE: { label: 'Duplicate', color: 'bg-slate-100 text-slate-600' },
};

const getImageUrl = (filename: string) =>
  `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api'}/files/${filename}`;

const ManageReportsPage = () => {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assigning, setAssigning] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reportsRes, techsRes, catsRes] = await Promise.all([
          apiClient.get('/admin/reports'),
          apiClient.get('/admin/technicians'),
          apiClient.get('/categories'),
        ]);
        setReports(Array.isArray(reportsRes.data) ? reportsRes.data : []);
        setTechnicians(Array.isArray(techsRes.data) ? techsRes.data : []);
        setCategories(Array.isArray(catsRes.data) ? catsRes.data : []);
      } catch {
        setError('Could not load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getCategoryName = (id: number): string => {
    const cat = categories.find((c) => c.id === id);
    return cat ? cat.name : `Category ID: ${id}`;
  };

  const handleAssign = async (report_id: number, technician_id: string) => {
    if (!technician_id) return;
    setAssigning(report_id);
    try {
      await apiClient.patch('/admin/assign', {
        report_id,
        technician_id: Number(technician_id),
      });
      setReports((prev) =>
        prev.map((r) =>
          r.id === report_id ? { ...r, assigned_tech_id: Number(technician_id) } : r
        )
      );
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Assignment failed. Please try again.');
    } finally {
      setAssigning(null);
    }
  };

  const total     = reports.length;
  const newCount  = reports.filter((r) => r.status === 'NEW').length;
  const ongoing   = reports.filter((r) => r.status === 'ONGOING').length;
  const completed = reports.filter((r) => r.status === 'COMPLETED').length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <ClipboardList size={20} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Manage All Reports</h1>
            <p className="text-sm text-slate-500">Review and assign citizen-submitted issues</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total',     value: total,     icon: ClipboardList, bg: 'bg-slate-50',  text: 'text-slate-500' },
            { label: 'New',       value: newCount,  icon: Clock,         bg: 'bg-amber-50',  text: 'text-amber-600' },
            { label: 'Ongoing',   value: ongoing,   icon: TrendingUp,    bg: 'bg-blue-50',   text: 'text-blue-600' },
            { label: 'Completed', value: completed, icon: CheckCircle,   bg: 'bg-green-50',  text: 'text-green-600' },
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

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2.5 p-4 mb-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 text-sm">
              All Reports {!loading && `(${reports.length})`}
            </h2>
          </div>

          {loading ? (
            <div className="divide-y divide-slate-100">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-6 py-4 flex gap-4 animate-pulse">
                  <div className="h-4 bg-slate-100 rounded w-8 shrink-0" />
                  <div className="flex-1 h-4 bg-slate-100 rounded" />
                  <div className="h-4 bg-slate-100 rounded w-20" />
                  <div className="h-4 bg-slate-100 rounded w-24" />
                </div>
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertTriangle size={28} className="text-slate-200 mb-3" />
              <p className="text-sm font-medium text-slate-500">No reports submitted yet</p>
            </div>
          ) : (
            <>
              {/* Table header */}
              <div className="grid grid-cols-12 px-6 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                <span className="col-span-1">ID</span>
                <span className="col-span-4">Address / Category</span>
                <span className="col-span-2">Status</span>
                <span className="col-span-2">Date</span>
                <span className="col-span-3">Assigned To</span>
              </div>

              <div className="divide-y divide-slate-100">
                {reports.map((report) => {
                  const st = statusConfig[report.status] ?? { label: report.status, color: 'bg-slate-100 text-slate-600' };
                  const assignedTech = technicians.find((t) => t.id === report.assigned_tech_id);
                  return (
                    <div key={report.id} className="grid grid-cols-12 px-6 py-4 items-start gap-2 text-sm hover:bg-slate-50 transition-colors">

                      {/* ID + User */}
                      <div className="col-span-1">
                        <p className="text-slate-400 font-mono text-xs">#{report.id}</p>
                        <p className="text-slate-300 text-xs mt-0.5">U:{report.user_id}</p>
                      </div>

                      {/* Image + Address + Category + Description */}
                      <div className="col-span-4 min-w-0 flex items-start gap-2.5">
                        {report.image_path ? (
                          <a
                            href={getImageUrl(report.image_path)}
                            target="_blank"
                            rel="noreferrer"
                            className="shrink-0"
                            title="View full image"
                          >
                            <img
                              src={getImageUrl(report.image_path)}
                              alt="Report"
                              className="w-10 h-10 rounded-lg object-cover bg-slate-100 hover:opacity-80 transition-opacity"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          </a>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                            <ImageOff size={12} className="text-slate-300" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800 truncate text-xs">{report.address}</p>
                          <p className="text-xs text-blue-500 truncate mt-0.5">{getCategoryName(report.category_id)}</p>
                          <p className="text-xs text-slate-400 truncate">{report.description}</p>
                        </div>
                      </div>

                      {/* Status */}
                      <span className="col-span-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${st.color}`}>
                          {st.label}
                        </span>
                      </span>

                      {/* Date */}
                      <span className="col-span-2 text-xs text-slate-400">
                        {new Date(report.created_at).toLocaleDateString('en-GB', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </span>

                      {/* Assigned To */}
                      <div className="col-span-3">
                        {assignedTech ? (
                          <div className="flex items-center gap-1.5 text-xs text-green-700">
                            <UserCheck size={13} />
                            <span className="truncate">{assignedTech.full_name}</span>
                          </div>
                        ) : (
                          <div className="relative">
                            <select
                              onChange={(e) => handleAssign(report.id, e.target.value)}
                              disabled={assigning === report.id}
                              defaultValue=""
                              className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-600 disabled:opacity-50 appearance-none cursor-pointer"
                            >
                              <option value="" disabled>Assign…</option>
                              {technicians.map((tech) => (
                                <option key={tech.id} value={String(tech.id)}>
                                  {tech.full_name}
                                </option>
                              ))}
                            </select>
                            {assigning === report.id && (
                              <Loader2 size={12} className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />
                            )}
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default ManageReportsPage;
