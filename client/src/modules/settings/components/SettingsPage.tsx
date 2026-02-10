// Settings Page
// Account settings, profile management via Clerk

import { useUser, useAuth } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Shield,
  Save,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export function SettingsPage() {
  const { user: clerkUser } = useUser();
  const { getToken } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/v2/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data?.user) {
        const u = data.data.user;
        setProfile(u);
        setForm({
          first_name: u.firstName || u.first_name || '',
          last_name: u.lastName || u.last_name || '',
          phone: u.phone || '',
        });
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess('');
    setError('');
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/v2/auth/profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSuccess('Profile updated successfully');
        fetchProfile();
      } else {
        setError('Failed to update profile');
      }
    } catch {
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600 mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <User className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Profile Information</h2>
            <p className="text-sm text-slate-500">Update your personal details</p>
          </div>
        </div>
        <div className="p-6 space-y-5">
          {/* Avatar and Clerk info */}
          <div className="flex items-center gap-4 pb-5 border-b border-slate-100">
            <img
              src={clerkUser?.imageUrl}
              alt="Avatar"
              className="w-16 h-16 rounded-2xl object-cover"
            />
            <div>
              <p className="font-medium text-slate-900">
                {clerkUser?.fullName || `${form.first_name} ${form.last_name}`}
              </p>
              <p className="text-sm text-slate-500">{clerkUser?.primaryEmailAddress?.emailAddress}</p>
              <p className="text-xs text-slate-400 mt-1">
                Manage your avatar and email via the profile button in the sidebar
              </p>
            </div>
          </div>

          {/* Editable fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">First Name</label>
              <input
                type="text"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-100 focus:border-amber-300 outline-none transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Last Name</label>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-100 focus:border-amber-300 outline-none transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> Phone Number</span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+91 XXXXXXXXXX"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-100 focus:border-amber-300 outline-none transition-all text-sm"
            />
          </div>

          {/* Messages */}
          {success && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 px-4 py-3 rounded-xl">
              <CheckCircle className="w-4 h-4" /> {success}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Shield className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Account Details</h2>
            <p className="text-sm text-slate-500">Your account information</p>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Email</p>
              <p className="text-sm font-medium text-slate-900 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-slate-400" />
                {profile?.email || clerkUser?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Role</p>
              <p className="text-sm font-medium text-slate-900 capitalize">
                {profile?.role?.replace('_', ' ') || 'Student'}
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Status</p>
              <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${profile?.is_active ? 'text-emerald-600' : 'text-red-600'}`}>
                <span className={`w-2 h-2 rounded-full ${profile?.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                {profile?.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Member Since</p>
              <p className="text-sm font-medium text-slate-900">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
