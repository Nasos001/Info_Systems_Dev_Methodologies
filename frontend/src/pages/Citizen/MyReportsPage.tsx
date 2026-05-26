import { useEffect, useState } from 'react';
import {
  ClipboardList, Clock, CheckCircle, AlertCircle, PlusCircle,
  Calendar, Pencil, X, Tag, Navigation, AlignLeft, Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';

type ReportStatus = 'NEW' | 'REJECTED' | 'DUPLICATE' | 'ONGOING' | 'COMPLETED';

interface Category {
  id: number;
  name: string;
}

interface Report {
  id: number;
  category_id: number;
  address: string;
  description: string;
  status: ReportStatus;
  image_path: string | null;
  created_at: string;
}

interface EditForm {
  category_id: string;
  address: string;
  description: string;
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

const MyReportsPage = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit state
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ category_id: '', address: '', description: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reportsRes, catsRes] = await Promise.all([
          apiClient.get('/reports/my'),
          apiClient.get('/categories'),
        ]);
        setReports(Array.isArray(reportsRes.data) ? reportsRes.data : []);
        setCategories(Array.isArray(catsRes.data) ? catsRes.data : []);
      } catch {
        setError('Could not load reports. Please try again.');
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

  const openEdit = (report: Report) => {
    setEditingReport(report);
    setEditForm({
      category_id: String(report.category_id),
      address: report.address,
      description: report.description,
    });
    setEditError('');
  };

  const closeEdit = () => {
    setEditingReport(null);
    setEditError('');
  };

  const handleEditSubmit = async () => {
    if (!editingReport) return;
    if (!editForm.address.trim()) {
      setEditError('Address is required.');
      return;
    }
    if (editForm.description.trim().length < 10) {
      setEditError('Description must be at least 10 characters.');
      return;
    }
    setEditLoading(true);
    setEditError('');
    try {
      await apiClient.patch(`/reports/${editingReport.id}`, {
        category_id: Number(editForm.category_id),
        address: editForm.address.trim(),
        description: editForm.description.trim(),
      });
      setReports((prev) =>
        prev.map((r) =>
          r.id === editingReport.id
            ? { ...r, category_id: Number(editForm.category_id), address: editForm.address.trim(), description: editForm.description.trim() }
            : r
        )
      );
      closeEdit();
    } catch (e: any) {
      setEditError(e.response?.data?.message ?? 'Could not update report. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  const total     = reports.length;
  const ongoing   = reports.filter((r) => r.status === 'ONGOING').length;
  const completed = reports.filter((r) => r.status === 'COMPLETED').length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <ClipboardList size={20} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">My Reports</h1>
              <p className="text-sm text-slate-500">Track all your submitted issues</p>
            </div>
          </div>
          <Link
            to="/citizen/create-report"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-md shadow-blue-200"
          >
            <PlusCircle size={16} />
            New Report
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total',     value: total,     icon: ClipboardList, bg: 'bg-slate-100', text: 'text-slate-600' },
            { label: 'Ongoing',   value: ongoing,   icon: Clock,         bg: 'bg-blue-50',   text: 'text-blue-600' },
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

        {/* Loading skeletons */}
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
        {!loading && !error && reports.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-14 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
              <AlertCircle size={30} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-1">No reports yet</h3>
            <p className="text-sm text-slate-400 max-w-sm mb-6">
              You haven&apos;t submitted any reports. Start by reporting an issue in your area.
            </p>
            <Link
              to="/citizen/create-report"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <PlusCircle size={16} />
              Submit Your First Report
            </Link>
          </div>
        )}

        {/* Report list */}
        {!loading && !error && reports.length > 0 && (
          <div className="space-y-3">
            {reports.map((report) => {
              const st = statusConfig[report.status] ?? { label: report.status, color: 'bg-slate-100 text-slate-600' };
              return (
                <div key={report.id} className="bg-white rounded-2xl border border-slate-100 p-5 flex gap-4">
                  {report.image_path ? (
                    <img
                      src={getImageUrl(report.image_path)}
                      alt="Report"
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0 bg-slate-100"
                      onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }}
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-100 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                      <p className="font-semibold text-slate-900 text-sm truncate">{report.address}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${st.color}`}>
                        {st.label}
                      </span>
                    </div>
                    {/* Category */}
                    <div className="flex items-center gap-1 mb-1">
                      <Tag size={11} className="text-blue-400 shrink-0" />
                      <span className="text-xs text-blue-500 font-medium">{getCategoryName(report.category_id)}</span>
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-2">{report.description}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Calendar size={11} />
                        {new Date(report.created_at).toLocaleDateString('en-GB', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                        <span className="text-slate-300">·</span>
                        <span>Report #{report.id}</span>
                      </div>
                      {report.status === 'NEW' && (
                        <button
                          onClick={() => openEdit(report)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <Pencil size={11} />
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ── Edit Modal ── */}
      {editingReport && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">

            {/* Modal header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Edit Report #{editingReport.id}</h2>
                <p className="text-xs text-slate-400 mt-0.5">Only reports with status New can be edited</p>
              </div>
              <button
                onClick={closeEdit}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Tag size={15} />
                  </div>
                  <select
                    value={editForm.category_id}
                    onChange={(e) => setEditForm((f) => ({ ...f, category_id: e.target.value }))}
                    className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-sm outline-none transition-all appearance-none bg-white
                      focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Navigation size={15} />
                  </div>
                  <input
                    value={editForm.address}
                    onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                    placeholder="Street address or landmark"
                    className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-sm outline-none transition-all
                      focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 bg-white"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <div className="relative">
                  <div className="absolute top-3 left-0 pl-3.5 flex items-start pointer-events-none text-slate-400">
                    <AlignLeft size={15} />
                  </div>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                    rows={3}
                    placeholder="Describe the issue in detail…"
                    className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-sm outline-none transition-all resize-none
                      focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 bg-white"
                  />
                </div>
              </div>

              {/* Edit error */}
              {editError && (
                <div className="flex items-start gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleEditSubmit}
                  disabled={editLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-colors shadow-md shadow-blue-200"
                >
                  {editLoading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Saving…
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyReportsPage;
