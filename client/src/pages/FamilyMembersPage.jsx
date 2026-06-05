import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getPatients, updatePatient, deletePatient, createPatient } from '../api/patientApi';
import { useAuthStore } from '../store/authStore';

// ── Date helpers ─────────────────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().split('T')[0];
const minDOBStr = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 120);
  return d.toISOString().split('T')[0];
};
const maxDOBStr = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 6);
  return d.toISOString().split('T')[0];
};
function validateDOB(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (d > today) return 'Date of birth cannot be in the future';
  const ageYears = (today - d) / (365.25 * 24 * 60 * 60 * 1000);
  if (ageYears > 120) return 'Please enter a valid date of birth';
  if (ageYears < 6) return 'Patient must be at least 6 years old';
  return null;
}

const Icons = {
  ArrowLeft: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 18L9 12L15 6"/>
    </svg>
  ),
  Edit: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 3l4 4-7 7H10v-4l7-7z"/>
      <path d="M3 21h18"/>
    </svg>
  ),
  Delete: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h16M10 11v6M14 11v6M5 7l1 13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-13M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/>
    </svg>
  ),
  Add: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Close: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6L18 18"/>
    </svg>
  ),
  User: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4"/>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    </svg>
  ),
};

// Edit Modal Component
function EditMemberModal({ member, onClose, onSave }) {
  const [name, setName] = useState(member.name);
  const [relation, setRelation] = useState(member.relation);
  const [dateOfBirth, setDateOfBirth] = useState(member.dateOfBirth?.split('T')[0] || '');
  const [allergies, setAllergies] = useState(member.allergies || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error('Name is required'); return; }
    const dobErr = validateDOB(dateOfBirth);
    if (dobErr) { toast.error(dobErr); return; }

    setSaving(true);
    try {
      await onSave(member._id, { name, relation, dateOfBirth, allergies });
      onClose();
    } catch (error) {
      console.error('Error updating member:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-navy/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-border max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-navy">Edit Family Member</h3>
          <button onClick={onClose} className="text-muted hover:text-navy">
            <Icons.Close />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Full Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-border bg-faint px-4 py-3 text-sm text-navy focus:outline-none focus:border-mint"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1">Relation</label>
            <select
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              className="w-full rounded-xl border border-border bg-faint px-4 py-3 text-sm text-navy focus:outline-none focus:border-mint"
            >
              <option value="self">Self</option>
              <option value="mother">Mother</option>
              <option value="father">Father</option>
              <option value="grandmother">Grandmother</option>
              <option value="grandfather">Grandfather</option>
              <option value="spouse">Spouse</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1">Date of Birth</label>
            <input
              type="date"
              value={dateOfBirth}
              min={minDOBStr()}
              max={maxDOBStr()}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full rounded-xl border border-border bg-faint px-4 py-3 text-sm text-navy focus:outline-none focus:border-mint"
            />
            <p className="text-xs text-muted mt-1">Patient must be between 6 and 120 years old</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1">Allergies / Notes</label>
            <textarea
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-border bg-faint px-4 py-3 text-sm text-navy focus:outline-none focus:border-mint"
              placeholder="e.g., Allergic to penicillin"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 border border-border bg-white text-navy rounded-full py-2.5 text-sm font-semibold hover:bg-faint">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={saving} className="flex-1 bg-mint text-white rounded-full py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Delete Confirmation Modal
function DeleteMemberModal({ member, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 bg-navy/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-border max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-navy">Delete Family Member</h3>
          <button onClick={onClose} className="text-muted hover:text-navy">
            <Icons.Close />
          </button>
        </div>

        <p className="text-muted mb-4">
          Are you sure you want to delete <strong className="text-navy">{member.name}</strong>?
          This action cannot be undone and will remove all associated medicines.
        </p>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-border bg-white text-navy rounded-full py-2.5 text-sm font-semibold hover:bg-faint">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 border border-red text-red rounded-full py-2.5 text-sm font-semibold hover:bg-red-light">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// Add Member Modal
function AddMemberModal({ onClose, onAdd }) {
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('self');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [allergies, setAllergies] = useState('');
  const [pharmacyPin, setPharmacyPin] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error('Name is required'); return; }
    if (!pharmacyPin || pharmacyPin.length !== 4) { toast.error('Pharmacy PIN must be exactly 4 digits'); return; }
    const dobErr = validateDOB(dateOfBirth);
    if (dobErr) { toast.error(dobErr); return; }

    setSaving(true);
    try {
      await onAdd({ name, relation, dateOfBirth, allergies, pharmacyPin });
      onClose();
    } catch (error) {
      console.error('Error adding member:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-navy/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-border max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-navy">Add Family Member</h3>
          <button onClick={onClose} className="text-muted hover:text-navy">
            <Icons.Close />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Full Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-border bg-faint px-4 py-3 text-sm text-navy focus:outline-none focus:border-mint"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1">Relation</label>
            <select
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              className="w-full rounded-xl border border-border bg-faint px-4 py-3 text-sm text-navy focus:outline-none focus:border-mint"
            >
              <option value="self">Self</option>
              <option value="mother">Mother</option>
              <option value="father">Father</option>
              <option value="grandmother">Grandmother</option>
              <option value="grandfather">Grandfather</option>
              <option value="spouse">Spouse</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1">Date of Birth</label>
            <input
              type="date"
              value={dateOfBirth}
              min={minDOBStr()}
              max={maxDOBStr()}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full rounded-xl border border-border bg-faint px-4 py-3 text-sm text-navy focus:outline-none focus:border-mint"
            />
            <p className="text-xs text-muted mt-1">Patient must be between 6 and 120 years old</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1">Allergies / Notes</label>
            <textarea
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-border bg-faint px-4 py-3 text-sm text-navy focus:outline-none focus:border-mint"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1">Pharmacy PIN (4-digit) *</label>
            <input
              type="text"
              maxLength={4}
              value={pharmacyPin}
              onChange={(e) => setPharmacyPin(e.target.value.replace(/\D/g, ''))}
              className="w-full rounded-xl border border-border bg-faint px-4 py-3 text-sm text-navy focus:outline-none focus:border-mint"
            />
            <p className="text-xs text-muted mt-1">Required for pharmacy verification</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 border border-border bg-white text-navy rounded-full py-2.5 text-sm font-semibold hover:bg-faint">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={saving} className="flex-1 bg-mint text-white rounded-full py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60">
              {saving ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FamilyMembersPage() {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingMember, setEditingMember] = useState(null);
  const [deletingMember, setDeletingMember] = useState(null);
  const [addingMember, setAddingMember] = useState(false);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const data = await getPatients();
      setMembers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading members:', error);
      toast.error('Failed to load family members');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMember = async (id, updates) => {
    try {
      await updatePatient(id, updates);
      toast.success('Member updated successfully');
      await loadMembers();
    } catch (error) {
      console.error('Error updating member:', error);
      toast.error('Failed to update member');
    }
  };

  const handleDeleteMember = async (id) => {
    try {
      await deletePatient(id);
      toast.success('Member deleted successfully');
      await loadMembers();
    } catch (error) {
      console.error('Error deleting member:', error);
      toast.error('Failed to delete member');
    }
  };

  const handleAddMember = async (memberData) => {
    try {
      await createPatient(memberData);
      toast.success('Member added successfully');
      await loadMembers();
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error('Failed to add member');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mint"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg pb-24">
      {/* Header */}
      <div className="bg-white border-b border-border sticky top-0 z-30">
        <div className="flex items-center gap-3 px-4 h-16">
          <button onClick={() => navigate('/profile')} className="p-2 text-muted hover:bg-faint rounded-lg">
            <Icons.ArrowLeft />
          </button>
          <h1 className="text-xl font-bold text-navy">Family Members</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Add Member Button */}
        <button
          onClick={() => setAddingMember(true)}
          className="w-full mb-6 flex items-center justify-center gap-2 bg-mint text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition-colors"
        >
          <Icons.Add />
          Add Family Member
        </button>

        {/* Members List */}
        <div className="space-y-3">
          {members.map((member) => (
            <div key={member._id} className="bg-white rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-mint rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy">{member.name}</h3>
                    <p className="text-xs text-muted capitalize">{member.relation}</p>
                    {member.dateOfBirth && (
                      <p className="text-xs text-muted">{new Date(member.dateOfBirth).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingMember(member)}
                    className="p-2 text-muted hover:text-mint hover:bg-mint-light rounded-lg transition-colors"
                  >
                    <Icons.Edit />
                  </button>
                  <button
                    onClick={() => setDeletingMember(member)}
                    className="p-2 text-muted hover:text-red hover:bg-red-light rounded-lg transition-colors"
                  >
                    <Icons.Delete />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {members.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-border p-5">
            <Icons.User />
            <p className="text-muted mt-2">No family members added yet</p>
            <p className="text-xs text-muted mt-1">Click "Add Family Member" to get started</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {editingMember && (
        <EditMemberModal
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSave={handleUpdateMember}
        />
      )}

      {deletingMember && (
        <DeleteMemberModal
          member={deletingMember}
          onClose={() => setDeletingMember(null)}
          onConfirm={() => {
            handleDeleteMember(deletingMember._id);
            setDeletingMember(null);
          }}
        />
      )}

      {addingMember && (
        <AddMemberModal
          onClose={() => setAddingMember(false)}
          onAdd={handleAddMember}
        />
      )}
    </div>
  );
}
