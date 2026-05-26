import React, { useEffect, useState } from 'react';
import { Tag, PlusCircle, Trash2, AlertCircle, Loader2, X, Search } from 'lucide-react';
import apiClient from '../../api/client';

interface Category {
  id: number;
  name: string;
}

const CategoryManagementPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCategories = async () => {
    try {
      const res = await apiClient.get('/categories');
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError('Could not load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    setCreating(true);
    setCreateError('');
    try {
      await apiClient.post('/categories', { name: trimmed });
      setNewName('');
      setShowInput(false);
      setLoading(true);
      await fetchCategories();
    } catch (err: any) {
      setCreateError(err.response?.data?.message ?? 'Could not create category.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this category? This action cannot be undone.')) return;
    setDeletingId(id);
    try {
      await apiClient.delete(`/categories/${id}`);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Could not delete category.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Tag size={20} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Category Management</h1>
              <p className="text-sm text-slate-500">Define report categories for the system</p>
            </div>
          </div>
          <button
            onClick={() => { setShowInput((v) => !v); setCreateError(''); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-md shadow-blue-200"
          >
            {showInput ? <X size={16} /> : <PlusCircle size={16} />}
            {showInput ? 'Cancel' : 'Add Category'}
          </button>
        </div>

        {/* Search bar */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search size={15} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories…"
            className="w-full pl-10 pr-9 py-2.5 border border-slate-300 rounded-xl text-sm outline-none transition-all
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Inline create form */}
        {showInput && (
          <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-slate-100 p-5 mb-6 shadow-sm">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Category Name</label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Tag size={15} />
                </div>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Pothole / Road Damage"
                  maxLength={50}
                  className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-sm outline-none transition-all
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400"
                />
              </div>
              <button
                type="submit"
                disabled={creating || !newName.trim()}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {creating ? <Loader2 size={14} className="animate-spin" /> : <PlusCircle size={14} />}
                {creating ? 'Saving…' : 'Save'}
              </button>
            </div>
            {createError && (
              <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle size={12} /> {createError}
              </p>
            )}
          </form>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2.5 p-4 mb-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {/* Category list */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 text-sm">
              Report Categories {!loading && `(${filteredCategories.length}${searchQuery ? ` of ${categories.length}` : ''})`}
            </h2>
          </div>

          {loading ? (
            <div className="divide-y divide-slate-100">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between px-6 py-4 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg" />
                    <div className="h-3.5 bg-slate-100 rounded w-40" />
                  </div>
                  <div className="w-8 h-8 bg-slate-100 rounded-lg" />
                </div>
              ))}
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Tag size={26} className="text-slate-200 mb-3" />
              <p className="text-sm font-medium text-slate-500">
                {searchQuery ? 'No categories match your search' : 'No categories yet'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {searchQuery ? 'Try a different search term' : 'Add a category using the button above'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filteredCategories.map((cat) => (
                <li key={cat.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Tag size={14} className="text-blue-500" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">{cat.name}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    disabled={deletingId === cat.id}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40 transition-colors"
                    title="Delete category"
                  >
                    {deletingId === cat.id
                      ? <Loader2 size={14} className="animate-spin" />
                      : <Trash2 size={14} />
                    }
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
};

export default CategoryManagementPage;
