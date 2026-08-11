import { useEffect, useState } from 'react';
import { supabase, type Profile } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Store, Hash, FileText, Phone, Mail, Calendar, Loader2, Check, Save, LogOut } from 'lucide-react';

export default function ProfileSection() {
  const { session, profile, loading, signOut } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<Partial<Profile>>({});

  useEffect(() => {
    if (profile) setForm(profile);
  }, [profile]);

  if (loading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-wine-600" />
      </div>
    );
  }

  if (!session || !profile) {
    return (
      <p className="text-center text-ink-700/60 py-10">
        Sign in to view your account details.
      </p>
    );
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    if (!supabase) {
      setSaving(false);
      return;
    }
    await supabase
      .from('profiles')
      .update({
        full_name: form.full_name,
        business_name: form.business_name,
        shop_no: form.shop_no,
        gst_no: form.gst_no,
        phone: form.phone,
      })
      .eq('id', profile!.id);
    setSaving(false);
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 2500);
  }

  const isVendor = profile.role === 'vendor';
  const rows = isVendor ? [
    { icon: <Store className="h-4 w-4" />, label: 'Business name', key: 'business_name' as const },
    { icon: <Hash className="h-4 w-4" />, label: 'Shop number', key: 'shop_no' as const },
    { icon: <FileText className="h-4 w-4" />, label: 'GST number', key: 'gst_no' as const },
    { icon: <Phone className="h-4 w-4" />, label: 'Phone', key: 'phone' as const },
  ] : [
    { icon: <Store className="h-4 w-4" />, label: 'Full name', key: 'full_name' as const },
    { icon: <Phone className="h-4 w-4" />, label: 'Phone', key: 'phone' as const },
  ];

  return (
    <div className="rounded-3xl bg-cream-50 ring-1 ring-cream-200 overflow-hidden">
      <div className="flex items-center justify-between gap-3 p-6 sm:p-8 border-b border-cream-200 bg-cream-100/40">
        <div className="flex items-center gap-4">
          <span className="grid place-items-center h-14 w-14 rounded-full bg-wine-600 text-cream-50 font-display text-xl font-semibold">
            {(profile.full_name || profile.business_name || profile.id).charAt(0).toUpperCase()}
          </span>
          <div>
            <h3 className="font-display text-xl sm:text-2xl font-semibold text-wine-700">
              {profile.full_name || profile.business_name || 'Your account'}
            </h3>
            <p className="flex items-center gap-1.5 text-sm text-ink-700/60">
              <Mail className="h-3.5 w-3.5" />
              {session.user.email}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center rounded-full bg-gold-400/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gold-600">
            {profile.role}
          </span>
          {saved && (
            <span className="inline-flex items-center gap-1 text-sm text-sage-500 animate-fade-in">
              <Check className="h-4 w-4" /> Saved
            </span>
          )}
        </div>
      </div>

      <div className="p-6 sm:p-8">
        <div className="grid sm:grid-cols-2 gap-5">
          {rows.map((r) => (
            <div key={r.key}>
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-700/55">
                <span className="text-gold-600">{r.icon}</span>
                {r.label}
              </p>
              {editing ? (
                <input
                  value={(form[r.key] as string) || ''}
                  onChange={(e) => setForm((f) => ({ ...f, [r.key]: e.target.value }))}
                  className="input"
                />
              ) : (
                <p className="font-display text-lg text-ink-800">
                  {profile[r.key] || '—'}
                </p>
              )}
            </div>
          ))}
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-700/55">
              <span className="text-gold-600"><Calendar className="h-4 w-4" /></span>
              Member since
            </p>
            <p className="font-display text-lg text-ink-800">
              {new Date(profile.created_at).toLocaleDateString('en-IN', {
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-3">
          {editing ? (
            <>
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-wine-600 px-6 py-3 text-sm font-semibold text-cream-50 hover:bg-wine-700 transition-colors disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save changes
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setForm(profile);
                }}
                className="rounded-full border border-cream-300 px-6 py-3 text-sm font-medium text-ink-700/70 hover:bg-cream-100 transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="inline-flex items-center gap-2 rounded-full border border-wine-600/30 px-6 py-3 text-sm font-medium text-wine-700 hover:bg-cream-100 transition-colors">Edit details</button>
              <button onClick={() => void signOut()} className="inline-flex items-center gap-2 rounded-full border border-red-200 px-6 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"><LogOut className="h-4 w-4" />Log out</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
