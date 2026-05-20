import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function PharmacistDashboardPage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Dashboard');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { name: 'Scan QR', icon: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z' },
    { name: 'Search Patient', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
    { name: 'Medicine Requests', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    { name: 'Inventory', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { name: 'Prescriptions', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { name: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { name: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  ];

  return (
    <div className="flex h-screen bg-bg overflow-hidden font-body text-navy">
      {/* ── SIDEBAR ── */}
      <aside className="w-[260px] bg-card border-r border-border flex flex-col hidden md:flex z-10 shadow-sm">
        {/* Branding */}
        <div className="h-[72px] flex items-center px-[24px] border-b border-border/60">
          <div className="font-display text-[20px] font-bold text-navy tracking-tight flex items-center gap-[8px]">
            <div className="w-[32px] h-[32px] bg-navy rounded-[10px] flex items-center justify-center">
              <svg className="w-[20px] h-[20px] text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            MedSync <span className="text-mint text-[12px] uppercase tracking-wider ml-1 mt-1">Pro</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-[20px] px-[16px] space-y-[4px] custom-scrollbar">
          <div className="text-[11px] font-bold text-muted/60 uppercase tracking-wider mb-[12px] px-[8px]">
            Operations
          </div>
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={`w-full flex items-center gap-[12px] px-[14px] py-[10px] rounded-[12px] text-[13px] font-semibold transition-all duration-200 ${
                activeTab === item.name
                  ? 'bg-navy text-white shadow-sm'
                  : 'text-muted hover:bg-slate-100 hover:text-navy'
              }`}
            >
              <svg className={`w-[18px] h-[18px] ${activeTab === item.name ? 'text-mint' : 'text-muted'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              {item.name}
            </button>
          ))}
        </div>

        {/* User / Logout */}
        <div className="p-[16px] border-t border-border/60">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-[12px] px-[14px] py-[10px] rounded-[12px] text-[13px] font-semibold text-red/80 hover:bg-red/10 hover:text-red transition-colors"
          >
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Topbar */}
        <header className="h-[72px] bg-card border-b border-border/60 flex items-center justify-between px-[24px] md:px-[32px] z-10 shrink-0">
          <div className="flex items-center gap-[16px]">
            {/* Mobile menu trigger */}
            <button className="md:hidden p-[8px] -ml-[8px] text-navy">
              <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Title / Badges */}
            <div className="flex items-center gap-[12px]">
              <h1 className="font-display text-[18px] font-bold text-navy hidden sm:block">
                {user?.name || 'Pharmacy Dashboard'}
              </h1>
              <div className="hidden lg:flex items-center gap-[6px] px-[10px] py-[4px] rounded-full bg-mint/10 border border-mint/20">
                <svg className="w-[12px] h-[12px] text-mint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-[10px] font-bold text-mint uppercase tracking-wide">Verified Pharmacy</span>
              </div>
              <div className="hidden lg:flex items-center gap-[4px] px-[8px] py-[4px] rounded-full bg-navy/5 border border-navy/10">
                <div className="w-[6px] h-[6px] rounded-full bg-navy/40"></div>
                <span className="text-[10px] font-semibold text-muted uppercase tracking-wide">Secure Session</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-[20px]">
            {/* Search Bar */}
            <div className="hidden md:flex relative">
              <div className="absolute inset-y-0 left-[12px] flex items-center pointer-events-none">
                <svg className="w-[14px] h-[14px] text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search patient, QR, or phone..."
                className="w-[280px] bg-bg border-[1.5px] border-border rounded-full py-[8px] pl-[34px] pr-[16px] text-[13px] text-navy outline-none transition-colors focus:border-mint"
              />
            </div>

            {/* Notification Bell */}
            <button className="relative p-[8px] text-muted hover:text-navy transition-colors">
              <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-[6px] right-[8px] w-[8px] h-[8px] bg-red rounded-full border-2 border-card"></span>
            </button>

            {/* Profile Avatar */}
            <div className="w-[36px] h-[36px] rounded-full bg-navy text-white flex items-center justify-center font-bold text-[14px] shadow-sm border-[2px] border-mint/20 cursor-pointer">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'P'}
            </div>
          </div>
        </header>

        {/* Dashboard Scrollable Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-[24px] md:p-[32px]">
          
          {/* Dashboard Header & CTA */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-[16px] mb-[32px]">
            <div>
              <h2 className="font-display text-[24px] font-bold text-navy tracking-tight mb-[4px]">
                Overview
              </h2>
              <p className="text-[14px] text-muted">
                Monitor your daily dispensing activity and verification requests.
              </p>
            </div>
            <button className="flex items-center justify-center gap-[8px] bg-mint text-white px-[20px] py-[12px] rounded-btn font-semibold text-[14px] shadow-sm hover:bg-mint-mid transition-all active:scale-[0.98]">
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              Scan Patient QR
            </button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-[16px] mb-[32px]">
            {[
              { label: 'Total Patients', value: '1,248', trend: '+12%', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
              { label: 'Active Requests', value: '34', trend: '+5%', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
              { label: "Today's Scans", value: '142', trend: '+24%', icon: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z' },
              { label: 'Prescriptions', value: '89', trend: '-2%', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
              { label: 'Low Stock Items', value: '12', trend: 'Needs action', alert: true, icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
            ].map((kpi, idx) => (
              <div key={idx} className="bg-card p-[20px] rounded-[16px] shadow-sm border border-border/60">
                <div className="flex justify-between items-start mb-[12px]">
                  <div className={`p-[10px] rounded-[10px] ${kpi.alert ? 'bg-red/10 text-red' : 'bg-navy/5 text-navy'}`}>
                    <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={kpi.icon} />
                    </svg>
                  </div>
                  <span className={`text-[12px] font-bold ${kpi.alert ? 'text-red' : kpi.trend.startsWith('-') ? 'text-muted' : 'text-mint'}`}>
                    {kpi.trend}
                  </span>
                </div>
                <div className="text-[28px] font-display font-bold text-navy leading-none mb-[6px]">
                  {kpi.value}
                </div>
                <div className="text-[13px] font-medium text-muted">
                  {kpi.label}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-[24px]">
            {/* Recent Dispensing Activity */}
            <div className="lg:col-span-2 bg-card rounded-[16px] shadow-sm border border-border/60 overflow-hidden flex flex-col">
              <div className="p-[20px] border-b border-border/60 flex items-center justify-between">
                <h3 className="font-display text-[16px] font-bold text-navy">Recent Dispensing Activity</h3>
                <button className="text-[13px] font-semibold text-mint hover:underline">View All</button>
              </div>
              <div className="p-[0] overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-bg/50">
                      <th className="py-[12px] px-[20px] text-[11px] font-bold text-muted uppercase tracking-wider">Patient</th>
                      <th className="py-[12px] px-[20px] text-[11px] font-bold text-muted uppercase tracking-wider">Medicine</th>
                      <th className="py-[12px] px-[20px] text-[11px] font-bold text-muted uppercase tracking-wider">Time</th>
                      <th className="py-[12px] px-[20px] text-[11px] font-bold text-muted uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { patient: 'Aarav Sharma', med: 'Amoxicillin 500mg', time: '10 mins ago', status: 'Dispensed' },
                      { patient: 'Priya Patel', med: 'Lisinopril 10mg', time: '45 mins ago', status: 'Pending Verification' },
                      { patient: 'Rahul Verma', med: 'Metformin 500mg', time: '2 hours ago', status: 'Dispensed' },
                      { patient: 'Sneha Gupta', med: 'Atorvastatin 20mg', time: '3 hours ago', status: 'Dispensed' },
                    ].map((row, i) => (
                      <tr key={i} className="border-b border-border/30 last:border-0 hover:bg-slate-50 transition-colors">
                        <td className="py-[14px] px-[20px] text-[13px] font-semibold text-navy">{row.patient}</td>
                        <td className="py-[14px] px-[20px] text-[13px] text-muted">{row.med}</td>
                        <td className="py-[14px] px-[20px] text-[13px] text-muted">{row.time}</td>
                        <td className="py-[14px] px-[20px]">
                          <span className={`px-[10px] py-[4px] rounded-full text-[11px] font-bold tracking-wide ${
                            row.status === 'Dispensed' ? 'bg-mint/10 text-mint' : 'bg-orange-100 text-orange-600'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Prescription Verification Panel */}
            <div className="bg-card rounded-[16px] shadow-sm border border-border/60 flex flex-col">
              <div className="p-[20px] border-b border-border/60">
                <h3 className="font-display text-[16px] font-bold text-navy">Pending Verification</h3>
              </div>
              <div className="p-[20px] flex-1 flex flex-col gap-[16px]">
                {/* Dummy Request */}
                <div className="border border-border rounded-[12px] p-[16px] relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-[4px] h-full bg-orange-400"></div>
                  <div className="flex justify-between items-start mb-[12px]">
                    <div>
                      <div className="text-[14px] font-bold text-navy">Priya Patel</div>
                      <div className="text-[12px] text-muted">ID: QR-8492-X</div>
                    </div>
                    <span className="text-[11px] font-bold bg-orange-100 text-orange-600 px-[8px] py-[2px] rounded-[6px]">Action Required</span>
                  </div>
                  <div className="bg-bg rounded-[8px] p-[12px] mb-[16px]">
                    <div className="text-[13px] font-semibold text-navy">Lisinopril 10mg</div>
                    <div className="text-[12px] text-muted">1 tablet daily, Morning</div>
                  </div>
                  <div className="flex gap-[8px]">
                    <button className="flex-1 bg-mint text-white py-[8px] rounded-[8px] text-[12px] font-semibold hover:bg-mint-mid transition-colors">Verify & Dispense</button>
                    <button className="px-[12px] py-[8px] border border-border rounded-[8px] text-[12px] font-semibold text-muted hover:text-navy hover:bg-slate-50 transition-colors">Details</button>
                  </div>
                </div>
                
                {/* Empty State style fallback */}
                <div className="flex-1 flex flex-col items-center justify-center text-center py-[20px]">
                  <div className="w-[48px] h-[48px] bg-slate-50 rounded-full flex items-center justify-center mb-[12px]">
                    <svg className="w-[24px] h-[24px] text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-[13px] font-semibold text-navy mb-[4px]">All caught up</div>
                  <div className="text-[12px] text-muted">No more prescriptions to verify.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
