import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, UserPlus, Mail, Lock, AlertCircle, CheckCircle, Loader2, X } from 'lucide-react';
import apiClient from '../../api/client';

interface Technician {
  id: number;
  full_name: string;
  email: string;
}

// Mirrors backend createTechnicianSchema: email, password min 8, full_name min 2
const CreateTechSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email:     z.string().email('Invalid email address'),
  password:  z.string().min(8, 'Password must be at least 8 characters'),
});
type CreateTechInput = z.infer<typeof CreateTechSchema>;

const ManageTechniciansPage = () => {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [serverError, setServerError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateTechInput>({ resolver: zodResolver(CreateTechSchema) });

  const fetchTechnicians = async () => {
    try {
      const res = await apiClient.get('/admin/technicians');
      setTechnicians(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError('Could not load technicians. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTechnicians(); }, []);

  const onSubmit = async (data: CreateTechInput) => {
    try {
      setServerError('');
      await apiClient.post('/admin/technicians', data);
      setCreateSuccess(`${data.full_name} was added successfully.`);
      reset();
      setShowForm(false);
      setLoading(true);
      await fetchTechnicians();
    } catch (e: any) {
      setServerError(e.response?.data?.message ?? 'Could not create technician.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <User size={20} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Manage Technicians</h1>
              <p className="text-sm text-slate-500">Add and oversee city technicians</p>
            </div>
          </div>
          <button
            onClick={() => { setShowForm((v) => !v); setServerError(''); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-md shadow-blue-200"
          >
            {showForm ? <X size={16} /> : <UserPlus size={16} />}
            {showForm ? 'Cancel' : 'Add Technician'}
          </button>
        </div>

        {/* Success banner */}
        {createSuccess && (
          <div className="flex items-center gap-2.5 p-4 mb-6 bg-green-50 border border-green-200 rounded-2xl text-green-700 text-sm">
            <CheckCircle size={16} className="shrink-0" />
            {createSuccess}
          </div>
        )}

        {/* Create form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-6 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-1" />
            <div className="p-6">
              <h2 className="font-semibold text-slate-900 mb-5">New Technician Account</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Full name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User size={15} />
                    </div>
                    <input
                      {...register('full_name')}
                      placeholder="John Doe"
                      className={`w-full pl-10 pr-3.5 py-2.5 border rounded-xl text-sm outline-none transition-all
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                        ${errors.full_name ? 'border-red-400 bg-red-50' : 'border-slate-300 hover:border-slate-400'}`}
                    />
                  </div>
                  {errors.full_name && (
                    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.full_name.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail size={15} />
                    </div>
                    <input
                      {...register('email')}
                      type="email"
                      placeholder="tech@example.com"
                      className={`w-full pl-10 pr-3.5 py-2.5 border rounded-xl text-sm outline-none transition-all
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                        ${errors.email ? 'border-red-400 bg-red-50' : 'border-slate-300 hover:border-slate-400'}`}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock size={15} />
                    </div>
                    <input
                      type="password"
                      {...register('password')}
                      placeholder="Min. 8 characters"
                      className={`w-full pl-10 pr-3.5 py-2.5 border rounded-xl text-sm outline-none transition-all
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                        ${errors.password ? 'border-red-400 bg-red-50' : 'border-slate-300 hover:border-slate-400'}`}
                    />
                  </div>
                  {errors.password && (
                    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.password.message}
                    </p>
                  )}
                </div>

                {serverError && (
                  <div className="flex items-start gap-2.5 p-3.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    {serverError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
                  {isSubmitting ? 'Creating…' : 'Create Account'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2.5 p-4 mb-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {/* Technician list */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 text-sm">
              Registered Technicians {!loading && `(${technicians.length})`}
            </h2>
          </div>

          {loading ? (
            <div className="p-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-slate-100 p-4 flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 bg-slate-100 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-100 rounded w-3/4" />
                    <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : technicians.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <User size={28} className="text-slate-200 mb-3" />
              <p className="text-sm font-medium text-slate-500">No technicians registered yet</p>
              <p className="text-xs text-slate-400 mt-1">Use the button above to add the first technician</p>
            </div>
          ) : (
            <div className="p-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {technicians.map((tech) => (
                <div key={tech.id} className="rounded-xl border border-slate-100 p-4 flex items-center gap-3 hover:border-slate-200 transition-colors">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center shrink-0">
                    <User size={18} className="text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{tech.full_name}</p>
                    <p className="text-xs text-slate-400 truncate">{tech.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ManageTechniciansPage;
