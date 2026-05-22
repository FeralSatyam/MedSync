import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import { getPatients, updatePatient, deletePatient } from '../api/patientApi';
import { updateMe } from '../api/authApi';

// SVG Icons
const Icons = {
  Camera: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M23 19C23 19.6 22.6 20 22 20H2C1.4 20 1 19.6 1 19V7C1 6.4 1.4 6 2 6H6.7L7.7 4.3C7.9 4 8.2 3.8 8.5 3.8H15.5C15.8 3.8 16.1 4 16.3 4.3L17.3 6H22C22.6 6 23 6.4 23 7V19Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    </svg>
  ),
  Fingerprint: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C8.5 2 5.5 4.5 5.5 8.5V12C5.5 12 5 14 5 15C5 18 7 20 10 20" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M18.5 12V9.5C18.5 6 16 3.5 12 3.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M19 18C19 20.5 16.5 22 14 22" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M15 12V15C15 17 13.5 18.5 12 18.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M8 12V14C8 15.5 7 17 6 17" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M21 12V13C21 15 20 17 18.5 18" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
    </svg>
  ),
  Lock: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="11" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M8 11V8C8 5.8 9.8 4 12 4C14.2 4 16 5.8 16 8V11" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <circle cx="12" cy="16" r="1.5" fill="currentColor"/>
      <path d="M12 18V20" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  Crown: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 18L4 8L8 12L12 4L16 12L20 8L22 18H2Z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
      <path d="M4 20H20" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  Check: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Close: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  Logout: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M16 17L21 12L16 7M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Edit: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 3L21 7L7 21H3V17L17 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15 5L19 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Delete: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 7H20M10 11V16M14 11V16M5 7L6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19L19 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M9 7L10 3H14L15 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  User: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5 20V19C5 15.7 7.7 13 11 13H13C16.3 13 19 15.7 19 19V20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
};

