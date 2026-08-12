import { useState, useEffect } from 'react';
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Home,
  Briefcase,
  Building,
  Loader2,
  X,
  Check,
} from 'lucide-react';
import {
  type DeliveryAddress,
  getSavedAddresses,
  saveDeliveryAddress,
  deleteDeliveryAddress,
  setDefaultDeliveryAddress,
  validatePincode,
} from '@/lib/addressStore';
import CountryPhoneInput from '@/components/CountryPhoneInput';
import { toast } from 'react-hot-toast';

interface AddressManagerProps {
  userId?: string;
  selectedAddressId?: string;
  onSelectAddress?: (address: DeliveryAddress) => void;
  isCheckout?: boolean;
}

export default function AddressManager({
  userId,
  selectedAddressId,
  onSelectAddress,
  isCheckout = false,
}: AddressManagerProps) {
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<DeliveryAddress | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [houseNo, setHouseNo] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [addressType, setAddressType] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadAddresses = async () => {
    setLoading(true);
    const list = await getSavedAddresses(userId);
    setAddresses(list);
    setLoading(false);

    // If checkout mode and no selected address, auto-select default address
    if (isCheckout && onSelectAddress && list.length > 0) {
      const defaultAddr = list.find((a) => a.is_default) || list[0];
      onSelectAddress(defaultAddr);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, [userId]);

  const openAddModal = () => {
    setEditingAddress(null);
    setFullName('');
    setCountryCode('+91');
    setPhone('');
    setHouseNo('');
    setStreet('');
    setLandmark('');
    setCity('');
    setState('');
    setPincode('');
    setAddressType('Home');
    setIsDefault(addresses.length === 0);
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (addr: DeliveryAddress) => {
    setEditingAddress(addr);
    setFullName(addr.full_name);
    setCountryCode('+91');
    setPhone(addr.phone.replace(/^\+91/, ''));
    setHouseNo(addr.house_no);
    setStreet(addr.street);
    setLandmark(addr.landmark || '');
    setCity(addr.city);
    setState(addr.state);
    setPincode(addr.pincode);
    setAddressType(addr.address_type);
    setIsDefault(addr.is_default);
    setFormError(null);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim()) {
      setFormError('Please enter recipient full name.');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setFormError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!houseNo.trim()) {
      setFormError('House / Flat / Building number is required.');
      return;
    }
    if (!street.trim()) {
      setFormError('Street / Area is required.');
      return;
    }
    if (!city.trim()) {
      setFormError('City is required.');
      return;
    }
    if (!state.trim()) {
      setFormError('State is required.');
      return;
    }
    if (!pincode.trim() || !validatePincode(pincode)) {
      setFormError('Please enter a valid 6-digit PIN code.');
      return;
    }

    setSaving(true);
    try {
      const saved = await saveDeliveryAddress(
        {
          id: editingAddress?.id,
          full_name: fullName,
          phone: `${countryCode}${phone.replace(/\D/g, '')}`,
          house_no: houseNo,
          street,
          landmark,
          city,
          state,
          pincode,
          address_type: addressType,
          is_default: isDefault,
        },
        userId
      );

      toast.success(editingAddress ? 'Delivery address updated!' : 'New delivery address added!', { icon: '📍' });
      setShowModal(false);
      await loadAddresses();

      if (isCheckout && onSelectAddress) {
        onSelectAddress(saved);
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this saved address?')) return;
    await deleteDeliveryAddress(id, userId);
    toast.success('Address removed');
    await loadAddresses();
  };

  const handleSetDefault = async (id: string) => {
    await setDefaultDeliveryAddress(id, userId);
    toast.success('Default delivery address updated');
    await loadAddresses();
  };

  return (
    <div className="space-y-4 font-sans">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-bold text-wine-800 dark:text-white flex items-center gap-2">
          <MapPin className="h-5 w-5 text-wine-600 dark:text-gold-300" />
          {isCheckout ? 'Select Delivery Address' : 'Saved Delivery Addresses'}
        </h3>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 rounded-full bg-wine-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-wine-700 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add New Address
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-wine-600 dark:text-gold-300" />
        </div>
      ) : addresses.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-cream-300 p-8 text-center dark:border-gray-700">
          <MapPin className="mx-auto h-10 w-10 text-gray-400" />
          <p className="mt-2 text-sm font-semibold text-gray-700 dark:text-gray-300">No saved addresses found</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Add your delivery address for fast and easy checkout.</p>
          <button
            type="button"
            onClick={openAddModal}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-wine-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-wine-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Delivery Address
          </button>
        </div>
      ) : (
        <div className="grid gap-3.5 sm:grid-cols-2">
          {addresses.map((addr) => {
            const isSelected = selectedAddressId === addr.id;
            return (
              <div
                key={addr.id}
                onClick={() => isCheckout && onSelectAddress && onSelectAddress(addr)}
                className={`relative rounded-2xl p-4 transition-all border ${
                  isCheckout ? 'cursor-pointer' : ''
                } ${
                  isSelected
                    ? 'border-wine-600 bg-wine-50/40 ring-2 ring-wine-600/30 dark:border-gold-500 dark:bg-gray-800'
                    : 'border-cream-200 bg-white hover:border-wine-400 dark:border-gray-700 dark:bg-gray-800/80'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-md bg-cream-200 px-2 py-0.5 text-[10px] font-bold text-wine-800 uppercase dark:bg-gray-700 dark:text-gold-300">
                      {addr.address_type === 'Work' ? (
                        <Briefcase className="h-3 w-3" />
                      ) : addr.address_type === 'Other' ? (
                        <Building className="h-3 w-3" />
                      ) : (
                        <Home className="h-3 w-3" />
                      )}
                      {addr.address_type}
                    </span>
                    {addr.is_default && (
                      <span className="rounded-md bg-wine-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                        Default
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(addr);
                      }}
                      className="p-1 text-gray-400 hover:text-wine-600 dark:hover:text-gold-300"
                      title="Edit Address"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(addr.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Delete Address"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 space-y-1">
                  <p className="text-xs font-bold text-wine-900 dark:text-white flex items-center gap-2">
                    {addr.full_name}
                    <span className="font-mono text-gray-500 font-normal">({addr.phone})</span>
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-snug">
                    {addr.house_no}, {addr.street}
                    {addr.landmark ? `, Near ${addr.landmark}` : ''}
                  </p>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-200">
                    {addr.city}, {addr.state} - <strong className="font-mono text-wine-700 dark:text-gold-300">{addr.pincode}</strong>
                  </p>
                </div>

                {!addr.is_default && !isCheckout && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(addr.id)}
                    className="mt-3 text-[11px] font-semibold text-wine-700 hover:underline dark:text-gold-300"
                  >
                    Set as Default Address
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Address Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-cream-50 p-6 sm:p-8 shadow-2xl ring-1 ring-cream-200 dark:bg-gray-800 dark:ring-gray-700 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 grid h-9 w-9 place-items-center rounded-full bg-cream-200/60 text-ink-700/60 hover:bg-cream-300 dark:bg-gray-700 dark:text-gray-300 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="font-display text-xl font-bold text-wine-800 dark:text-white flex items-center gap-2">
              <MapPin className="h-5 w-5 text-wine-600 dark:text-gold-300" />
              {editingAddress ? 'Edit Delivery Address' : 'Add New Delivery Address'}
            </h3>

            <form onSubmit={handleSave} className="mt-5 space-y-4 text-xs">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Recipient name"
                    className="input"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Mobile Number *</label>
                  <CountryPhoneInput
                    countryCode={countryCode}
                    onCountryCodeChange={setCountryCode}
                    phone={phone}
                    onPhoneChange={setPhone}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Flat / House / Building *</label>
                  <input
                    type="text"
                    required
                    value={houseNo}
                    onChange={(e) => setHouseNo(e.target.value)}
                    placeholder="e.g. Flat 302, Green Apartments"
                    className="input"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Street / Area / Colony *</label>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="e.g. MG Road, Sector 14"
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Landmark (Optional)</label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Near City Hospital"
                  className="input"
                />
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Mumbai"
                    className="input"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. Maharashtra"
                    className="input"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">PIN Code *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6-digit PIN"
                    className="input font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <label className="font-semibold text-gray-700 dark:text-gray-300">Address Type:</label>
                  {(['Home', 'Work', 'Other'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setAddressType(type)}
                      className={`rounded-lg px-3 py-1.5 font-bold transition-all ${
                        addressType === type
                          ? 'bg-wine-600 text-white shadow-xs'
                          : 'bg-cream-200 text-gray-700 hover:bg-cream-300 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isDefaultCheck"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="h-4 w-4 rounded border-cream-300 text-wine-600 focus:ring-wine-500"
                />
                <label htmlFor="isDefaultCheck" className="font-semibold text-gray-700 dark:text-gray-300">
                  Set as default delivery address
                </label>
              </div>

              {formError && (
                <p className="rounded-xl bg-red-50 p-2.5 text-xs font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
                  {formError}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-cream-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-full border border-cream-300 px-5 py-2.5 font-semibold text-gray-700 hover:bg-cream-100 dark:border-gray-600 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-full bg-wine-600 px-6 py-2.5 font-bold text-white shadow hover:bg-wine-700 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
