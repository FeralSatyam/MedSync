import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import { getPatients, updatePatient } from '../api/patientApi';
import { changePassword, requestPasswordOtp, resetPasswordWithOtp } from '../api/authApi';

// SVG Icons
const Icons = {
  Camera: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
  User: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  Users: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18l6-6-6-6"/>
    </svg>
  ),
};

// Family Member Component
function FamilyMemberCard({ member, isActive, onSelect, onImageUpload, imagePreview }) {
  const initials = member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const fileInputRef = useRef(null);

  return (
    <div 
      className={`p-4 rounded-xl cursor-pointer transition-all ${isActive ? 'bg-teal-50 border-2 border-teal-500' : 'bg-white border border-gray-200'}`}
      onClick={() => onSelect(member)}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold text-lg">
            {imagePreview || initials}
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full shadow-md"
          >
            <Icons.Camera />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onImageUpload(member, e)} />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">{member.name}</h3>
          <p className="text-xs text-gray-500 capitalize">{member.relation}</p>
        </div>
      </div>
    </div>
  );
}

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Change Password</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <Icons.Close />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Enter current password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Enter new password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Confirm new password"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-gray-700 font-medium hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-teal-500 text-white rounded-lg py-2.5 font-medium hover:bg-teal-600">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Reset Password</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <Icons.Close />
          </button>
        </div>

        {step === 'email' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Enter your email address to receive a password reset OTP.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="you@example.com"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-gray-700 font-medium hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleSendOtp} disabled={loading} className="flex-1 bg-teal-500 text-white rounded-lg py-2.5 font-medium hover:bg-teal-600">
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </div>
          </div>
        )}

        {step === 'otp' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Enter the 6-digit OTP sent to your email.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">OTP Code</label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center text-2xl tracking-widest border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="000000"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('email')} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-gray-700 font-medium hover:bg-gray-50">
                Back
              </button>
              <button onClick={handleVerifyOtp} className="flex-1 bg-teal-500 text-white rounded-lg py-2.5 font-medium hover:bg-teal-600">
                Verify
              </button>
            </div>
          </div>
        )}

        {step === 'reset' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Create a new password for your account.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Confirm new password"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('otp')} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-gray-700 font-medium hover:bg-gray-50">
                Back
              </button>
              <button onClick={handleResetPassword} disabled={loading} className="flex-1 bg-teal-500 text-white rounded-lg py-2.5 font-medium hover:bg-teal-600">
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
  const [patients, setPatients] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isPro, setIsPro] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [memberImages, setMemberImages] = useState({});

  // Get auth store for logout and user data
  const logout = useAuthStore((s) => s.logout);
  const authUser = useAuthStore((s) => s.user);

  // Load patients
  useEffect(() => {
    loadPatients();
    // Check if user has pro subscription (from localStorage for testing)
    const proStatus = localStorage.getItem('medsync_pro_status');
    if (proStatus === 'active') {
      setIsPro(true);
    }
    // Check biometric setting
    const bioStatus = localStorage.getItem('medsync_biometric');
    if (bioStatus === 'enabled') {
      setBiometricEnabled(true);
    }
  }, []);

  const loadPatients = async () => {
    try {
      const data = await getPatients();
      setPatients(Array.isArray(data) ? data : []);
      if (data && data.length > 0) {
        setSelectedMember(data[0]);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  const handleImageUpload = async (member, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setMemberImages(prev => ({ ...prev, [member._id]: previewUrl }));
    toast.success('Profile picture updated (demo)');
  };

  const handleLogout = () => {
    // Clear all auth data
    logout();
    localStorage.removeItem('medsync-auth');
    localStorage.removeItem('medsync_pro_status');
    localStorage.removeItem('medsync_biometric');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleUpgradeToPro = () => {
    setShowProModal(true);
  };

  const handleProPurchase = () => {
    setShowProModal(false);
    setShowPinModal(true);
    setPinInput('');
    setPinError('');
  };

  const verifyPin = () => {
    if (pinInput === '1234') {
      localStorage.setItem('medsync_pro_status', 'active');
      setIsPro(true);
      setShowPinModal(false);
      toast.success('Successfully upgraded to Pro!');
    } else {
      setPinError('Invalid PIN. Please try again.');
    }
  };

  const handleRemovePro = () => {
    localStorage.removeItem('medsync_pro_status');
    setIsPro(false);
    toast.success('Pro subscription removed');
  };

  const toggleBiometric = () => {
    if (!biometricEnabled) {
      if (window.PublicKeyCredential) {
        toast.success('Biometric authentication enabled (demo)');
        localStorage.setItem('medsync_biometric', 'enabled');
        setBiometricEnabled(true);
      } else {
        toast.error('Biometric authentication not supported on this device');
      }
    } else {
      localStorage.removeItem('medsync_biometric');
      setBiometricEnabled(false);
      toast.success('Biometric authentication disabled');
    }
  };

  // Pro features list
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
        <div className="flex items-center gap-3 px-4 h-16">
          <button onClick={() => navigate(-1)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Icons.ArrowLeft />
          </button>
          <h1 className="text-xl font-bold text-gray-800">Profile</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Current Account Holder Section */}
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Icons.User />
            </div>
            <div>
              <p className="text-white/80 text-sm">Account Holder</p>
              <h2 className="text-xl font-bold">{authUser?.name || 'User'}</h2>
              <p className="text-white/80 text-sm mt-1">{authUser?.email || 'user@example.com'}</p>
            </div>
          </div>
        </div>

        {/* Family Members Section - Click to Manage */}
        <div 
          onClick={() => navigate('/family-members')}
          className="bg-white rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-all border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                <Icons.Users />
              </div>
              <div>
                <h2 className="font-semibold text-gray-800">Family Members</h2>
                <p className="text-xs text-gray-500">{patients.length} member{patients.length !== 1 ? 's' : ''} in your family</p>
              </div>
            </div>
            <Icons.ChevronRight />
          </div>
        </div>

        {/* Selected Member Details */}
        {selectedMember && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h2 className="font-semibold text-gray-800 mb-3">Member Details</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Full Name</label>
                <p className="text-gray-800 font-medium">{selectedMember.name}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Relation</label>
                <p className="text-gray-800 font-medium capitalize">{selectedMember.relation}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Date of Birth</label>
                <p className="text-gray-800 font-medium">{selectedMember.dateOfBirth || 'Not set'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Allergies / Notes</label>
                <p className="text-gray-800 font-medium">{selectedMember.allergies || 'None'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Pharmacy PIN</label>
                <p className="text-gray-800 font-medium">{'•'.repeat(4)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Family Members List */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-3">All Family Members</h2>
          <div className="space-y-2">
            {patients.map((member) => (
              <FamilyMemberCard
                key={member._id}
                member={member}
                isActive={selectedMember?._id === member._id}
                onSelect={setSelectedMember}
                onImageUpload={handleImageUpload}
                imagePreview={memberImages[member._id]}
              />
            ))}
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-3">Security</h2>
          <div className="space-y-3">
            <button 
              onClick={() => setShowChangePassword(true)}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Icons.Lock />
                <span className="text-gray-700">Change Password</span>
              </div>
              <span className="text-gray-400 text-sm">→</span>
            </button>

            <button 
              onClick={() => setShowResetPassword(true)}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
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
              className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
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

        {/* Subscription Section */}
        <div className={`rounded-xl p-4 shadow-sm ${isPro ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-400' : 'bg-white'}`}>
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <Icons.Crown />
              <h2 className="font-semibold text-gray-800">MedSync {isPro ? 'Pro' : 'Free'}</h2>
            </div>
            {isPro && (
              <button onClick={handleRemovePro} className="text-xs text-red-500 hover:text-red-600">Remove Pro</button>
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
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white py-3 rounded-lg font-semibold hover:from-amber-600 hover:to-yellow-600 transition-colors"
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

        {/* Sign Out Button */}
        <div className="pt-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-4 text-red-600 font-semibold hover:bg-red-100 transition-colors"
          >
            <Icons.Logout />
            Sign Out
          </button>
        </div>

        {/* Version Info */}
        <div className="text-center py-2">
          <p className="text-xs text-gray-400">MedSync v1.0.0</p>
        </div>
      </div>

      {/* Upgrade to Pro Modal */}
      {showProModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowProModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Icons.Crown />
                <h3 className="text-xl font-bold text-gray-800">Upgrade to Pro</h3>
              </div>
              <button onClick={() => setShowProModal(false)} className="text-gray-400 hover:text-gray-600">
                <Icons.Close />
              </button>
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
              <button onClick={() => setShowProModal(false)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-gray-700 font-medium hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleProPurchase} className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg py-2.5 font-medium hover:from-amber-600 hover:to-yellow-600">
                Continue to Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIN Verification Modal for Testing */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowPinModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Verify PIN</h3>
              <p className="text-sm text-gray-500 mt-1">Enter the test PIN to activate Pro</p>
            </div>
            
            <div className="mb-4">
              <input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => { setPinInput(e.target.value); setPinError(''); }}
                placeholder="Enter 4-digit PIN"
                className="w-full text-center text-2xl tracking-widest border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
                autoFocus
              />
              {pinError && <p className="text-xs text-red-500 mt-1 text-center">{pinError}</p>}
              <p className="text-xs text-gray-400 mt-2 text-center">Test PIN: 1234</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowPinModal(false)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-gray-700 font-medium hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={verifyPin} className="flex-1 bg-teal-500 text-white rounded-lg py-2.5 font-medium hover:bg-teal-600">
                Verify & Upgrade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <ChangePasswordModal
          onClose={() => setShowChangePassword(false)}
          onSuccess={() => setShowChangePassword(false)}
        />
      )}

      {/* Reset Password Modal */}
      {showResetPassword && (
        <ResetPasswordModal
          onClose={() => setShowResetPassword(false)}
        />
      )}
    </div>
  );
}