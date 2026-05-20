import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPatientByQrToken } from '../api/patientApi';
import { getMedicinesForPatient } from '../api/medicineApi';
import { getStockStatus } from '../utils/stockUtils';

export default function PharmacistPage() {
  const { qrToken } = useParams();
  const [patient, setPatient] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!qrToken) {
      setError('Invalid QR code');
      setLoading(false);
      return;
    }
    loadPatientData();
  }, [qrToken]);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      console.log('Loading patient with token:', qrToken);
      const patientData = await getPatientByQrToken(qrToken);
      console.log('Patient data:', patientData);
      setPatient(patientData);
      
      const medicinesData = await getMedicinesForPatient(patientData._id);
      console.log('Medicines:', medicinesData);
      setMedicines(medicinesData);
    } catch (err) {
      console.error('Error loading patient data:', err);
      setError('Unable to load patient information. The QR code may be invalid.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading patient information...</p>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Unable to Load Information</h2>
          <p className="text-gray-500 mb-4">{error || 'Invalid QR code. Please try again.'}</p>
          <p className="text-xs text-gray-400">Token: {qrToken}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-teal-600 text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-5">
          <h1 className="text-xl font-bold">MedSync Pharmacist View</h1>
          <p className="text-teal-100 text-sm mt-1">Verified Patient Information</p>
        </div>
      </div>
      
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Patient Info */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-2xl">{patient.name?.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{patient.name}</h2>
              <p className="text-gray-500 capitalize">{patient.relation}</p>
            </div>
          </div>
          
          {patient.allergies && patient.allergies !== 'None' && patient.allergies !== '' && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg">
              <p className="text-sm font-medium text-red-800">⚠️ Allergy Alert: {patient.allergies}</p>
            </div>
          )}
        </div>
        
        {/* Medicines List */}
        <h3 className="font-semibold text-gray-800 text-lg mb-3">Prescribed Medicines ({medicines.length})</h3>
        
        {medicines.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <p className="text-gray-500">No medicines prescribed</p>
          </div>
        ) : (
          <div className="space-y-3">
            {medicines.map((medicine, idx) => {
              const { status } = getStockStatus(medicine);
              const dailyConsumption = medicine.frequencyPerDay * medicine.dosePerIntake;
              const daysRemaining = Math.floor(medicine.currentStock / dailyConsumption) || 0;
              
              return (
                <div key={idx} className="bg-white rounded-xl p-4 shadow-sm border">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-800">{medicine.name}</h4>
                      <p className="text-gray-500 text-sm">{medicine.strength}{medicine.unit}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      status === 'red' ? 'bg-red-100 text-red-700' : 
                      status === 'amber' ? 'bg-yellow-100 text-yellow-700' : 
                      'bg-green-100 text-green-700'
                    }`}>
                      {status === 'red' ? 'Critical' : status === 'amber' ? 'Low Stock' : 'In Stock'}
                    </span>
                  </div>
                  
                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Stock Remaining</span>
                      <span className="font-medium">{medicine.currentStock} tablets</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${status === 'red' ? 'bg-red-500' : status === 'amber' ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(100, (medicine.currentStock / (medicine.refillThreshold * dailyConsumption)) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{daysRemaining} days remaining</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t">
                    <div>
                      <p className="text-gray-500 text-xs">Dosage</p>
                      <p className="font-medium">{medicine.dosePerIntake} × {medicine.frequencyPerDay}/day</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Daily Consumption</p>
                      <p className="font-medium">{dailyConsumption} tablets</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}