// Feature Card for Pro
function FeatureCard({ title, description, included }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
      <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center ${included ? 'bg-teal-500' : 'bg-gray-300'}`}>
        {included && <Icons.Check />}
      </div>
      <div>
        <h4 className="font-medium text-gray-800 text-sm">{title}</h4>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const authUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const activePatientId = useAppStore((s) => s.activePatientId);

  const [patients, setPatients] = useState([]);
  const [isPro, setIsPro] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });

  // Primary user editing
  const [editingUser, setEditingUser] = useState(false);
  const [userForm, setUserForm] = useState({ name: '', email: '', contactNumber: '' });
  const [savingUser, setSavingUser] = useState(false);
  const [profilePic, setProfilePic] = useState(null);
  const profilePicRef = useRef(null);

  // Family edit modal
  const [editFamilyTarget, setEditFamilyTarget] = useState(null);
  const [editFamilyForm, setEditFamilyForm] = useState({ name: '', dateOfBirth: '', relation: 'self', allergies: '' });
  const [savingFamily, setSavingFamily] = useState(false);

  // Family delete modal
  const [deleteFamilyTarget, setDeleteFamilyTarget] = useState(null);
  const [deletingFamily, setDeletingFamily] = useState(false);

  // Load profile picture from localStorage
  useEffect(() => {
    if (authUser) {
      const savedPic = localStorage.getItem(`medsync_pfp_${authUser.id || authUser._id}`);
      if (savedPic) setProfilePic(savedPic);
      setUserForm({ 
        name: authUser.name || '', 
        email: authUser.email || '',
        contactNumber: authUser.contactNumber ? authUser.contactNumber.replace(/^\+977/, '') : ''
      });
    }
    const proStatus = localStorage.getItem('medsync_pro_status');
    if (proStatus === 'active') setIsPro(true);
    const bioStatus = localStorage.getItem('medsync_biometric');
    if (bioStatus === 'enabled') setBiometricEnabled(true);
  }, [authUser]);

  const loadPatients = useCallback(async () => {
    try {
      const data = await getPatients();
      setPatients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  }, []);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  // ─── Primary user handlers ───
  const handleProfilePicUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2 MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      setProfilePic(base64);
      const uid = authUser?.id || authUser?._id;
      if (uid) localStorage.setItem(`medsync_pfp_${uid}`, base64);
      toast.success('Profile picture updated');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveUser = async () => {
    if (!userForm.name.trim()) { toast.error('Name is required'); return; }
    if (!userForm.email.trim()) { toast.error('Email is required'); return; }
    if (!userForm.contactNumber.trim()) { toast.error('Contact number is required'); return; }
    if (!/^9\d{9}$/.test(userForm.contactNumber.trim())) {
      toast.error('Contact number must be a valid 10-digit Nepal mobile number starting with 9');
      return;
    }
    setSavingUser(true);
    try {
      const contactVal = `+977${userForm.contactNumber.trim()}`;
      const res = await updateMe({ 
        name: userForm.name.trim(), 
        email: userForm.email.trim(),
        contactNumber: contactVal
      });
      setUser(res.user);
      setEditingUser(false);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingUser(false);
    }
  };

  // ─── Family handlers ───
  const openEditFamily = (member) => {
    setEditFamilyForm({
      name: member.name || '',
      dateOfBirth: member.dateOfBirth ? new Date(member.dateOfBirth).toISOString().split('T')[0] : '',
      relation: member.relation || 'self',
      allergies: member.allergies || '',
    });
    setEditFamilyTarget(member);
  };

  const handleSaveFamily = async () => {
    if (!editFamilyForm.name.trim()) { toast.error('Name is required'); return; }
    setSavingFamily(true);
    try {
      await updatePatient(editFamilyTarget._id || editFamilyTarget.id, {
        name: editFamilyForm.name.trim(),
        dateOfBirth: editFamilyForm.dateOfBirth || undefined,
        relation: editFamilyForm.relation,
        allergies: editFamilyForm.allergies,
      });
      toast.success('Family profile updated');
      setEditFamilyTarget(null);
      await loadPatients();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingFamily(false);
    }
  };

  const handleDeleteFamily = async () => {
    setDeletingFamily(true);
    try {
      await deletePatient(deleteFamilyTarget._id || deleteFamilyTarget.id);
      toast.success('Family profile deleted');
      setDeleteFamilyTarget(null);
      await loadPatients();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete profile');
    } finally {
      setDeletingFamily(false);
    }
  };

  // ─── Misc handlers ───
  const handleLogout = () => {
    logout();
    localStorage.removeItem('medsync-auth');
    localStorage.removeItem('medsync_pro_status');
    localStorage.removeItem('medsync_biometric');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleUpgradeToPro = () => setShowProModal(true);
  const handleProPurchase = () => { setShowProModal(false); setShowPinModal(true); setPinInput(''); setPinError(''); };
  const verifyPin = () => {
    if (pinInput === '1234') {
      localStorage.setItem('medsync_pro_status', 'active'); setIsPro(true); setShowPinModal(false);
      toast.success('Successfully upgraded to Pro!');
    } else { setPinError('Invalid PIN. Please try again.'); }
  };
  const handleRemovePro = () => { localStorage.removeItem('medsync_pro_status'); setIsPro(false); toast.success('Pro subscription removed'); };
  const toggleBiometric = () => {
    if (!biometricEnabled) {
      if (window.PublicKeyCredential) {
        toast.success('Biometric authentication enabled (demo)');
        localStorage.setItem('medsync_biometric', 'enabled'); setBiometricEnabled(true);
      } else { toast.error('Biometric authentication not supported on this device'); }
    } else {
      localStorage.removeItem('medsync_biometric'); setBiometricEnabled(false);
      toast.success('Biometric authentication disabled');
    }
  };
  const handleChangePassword = async () => {
    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) { toast.error('Please fill all fields'); return; }
    if (passwordForm.new !== passwordForm.confirm) { toast.error('New passwords do not match'); return; }
    if (passwordForm.new.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    toast.success('Password changed successfully');
    setShowChangePassword(false); setPasswordForm({ current: '', new: '', confirm: '' });
  };
  const handleResetPassword = () => { toast.success('Password reset link sent to your email'); };

  const userInitials = (authUser?.name || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const freeFeatures = [
    { title: 'Track up to 3 family members', description: 'Manage medications for yourself', included: true },
    { title: 'Basic medication tracking', description: 'Log and track your medicines', included: true },
    { title: 'QR code for pharmacy', description: 'Share prescriptions with pharmacy', included: true },
    { title: 'Email support', description: 'Get help via email', included: true },
  ];
  const proFeatures = [
    { title: 'Unlimited family members', description: 'Add all family members', included: isPro },
    { title: 'Advanced medication analytics', description: 'View detailed health insights', included: isPro },
    { title: 'AI-powered refill reminders', description: 'Smart notifications for refills', included: isPro },
    { title: 'Export medical reports', description: 'PDF/CSV export of health data', included: isPro },
    { title: 'Priority support', description: '24/7 priority customer support', included: isPro },
    { title: 'Cloud backup', description: 'Secure backup of all data', included: isPro },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="flex items-center gap-3 px-4 h-16 max-w-2xl mx-auto">
          <button onClick={() => navigate(-1)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Icons.ArrowLeft />
          </button>
          <h1 className="text-xl font-bold text-gray-800">My Profile</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* ══════════════ PRIMARY USER PROFILE ══════════════ */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Banner gradient */}
          <div className="h-24 bg-gradient-to-r from-teal-500 via-teal-400 to-emerald-400 relative">
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold text-2xl">
                  {profilePic ? (
                    <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    userInitials
                  )}
                </div>
                <button
                  onClick={() => profilePicRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-teal-500 rounded-full border-2 border-white shadow flex items-center justify-center text-white hover:bg-teal-600 transition-colors cursor-pointer"
                >
                  <Icons.Camera />
                </button>
                <input ref={profilePicRef} type="file" accept="image/*" className="hidden" onChange={handleProfilePicUpload} />
              </div>
            </div>
          </div>

          <div className="pt-16 pb-6 px-6">
            {!editingUser ? (
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-800">{authUser?.name || 'User'}</h2>
                <p className="text-sm text-gray-500 mt-0.5">{authUser?.email || ''}</p>
                {authUser?.contactNumber && (
                  <p className="text-sm text-gray-500 mt-0.5">{authUser.contactNumber}</p>
                )}
                <button
                  onClick={() => { 
                    setUserForm({ 
                      name: authUser?.name || '', 
                      email: authUser?.email || '',
                      contactNumber: authUser?.contactNumber ? authUser.contactNumber.replace(/^\+977/, '') : ''
                    }); 
                    setEditingUser(true); 
                  }}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 border border-teal-200 text-teal-600 rounded-xl text-sm font-medium hover:bg-teal-50 transition-colors cursor-pointer"
                >
                  <Icons.Edit />
                  Edit Profile
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                  <div className="flex items-center border border-gray-200 rounded-xl bg-white overflow-hidden focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 transition-all">
                    <span className="inline-flex items-center px-3 py-2.5 bg-gray-50 border-r border-gray-200 text-gray-500 text-sm font-semibold select-none">
                      +977
                    </span>
                    <input
                      type="text"
                      placeholder="98XXXXXXXX"
                      maxLength={10}
                      value={userForm.contactNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setUserForm({ ...userForm, contactNumber: val });
                      }}
                      className="flex-1 px-4 py-2.5 bg-transparent focus:outline-none text-gray-800 text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-1">
                  <button onClick={() => setEditingUser(false)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-gray-700 font-medium hover:bg-gray-50 cursor-pointer">
                    Cancel
                  </button>
                  <button onClick={handleSaveUser} disabled={savingUser} className="flex-1 bg-teal-500 text-white rounded-xl py-2.5 font-medium hover:bg-teal-600 disabled:opacity-50 cursor-pointer">
                    {savingUser ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ══════════════ FAMILY PROFILES MANAGEMENT ══════════════ */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="font-semibold text-gray-800 text-lg">Family Members</h2>
              <p className="text-xs text-gray-400 mt-0.5">Manage your family medication profiles</p>
            </div>
            <span className="text-xs font-bold bg-teal-50 text-teal-600 px-2.5 py-1 rounded-full">{patients.length} {patients.length === 1 ? 'member' : 'members'}</span>
          </div>

          {patients.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Icons.User />
              </div>
              <p className="text-gray-500 text-sm font-medium">No family profiles yet</p>
              <p className="text-xs text-gray-400 mt-1">Add a family member from the Dashboard</p>
            </div>
          ) : (
            <div className="space-y-3">
              {patients.map((member) => {
                const initials = member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                const isActive = (member._id || member.id) === activePatientId;
                return (
                  <div
                    key={member._id || member.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${isActive ? 'bg-teal-50/50 border-teal-200' : 'bg-gray-50/50 border-gray-100 hover:border-gray-200'}`}
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold text-base shrink-0 shadow-sm">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800 text-sm truncate">{member.name}</h3>
                        {isActive && (
                          <span className="text-[10px] font-bold bg-teal-500 text-white px-1.5 py-0.5 rounded-md shrink-0">ACTIVE</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 capitalize">{member.relation}</p>
                      {member.allergies && (
                        <p className="text-[11px] text-amber-600 mt-0.5 truncate">⚠ {member.allergies}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEditFamily(member)}
                        className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <Icons.Edit />
                      </button>
                      <button
                        onClick={() => setDeleteFamilyTarget(member)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Icons.Delete />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ══════════════ SECURITY ══════════════ */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-3">Security</h2>
          <div className="space-y-3">
            <button
              onClick={() => setShowChangePassword(true)}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Icons.Lock />
                <span className="text-gray-700">Change Password</span>
              </div>
              <span className="text-gray-400 text-sm">→</span>
            </button>

            <button
              onClick={handleResetPassword}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M1 12C1 12 4 4 12 4C20 4 23 12 23 12C23 12 20 20 12 20C4 20 1 12 1 12Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span className="text-gray-700">Reset Password</span>
              </div>
              <span className="text-gray-400 text-sm">→</span>
            </button>

            <button
              onClick={toggleBiometric}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Icons.Fingerprint />
                <span className="text-gray-700">Biometric Login</span>
              </div>
              <div className={`w-10 h-6 rounded-full transition-colors ${biometricEnabled ? 'bg-teal-500' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform mt-0.5 ${biometricEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
            </button>
          </div>
        </div>

        {/* ══════════════ SUBSCRIPTION ══════════════ */}
        <div className={`rounded-2xl p-5 shadow-sm ${isPro ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-400' : 'bg-white'}`}>
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <Icons.Crown />
              <h2 className="font-semibold text-gray-800">MedSync {isPro ? 'Pro' : 'Free'}</h2>
            </div>
            {isPro && (
              <button onClick={handleRemovePro} className="text-xs text-red-500 hover:text-red-600 cursor-pointer">Remove Pro</button>
            )}
          </div>
          <div className="space-y-3 mb-4">
            <p className="text-sm text-gray-600">Current Plan Features:</p>
            {freeFeatures.map((feature, idx) => (
              <FeatureCard key={idx} {...feature} />
            ))}
            <div className="h-px bg-gray-200 my-2" />
            {proFeatures.map((feature, idx) => (
              <FeatureCard key={idx} {...feature} />
            ))}
          </div>
          {!isPro && (
            <button
              onClick={handleUpgradeToPro}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white py-3 rounded-lg font-semibold hover:from-amber-600 hover:to-yellow-600 transition-colors cursor-pointer"
            >
              Upgrade to Pro - $4.99/month
            </button>
          )}
          {isPro && (
            <div className="text-center p-3 bg-amber-100 rounded-lg">
              <p className="text-sm text-amber-800">✨ You're a Pro member! Enjoy all premium features.</p>
            </div>
          )}
        </div>

        {/* ══════════════ SIGN OUT ══════════════ */}
        <div className="pt-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-4 text-red-600 font-semibold hover:bg-red-100 transition-colors cursor-pointer"
          >
            <Icons.Logout />
            Sign Out
          </button>
        </div>

        <div className="text-center py-2">
          <p className="text-xs text-gray-400">MedSync v1.0.0</p>
        </div>
      </div>

      {/* ══════════════ EDIT FAMILY MODAL ══════════════ */}
      {editFamilyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setEditFamilyTarget(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-gray-800">Edit Family Profile</h3>
              <button onClick={() => setEditFamilyTarget(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer"><Icons.Close /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={editFamilyForm.name}
                  onChange={(e) => setEditFamilyForm({ ...editFamilyForm, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={editFamilyForm.dateOfBirth}
                  onChange={(e) => setEditFamilyForm({ ...editFamilyForm, dateOfBirth: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Relation</label>
                <select
                  value={editFamilyForm.relation}
                  onChange={(e) => setEditFamilyForm({ ...editFamilyForm, relation: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="self">Self</option><option value="mother">Mother</option><option value="father">Father</option>
                  <option value="grandmother">Grandmother</option><option value="grandfather">Grandfather</option>
                  <option value="spouse">Spouse</option><option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Allergies / Notes</label>
                <textarea
                  value={editFamilyForm.allergies}
                  onChange={(e) => setEditFamilyForm({ ...editFamilyForm, allergies: e.target.value })}
                  placeholder="e.g., Allergic to penicillin"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditFamilyTarget(null)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-gray-700 font-medium hover:bg-gray-50 cursor-pointer">
                  Cancel
                </button>
                <button onClick={handleSaveFamily} disabled={savingFamily} className="flex-1 bg-teal-500 text-white rounded-lg py-2.5 font-medium hover:bg-teal-600 disabled:opacity-50 cursor-pointer">
                  {savingFamily ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ DELETE FAMILY MODAL ══════════════ */}
      {deleteFamilyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setDeleteFamilyTarget(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Delete Family Profile</h3>
              <button onClick={() => setDeleteFamilyTarget(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer"><Icons.Close /></button>
            </div>
            <div className="mb-2 p-3 bg-red-50 rounded-xl border border-red-100 flex items-start gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-500 shrink-0 mt-0.5">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-700">Are you sure you want to delete <strong className="text-gray-900">{deleteFamilyTarget.name}</strong>'s profile?</p>
                <p className="text-xs text-red-500 mt-1">This will permanently remove all their medicines and prescriptions. This cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setDeleteFamilyTarget(null)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-gray-700 font-medium hover:bg-gray-50 cursor-pointer">
                Cancel
              </button>
              <button onClick={handleDeleteFamily} disabled={deletingFamily} className="flex-1 bg-red-500 text-white rounded-lg py-2.5 font-medium hover:bg-red-600 disabled:opacity-50 cursor-pointer">
                {deletingFamily ? 'Deleting...' : 'Delete Profile'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ UPGRADE PRO MODAL ══════════════ */}
      {showProModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowProModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Icons.Crown />
                <h3 className="text-xl font-bold text-gray-800">Upgrade to Pro</h3>
              </div>
              <button onClick={() => setShowProModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer"><Icons.Close /></button>
            </div>
            <div className="space-y-4 mb-6">
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-xl text-center">
                <p className="text-3xl font-bold text-amber-600">$4.99</p>
                <p className="text-sm text-gray-600">per month</p>
              </div>
              <div className="space-y-2">
                <p className="font-medium text-gray-800">Pro includes:</p>
                <ul className="space-y-1">
                  <li className="flex items-center gap-2 text-sm text-gray-600">✓ Unlimited family members</li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">✓ Advanced analytics & insights</li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">✓ AI-powered refill reminders</li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">✓ Export medical reports</li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">✓ Priority support</li>
                </ul>
              </div>
              <p className="text-xs text-gray-400 text-center">Cancel anytime • No commitment</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowProModal(false)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-gray-700 font-medium hover:bg-gray-50 cursor-pointer">Cancel</button>
              <button onClick={handleProPurchase} className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg py-2.5 font-medium hover:from-amber-600 hover:to-yellow-600 cursor-pointer">Continue to Payment</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ PIN MODAL ══════════════ */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowPinModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Verify PIN</h3>
              <p className="text-sm text-gray-500 mt-1">Enter the test PIN to activate Pro</p>
            </div>
            <div className="mb-4">
              <input
                type="password" maxLength={4} value={pinInput}
                onChange={(e) => { setPinInput(e.target.value); setPinError(''); }}
                placeholder="Enter 4-digit PIN"
                className="w-full text-center text-2xl tracking-widest border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
                autoFocus
              />
              {pinError && <p className="text-xs text-red-500 mt-1 text-center">{pinError}</p>}
              <p className="text-xs text-gray-400 mt-2 text-center">Test PIN: 1234</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowPinModal(false)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-gray-700 font-medium hover:bg-gray-50 cursor-pointer">Cancel</button>
              <button onClick={verifyPin} className="flex-1 bg-teal-500 text-white rounded-lg py-2.5 font-medium hover:bg-teal-600 cursor-pointer">Verify & Upgrade</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ CHANGE PASSWORD MODAL ══════════════ */}
      {showChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowChangePassword(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Change Password</h3>
              <button onClick={() => setShowChangePassword(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer"><Icons.Close /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input type="password" value={passwordForm.current}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Enter current password" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input type="password" value={passwordForm.new}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Enter new password" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input type="password" value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Confirm new password" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowChangePassword(false)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-gray-700 font-medium hover:bg-gray-50 cursor-pointer">Cancel</button>
              <button onClick={handleChangePassword} className="flex-1 bg-teal-500 text-white rounded-lg py-2.5 font-medium hover:bg-teal-600 cursor-pointer">Update Password</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}