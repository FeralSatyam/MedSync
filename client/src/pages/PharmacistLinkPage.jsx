import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { generatePharmacistInvitation } from '../api/pharmacistInvitationApi';

export default function PharmacistLinkPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [invitation, setInvitation] = useState(null);

  const handleGenerateInvitation = async () => {
    setLoading(true);
    try {
      const data = await generatePharmacistInvitation();
      setInvitation(data);
      toast.success('Pharmacist invitation generated successfully!');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to generate invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="flex items-center gap-3 px-4 h-16 max-w-2xl mx-auto">
          <button onClick={() => navigate(-1)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-800">Pharmacist Linking</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-3">Link a Pharmacist</h2>
          <p className="text-sm text-gray-600 mb-6">
            Generate a secure QR code and OTP to allow a pharmacist to link to your account. Multiple pharmacists can be linked without overwriting previous links.
          </p>

          {!invitation ? (
            <button
              onClick={handleGenerateInvitation}
              disabled={loading}
              className="w-full bg-teal-500 text-white rounded-xl py-3 font-medium hover:bg-teal-600 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Generating...' : 'Generate Linking QR & OTP'}
            </button>
          ) : (
            <div className="flex flex-col items-center border border-gray-200 rounded-xl p-6 bg-gray-50">
              <p className="text-sm text-gray-500 mb-4 text-center">Have your pharmacist scan this QR code or enter the linking token.</p>
              
              <div className="bg-white p-4 rounded-xl shadow-sm mb-6 inline-block">
                <img src={invitation.qrImage} alt="Pharmacist Linking QR Code" className="w-48 h-48" />
              </div>
              
              <div className="w-full space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Linking OTP</label>
                  <div className="bg-white border border-gray-200 rounded-lg p-3 text-center text-2xl font-bold tracking-widest text-teal-600">
                    {invitation.otp}
                  </div>
                </div>
                
                <p className="text-xs text-center text-red-500 font-medium">
                  Expires at: {new Date(invitation.expiresAt).toLocaleTimeString()}
                </p>
                
                <button
                  onClick={handleGenerateInvitation}
                  disabled={loading}
                  className="w-full border border-teal-200 text-teal-600 rounded-xl py-2.5 font-medium hover:bg-teal-50 transition-colors"
                >
                  {loading ? 'Generating...' : 'Generate New Link'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
