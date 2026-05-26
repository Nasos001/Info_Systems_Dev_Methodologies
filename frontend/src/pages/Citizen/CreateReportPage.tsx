import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle, Navigation, Tag,
  AlignLeft, AlertCircle, CheckCircle, Loader2, ImagePlus, MapPin,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { Icon as LeafletIcon } from 'leaflet';
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerIconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';
import { CreateReportSchema, type CreateReportInput } from '../../schemas/report';
import apiClient from '../../api/client';

interface Category {
  id: number;
  name: string;
}

// Bundled marker icon — avoids CDN dependency and Vite asset-path issues
const markerIcon = new LeafletIcon({
  iconUrl: markerIconUrl,
  iconRetinaUrl: markerIconRetinaUrl,
  shadowUrl: markerShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Flies the map to a new centre whenever `center` changes
const MapUpdater = ({ center }: { center: [number, number] | null }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 15, { animate: true, duration: 0.6 });
  }, [center, map]);
  return null;
};

// Lets the user click the map to set / move the pin
const LocationPicker = ({ onSelect }: { onSelect: (pos: [number, number]) => void }) => {
  useMapEvents({
    click: (e) => onSelect([e.latlng.lat, e.latlng.lng]),
  });
  return null;
};

const CreateReportPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState('');
  const [serverError, setServerError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Map state
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateReportInput>({
    resolver: zodResolver(CreateReportSchema),
  });

  // Track selected file to show filename preview
  const watchedImage: FileList | undefined = watch('image');
  const selectedFile = watchedImage?.[0];

  // Watch the address field for geocoding
  const watchedAddress = (watch('address') as string | undefined) ?? '';

  /* ── Fetch categories on mount ── */
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await apiClient.get('/categories');
        const cats: Category[] = Array.isArray(res.data)
          ? res.data
          : (res.data?.data ?? []);
        setCategories(cats);
      } catch {
        setCategoriesError('Could not load categories. Please refresh the page.');
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  /* ── Debounced geocoding: call Nominatim when address changes ── */
  useEffect(() => {
    if (!watchedAddress || watchedAddress.length < 3) return;

    const timer = setTimeout(async () => {
      setGeocoding(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(watchedAddress)}&format=json&limit=1`
        );
        const data = await res.json() as Array<{ lat: string; lon: string }>;
        if (data.length > 0) {
          setMarkerPos([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        }
      } catch {
        // Geocoding failure is non-critical — the map is optional
      } finally {
        setGeocoding(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [watchedAddress]);

  /* ── Submit: build FormData so the browser sets multipart/form-data boundary ── */
  const onSubmit = async (data: CreateReportInput) => {
    try {
      setServerError('');

      const formData = new FormData();
      formData.append('category_id', String(Number(data.category_id)));
      formData.append('address', data.address);
      formData.append('description', data.description);
      formData.append('image', data.image[0] as File);

      await apiClient.post('/reports', formData, {
        headers: { 'Content-Type': undefined },
      });

      setSubmitSuccess(true);
      reset();
      setTimeout(() => navigate('/citizen/my-reports'), 1800);
    } catch (e: any) {
      setServerError(
        e.response?.data?.message || 'An error occurred while submitting the report.'
      );
    }
  };

  /* ── Success screen ── */
  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-md p-10 max-w-sm w-full text-center">
          <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Report Submitted!</h2>
          <p className="text-sm text-slate-500">
            Your report has been received. Redirecting to your reports…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">

        {/* Page Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <PlusCircle size={20} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Submit a Report</h1>
            <p className="text-sm text-slate-500">Report a problem in your neighbourhood</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-1" />

          <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">

            {/* ── Category ── */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Tag size={16} />
                </div>
                {categoriesLoading ? (
                  <div className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-400 flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    <span>Loading categories…</span>
                  </div>
                ) : categoriesError ? (
                  <div className="w-full pl-10 pr-3.5 py-2.5 border border-red-200 rounded-xl text-sm bg-red-50 text-red-500">
                    {categoriesError}
                  </div>
                ) : (
                  <select
                    {...register('category_id')}
                    defaultValue=""
                    className={`w-full pl-10 pr-3.5 py-2.5 border rounded-xl text-sm outline-none transition-all appearance-none bg-white
                      focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      ${errors.category_id
                        ? 'border-red-400 bg-red-50 focus:ring-red-500 focus:border-red-500'
                        : 'border-slate-300 hover:border-slate-400'
                      }`}
                  >
                    <option value="" disabled>Select a category…</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              {errors.category_id && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.category_id.message}
                </p>
              )}
            </div>

            {/* ── Address + Map ── */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Navigation size={16} />
                </div>
                <input
                  {...register('address')}
                  onFocus={() => setShowMap(true)}
                  placeholder="Street address or landmark"
                  className={`w-full pl-10 pr-3.5 py-2.5 border rounded-xl text-sm outline-none transition-all
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    ${errors.address
                      ? 'border-red-400 bg-red-50 focus:ring-red-500 focus:border-red-500'
                      : 'border-slate-300 bg-white hover:border-slate-400'
                    }`}
                />
              </div>
              {errors.address && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.address.message}
                </p>
              )}

              {/* ── Map preview ── */}
              {showMap && (
                <div className="mt-3">
                  <div className="h-56 rounded-xl overflow-hidden border border-slate-200 relative">
                    <MapContainer
                      center={markerPos ?? [51.505, -0.09]}
                      zoom={markerPos ? 15 : 5}
                      style={{ height: '100%', width: '100%' }}
                      scrollWheelZoom={false}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      {markerPos && (
                        <Marker position={markerPos} icon={markerIcon} />
                      )}
                      <MapUpdater center={markerPos} />
                      <LocationPicker onSelect={setMarkerPos} />
                    </MapContainer>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-400 flex items-center gap-1">
                    <MapPin size={11} />
                    {geocoding
                      ? 'Locating address…'
                      : markerPos
                      ? 'Click the map to adjust the pin'
                      : 'Type your address above to locate it on the map'}
                  </p>
                </div>
              )}
            </div>

            {/* ── Description ── */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Description <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute top-3 left-0 pl-3.5 flex items-start pointer-events-none text-slate-400">
                  <AlignLeft size={16} />
                </div>
                <textarea
                  {...register('description')}
                  rows={4}
                  placeholder="Provide more details — when you noticed it, how severe it is, etc."
                  className={`w-full pl-10 pr-3.5 py-2.5 border rounded-xl text-sm outline-none transition-all resize-none
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    ${errors.description
                      ? 'border-red-400 bg-red-50 focus:ring-red-500 focus:border-red-500'
                      : 'border-slate-300 bg-white hover:border-slate-400'
                    }`}
                />
              </div>
              {errors.description && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.description.message}
                </p>
              )}
            </div>

            {/* ── Image Upload ── */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Photo <span className="text-red-500">*</span>
              </label>
              <div
                className={`relative flex items-center gap-3 border rounded-xl px-3.5 py-2.5 transition-all cursor-pointer
                  ${errors.image
                    ? 'border-red-400 bg-red-50'
                    : 'border-slate-300 bg-white hover:border-slate-400'
                  }`}
              >
                <ImagePlus size={16} className="text-slate-400 shrink-0 pointer-events-none" />
                <span className="text-sm text-slate-400 truncate pointer-events-none select-none">
                  {selectedFile ? selectedFile.name : 'Choose an image…'}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                  {...register('image')}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              {errors.image && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.image.message as string}
                </p>
              )}
              <p className="mt-1.5 text-xs text-slate-400">
                Accepted: JPG, PNG · Max 5 MB
              </p>
            </div>

            {/* ── Server error ── */}
            {serverError && (
              <div className="flex items-start gap-2.5 p-3.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            {/* ── Actions ── */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => navigate('/citizen/my-reports')}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || categoriesLoading || !!categoriesError}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors shadow-md shadow-blue-200"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <PlusCircle size={16} />
                    Submit Report
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default CreateReportPage;
