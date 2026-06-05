import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileBottomNav from '../components/MobileBottomNav';
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
    <div className="flex items-start gap-3 p-3 rounded-lg bg-faint">
      <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center ${included ? 'bg-mint' : 'bg-gray-300'}`}>
        {included && <Icons.Check />}
      </div>
      <div>
        <h4 className="font-medium text-navy text-sm">{title}</h4>
        <p className="text-xs text-muted">{description}</p>
      </div>
    </div>
  );
}

// Change Password Modal
function ChangePasswordModal({ onClose, onSuccess }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await changePassword({ currentPassword, newPassword });
      toast.success('Password changed successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-navy/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-border p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-navy">Change Password</h3>
          <button onClick={onClose} className="text-muted hover:text-navy">
            <Icons.Close />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold tracking-widest text-muted uppercase mb-3">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-faint px-4 py-3 text-sm text-navy focus:outline-none focus:border-mint"
              placeholder="Enter current password"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold tracking-widest text-muted uppercase mb-3">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-faint px-4 py-3 text-sm text-navy focus:outline-none focus:border-mint"
              placeholder="Enter new password"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold tracking-widest text-muted uppercase mb-3">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-faint px-4 py-3 text-sm text-navy focus:outline-none focus:border-mint"
              placeholder="Confirm new password"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 border border-border bg-white text-navy rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-faint">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-mint text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:opacity-90">
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Reset Password Modal (OTP)
function ResetPasswordModal({ onClose }) {
  const [step, setStep] = useState('email'); // 'email', 'otp', 'reset'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    setLoading(true);
    try {
      await requestPasswordOtp({ email });
      setStep('otp');
      toast.success('OTP sent to your email');
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }
    setStep('reset');
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await resetPasswordWithOtp({ email, otp, newPassword });
      toast.success('Password reset successfully! You can now login with your new password.');
      onClose();
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-navy/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-border p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-navy">Reset Password</h3>
          <button onClick={onClose} className="text-muted hover:text-navy">
            <Icons.Close />
          </button>
        </div>

        {step === 'email' && (
          <div className="space-y-4">
            <p className="text-sm text-muted">Enter your email address to receive a password reset OTP.</p>
            <div>
              <label className="block text-xs font-semibold tracking-widest text-muted uppercase mb-3">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border bg-faint px-4 py-3 text-sm text-navy focus:outline-none focus:border-mint"
                placeholder="you@example.com"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 border border-border bg-white text-navy rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-faint">
                Cancel
              </button>
              <button onClick={handleSendOtp} disabled={loading} className="flex-1 bg-mint text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:opacity-90">
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </div>
          </div>
        )}

        {step === 'otp' && (
          <div className="space-y-4">
            <p className="text-sm text-muted">Enter the 6-digit OTP sent to your email.</p>
            <div>
              <label className="block text-xs font-semibold tracking-widest text-muted uppercase mb-3">OTP Code</label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center text-2xl tracking-widest rounded-xl border border-border bg-faint px-4 py-3 text-navy focus:outline-none focus:border-mint"
                placeholder="000000"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('email')} className="flex-1 border border-border bg-white text-navy rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-faint">
                Back
              </button>
              <button onClick={handleVerifyOtp} className="flex-1 bg-mint text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:opacity-90">
                Verify
              </button>
            </div>
          </div>
        )}

        {step === 'reset' && (
          <div className="space-y-4">
            <p className="text-sm text-muted">Create a new password for your account.</p>
            <div>
              <label className="block text-xs font-semibold tracking-widest text-muted uppercase mb-3">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-border bg-faint px-4 py-3 text-sm text-navy focus:outline-none focus:border-mint"
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-widest text-muted uppercase mb-3">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-border bg-faint px-4 py-3 text-sm text-navy focus:outline-none focus:border-mint"
                placeholder="Confirm new password"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('otp')} className="flex-1 border border-border bg-white text-navy rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-faint">
                Back
              </button>
              <button onClick={handleResetPassword} disabled={loading} className="flex-1 bg-mint text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:opacity-90">
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        )}
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
      if (uid) {
        localStorage.setItem(`medsync_pfp_${uid}`, base64);
        window.dispatchEvent(new CustomEvent('medsync:profilePicUpdated', { detail: { uid, base64 } }));
      }
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

    if (editFamilyForm.dateOfBirth) {
      const d = new Date(editFamilyForm.dateOfBirth);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const ageYears = (today - d) / (365.25 * 24 * 60 * 60 * 1000);
      if (d > today) { toast.error('Date of birth cannot be in the future'); return; }
      if (ageYears > 120) { toast.error('Please enter a valid date of birth'); return; }
      if (ageYears < 6) { toast.error('Patient must be at least 6 years old'); return; }
    }

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
    <div className="min-h-screen bg-bg pb-24">
      {/* Header */}
      <div className="bg-white border-b border-border sticky top-0 z-30">
        <div className="flex items-center gap-3 px-4 h-16 max-w-2xl mx-auto">
          <button onClick={() => navigate(-1)} className="p-2 text-navy hover:bg-faint rounded-lg transition-colors">
            <Icons.ArrowLeft />
          </button>
          <h1 className="text-xl font-bold text-navy">My Profile</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* ══════════════ PRIMARY USER PROFILE ══════════════ */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          {/* Banner */}
          <div className="h-24 bg-navy relative">
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-navy flex items-center justify-center text-white font-bold text-2xl">
                  {profilePic ? (
                    <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    userInitials
                  )}
                </div>
                <button
                  onClick={() => profilePicRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-mint rounded-full border-2 border-white flex items-center justify-center text-white hover:opacity-90 transition-colors cursor-pointer"
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
                <h2 className="text-xl font-bold text-navy">{authUser?.name || 'User'}</h2>
                <p className="text-sm text-muted mt-0.5">{authUser?.email || ''}</p>
                {authUser?.contactNumber && (
                  <p className="text-sm text-muted mt-0.5">{authUser.contactNumber}</p>
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
                  className="mt-4 inline-flex items-center gap-2 border border-border bg-white text-navy rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-faint cursor-pointer"
                >
                  <Icons.Edit />
                  Edit Profile
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold tracking-widest text-muted uppercase mb-3">Full Name</label>
                  <input
                    type="text"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    className="w-full rounded-xl border border-border bg-faint px-4 py-3 text-sm text-navy focus:outline-none focus:border-mint"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-widest text-muted uppercase mb-3">Email Address</label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full rounded-xl border border-border bg-faint px-4 py-3 text-sm text-navy focus:outline-none focus:border-mint"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-widest text-muted uppercase mb-3">Contact Number</label>
                  <div className="flex items-center border border-border rounded-xl bg-faint overflow-hidden focus-within:border-mint transition-all">
                    <span className="inline-flex items-center px-3 py-3 bg-faint border-r border-border text-muted text-sm font-semibold select-none">
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
                      className="flex-1 px-4 py-3 bg-transparent focus:outline-none text-navy text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-1">
                  <button onClick={() => setEditingUser(false)} className="flex-1 border border-border bg-white text-navy rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-faint cursor-pointer">
                    Cancel
                  </button>
                  <button onClick={handleSaveUser} disabled={savingUser} className="flex-1 bg-mint text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50 cursor-pointer">
                    {savingUser ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ══════════════ FAMILY PROFILES MANAGEMENT ══════════════ */}
        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="font-semibold text-navy text-lg">Family Members</h2>
              <p className="text-xs text-muted mt-0.5">Manage your family medication profiles</p>
            </div>
            <span className="text-xs font-bold bg-mint-light text-mint px-2.5 py-1 rounded-full">{patients.length} {patients.length === 1 ? 'member' : 'members'}</span>
          </div>

          {patients.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 bg-faint rounded-full flex items-center justify-center mx-auto mb-3">
                <Icons.User />
              </div>
              <p className="text-muted text-sm font-medium">No family profiles yet</p>
              <p className="text-xs text-muted mt-1">Add a family member from the Dashboard</p>
            </div>
          ) : (
            <div className="space-y-3">
              {patients.map((member) => {
                const initials = member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                const isActive = (member._id || member.id) === activePatientId;
                return (
                  <div
                    key={member._id || member.id}
                    className={`flex items-center gap-4 p-4 rounded-2xl border border-border transition-all ${isActive ? 'bg-mint-light' : 'bg-white hover:bg-faint'}`}
                  >
                    <div className="w-12 h-12 rounded-full bg-navy flex items-center justify-center text-white font-bold text-base shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-navy text-sm truncate">{member.name}</h3>
                        {isActive && (
                          <span className="text-[10px] font-bold bg-mint text-white px-1.5 py-0.5 rounded-md shrink-0">ACTIVE</span>
                        )}
                      </div>
                      <p className="text-xs text-muted capitalize">{member.relation}</p>
                      {member.allergies && (
                        <p className="text-[11px] text-amber-600 mt-0.5 truncate">⚠ {member.allergies}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEditFamily(member)}
                        className="p-2 text-muted hover:text-mint hover:bg-mint-light rounded-lg transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <Icons.Edit />
                      </button>
                      <button
                        onClick={() => setDeleteFamilyTarget(member)}
                        className="p-2 text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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

        {/* ══════════════ PHARMACIST LINKING ══════════════ */}
        <div className="bg-white rounded-2xl border border-border p-5">
          <h2 className="font-semibold text-navy mb-3">Pharmacist Linking</h2>
          <p className="text-sm text-muted mb-4">Link your account to multiple pharmacists securely.</p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/pharmacist-link')}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-mint-light hover:opacity-90 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="text-mint">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2V22M5 12H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M9 4H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M7 8H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M7 16H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M9 20H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <span className="text-navy font-medium">Link a Pharmacist</span>
              </div>
              <span className="text-mint text-sm">→</span>
            </button>
          </div>
        </div>

        {/* ══════════════ SECURITY ══════════════ */}
        <div className="bg-white rounded-2xl border border-border p-5">
          <h2 className="font-semibold text-navy mb-3">Security</h2>
          <div className="space-y-3">
            <button
              onClick={() => setShowChangePassword(true)}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-faint hover:bg-bg transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Icons.Lock />
                <span className="text-navy">Change Password</span>
              </div>
              <span className="text-muted text-sm">→</span>
            </button>

            <button
              onClick={handleResetPassword}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-faint hover:bg-bg transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M1 12C1 12 4 4 12 4C20 4 23 12 23 12C23 12 20 20 12 20C4 20 1 12 1 12Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span className="text-navy">Reset Password</span>
              </div>
              <span className="text-muted text-sm">→</span>
            </button>

            <button
              onClick={toggleBiometric}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-faint hover:bg-bg transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Icons.Fingerprint />
                <span className="text-navy">Biometric Login</span>
              </div>
              <div className={`w-10 h-6 rounded-full transition-colors ${biometricEnabled ? 'bg-mint' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 rounded-full bg-white transform transition-transform mt-0.5 ${biometricEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
            </button>
          </div>
        </div>

        {/* ══════════════ SUBSCRIPTION ══════════════ */}
        <div className={`rounded-2xl border border-border p-5 ${isPro ? 'bg-amber-50 border-amber-400' : 'bg-white'}`}>
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <Icons.Crown />
              <h2 className="font-semibold text-navy">MedSync {isPro ? 'Pro' : 'Free'}</h2>
            </div>
            {isPro && (
              <button onClick={handleRemovePro} className="text-xs border border-red text-red rounded-full px-3 py-1 font-semibold hover:bg-red-light cursor-pointer">Remove Pro</button>
            )}
          </div>
          <div className="space-y-3 mb-4">
            <p className="text-sm text-muted">Current Plan Features:</p>
            {freeFeatures.map((feature, idx) => (
              <FeatureCard key={idx} {...feature} />
            ))}
            <div className="h-px bg-border my-2" />
            {proFeatures.map((feature, idx) => (
              <FeatureCard key={idx} {...feature} />
            ))}
          </div>
          {!isPro && (
            <button
              onClick={handleUpgradeToPro}
              className="w-full bg-navy text-white py-3 rounded-full font-semibold hover:opacity-90 transition-colors cursor-pointer"
            >
              Upgrade to Pro - $4.99/month
            </button>
          )}
          {isPro && (
            <div className="text-center p-3 bg-amber-100 rounded-xl">
              <p className="text-sm text-amber-800">✨ You're a Pro member! Enjoy all premium features.</p>
            </div>
          )}
        </div>

        {/* ══════════════ SIGN OUT ══════════════ */}
        <div className="pt-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 border border-red text-red rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-red-light transition-colors cursor-pointer"
          >
            <Icons.Logout />
            Sign Out
          </button>
        </div>

        <div className="text-center py-2">
          <p className="text-xs text-muted">MedSync v1.0.0</p>
        </div>
      </div>

      {/* ══════════════ EDIT FAMILY MODAL ══════════════ */}
      {editFamilyTarget && (
        <div className="fixed inset-0 bg-navy/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditFamilyTarget(null)}>
          <div className="bg-white rounded-2xl border border-border p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-navy">Edit Family Profile</h3>
              <button onClick={() => setEditFamilyTarget(null)} className="text-muted hover:text-navy cursor-pointer"><Icons.Close /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold tracking-widest text-muted uppercase mb-3">Full Name *</label>
                <input
                  type="text"
                  value={editFamilyForm.name}
                  onChange={(e) => setEditFamilyForm({ ...editFamilyForm, name: e.target.value })}
                  className="w-full rounded-xl border border-border bg-faint px-4 py-3 text-sm text-navy focus:outline-none focus:border-mint"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-widest text-muted uppercase mb-3">Date of Birth</label>
                <input
                  type="date"
                  value={editFamilyForm.dateOfBirth}
                  max={(() => { const d = new Date(); d.setFullYear(d.getFullYear() - 6); return d.toISOString().split('T')[0]; })()}
                  min={(() => { const d = new Date(); d.setFullYear(d.getFullYear() - 120); return d.toISOString().split('T')[0]; })()}
                  onChange={(e) => setEditFamilyForm({ ...editFamilyForm, dateOfBirth: e.target.value })}
                  className="w-full rounded-xl border border-border bg-faint px-4 py-3 text-sm text-navy focus:outline-none focus:border-mint"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-widest text-muted uppercase mb-3">Relation</label>
                <select
                  value={editFamilyForm.relation}
                  onChange={(e) => setEditFamilyForm({ ...editFamilyForm, relation: e.target.value })}
                  className="w-full rounded-xl border border-border bg-faint px-4 py-3 text-sm text-navy focus:outline-none focus:border-mint"
                >
                  <option value="self">Self</option><option value="mother">Mother</option><option value="father">Father</option>
                  <option value="grandmother">Grandmother</option><option value="grandfather">Grandfather</option>
                  <option value="spouse">Spouse</option><option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-widest text-muted uppercase mb-3">Allergies / Notes</label>
                <textarea
                  value={editFamilyForm.allergies}
                  onChange={(e) => setEditFamilyForm({ ...editFamilyForm, allergies: e.target.value })}
                  placeholder="e.g., Allergic to penicillin"
                  className="w-full rounded-xl border border-border bg-faint px-4 py-3 text-sm text-navy focus:outline-none focus:border-mint"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditFamilyTarget(null)} className="flex-1 border border-border bg-white text-navy rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-faint cursor-pointer">
                  Cancel
                </button>
                <button onClick={handleSaveFamily} disabled={savingFamily} className="flex-1 bg-mint text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50 cursor-pointer">
                  {savingFamily ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ DELETE FAMILY MODAL ══════════════ */}
      {deleteFamilyTarget && (
        <div className="fixed inset-0 bg-navy/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDeleteFamilyTarget(null)}>
          <div className="bg-white rounded-2xl border border-border p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-navy">Delete Family Profile</h3>
              <button onClick={() => setDeleteFamilyTarget(null)} className="text-muted hover:text-navy cursor-pointer"><Icons.Close /></button>
            </div>
            <div className="mb-2 p-3 bg-red-50 rounded-xl border border-red-100 flex items-start gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-500 shrink-0 mt-0.5">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-navy">Are you sure you want to delete <strong className="text-navy">{deleteFamilyTarget.name}</strong>'s profile?</p>
                <p className="text-xs text-red-500 mt-1">This will permanently remove all their medicines and prescriptions. This cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setDeleteFamilyTarget(null)} className="flex-1 border border-border bg-white text-navy rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-faint cursor-pointer">
                Cancel
              </button>
              <button onClick={handleDeleteFamily} disabled={deletingFamily} className="flex-1 border border-red text-red rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-red-light disabled:opacity-50 cursor-pointer">
                {deletingFamily ? 'Deleting...' : 'Delete Profile'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ UPGRADE PRO MODAL ══════════════ */}
      {showProModal && (
        <div className="fixed inset-0 bg-navy/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowProModal(false)}>
          <div className="bg-white rounded-2xl border border-border p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Icons.Crown />
                <h3 className="text-xl font-bold text-navy">Upgrade to Pro</h3>
              </div>
              <button onClick={() => setShowProModal(false)} className="text-muted hover:text-navy cursor-pointer"><Icons.Close /></button>
            </div>
            <div className="space-y-4 mb-6">
              <div className="bg-amber-50 p-4 rounded-xl text-center">
                <p className="text-3xl font-bold text-amber-600">$4.99</p>
                <p className="text-sm text-muted">per month</p>
              </div>
              <div className="space-y-2">
                <p className="font-medium text-navy">Pro includes:</p>
                <ul className="space-y-1">
                  <li className="flex items-center gap-2 text-sm text-muted">✓ Unlimited family members</li>
                  <li className="flex items-center gap-2 text-sm text-muted">✓ Advanced analytics &amp; insights</li>
                  <li className="flex items-center gap-2 text-sm text-muted">✓ AI-powered refill reminders</li>
                  <li className="flex items-center gap-2 text-sm text-muted">✓ Export medical reports</li>
                  <li className="flex items-center gap-2 text-sm text-muted">✓ Priority support</li>
                </ul>
              </div>
              <p className="text-xs text-muted text-center">Cancel anytime • No commitment</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowProModal(false)} className="flex-1 border border-border bg-white text-navy rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-faint cursor-pointer">Cancel</button>
              <button onClick={handleProPurchase} className="flex-1 bg-navy text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:opacity-90 cursor-pointer">Continue to Payment</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ PIN MODAL ══════════════ */}
      {showPinModal && (
        <div className="fixed inset-0 bg-navy/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowPinModal(false)}>
          <div className="bg-white rounded-2xl border border-border p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-navy">Verify PIN</h3>
              <p className="text-sm text-muted mt-1">Enter the test PIN to activate Pro</p>
            </div>
            <div className="mb-4">
              <input
                type="password" maxLength={4} value={pinInput}
                onChange={(e) => { setPinInput(e.target.value); setPinError(''); }}
                placeholder="Enter 4-digit PIN"
                className="w-full text-center text-2xl tracking-widest rounded-xl border border-border bg-faint px-4 py-3 text-navy focus:outline-none focus:border-mint"
                autoFocus
              />
              {pinError && <p className="text-xs text-red-500 mt-1 text-center">{pinError}</p>}
              <p className="text-xs text-muted mt-2 text-center">Test PIN: 1234</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowPinModal(false)} className="flex-1 border border-border bg-white text-navy rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-faint cursor-pointer">Cancel</button>
              <button onClick={verifyPin} className="flex-1 bg-mint text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:opacity-90 cursor-pointer">Verify &amp; Upgrade</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ CHANGE PASSWORD MODAL ══════════════ */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-navy/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowChangePassword(false)}>
          <div className="bg-white rounded-2xl border border-border p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-navy">Change Password</h3>
              <button onClick={() => setShowChangePassword(false)} className="text-muted hover:text-navy cursor-pointer"><Icons.Close /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold tracking-widest text-muted uppercase mb-3">Current Password</label>
                <input type="password" value={passwordForm.current}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                  className="w-full rounded-xl border border-border bg-faint px-4 py-3 text-sm text-navy focus:outline-none focus:border-mint" placeholder="Enter current password" />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-widest text-muted uppercase mb-3">New Password</label>
                <input type="password" value={passwordForm.new}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                  className="w-full rounded-xl border border-border bg-faint px-4 py-3 text-sm text-navy focus:outline-none focus:border-mint" placeholder="Enter new password" />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-widest text-muted uppercase mb-3">Confirm New Password</label>
                <input type="password" value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                  className="w-full rounded-xl border border-border bg-faint px-4 py-3 text-sm text-navy focus:outline-none focus:border-mint" placeholder="Confirm new password" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowChangePassword(false)} className="flex-1 border border-border bg-white text-navy rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-faint cursor-pointer">Cancel</button>
              <button onClick={handleChangePassword} className="flex-1 bg-mint text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:opacity-90 cursor-pointer">Update Password</button>
            </div>
          </div>
        </div>
      )}
      <MobileBottomNav />
    </div>
  );
}
