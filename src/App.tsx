import React, { useState } from 'react';
import { useData } from './hooks/useData';
import { Sidebar, ActiveTab } from './components/layout/Sidebar';
import { TopNavbar } from './components/layout/TopNavbar';
import { KpiCards } from './components/dashboard/KpiCards';
import { TrendChart } from './components/dashboard/TrendChart';
import { DealerChart } from './components/dashboard/DealerChart';
import { RingAreaChart } from './components/dashboard/RingAreaChart';
import { LeaderboardSA } from './components/dashboard/LeaderboardSA';
import { ReminderTable } from './components/reminder/ReminderTable';
import { VehicleHistory } from './components/history/VehicleHistory';
import { DecTable } from './components/dec/DecTable';
import { DecFormModal } from './components/dec/DecFormModal';
import { DecImportModal } from './components/dec/DecImportModal';
import { ServiceCallTable } from './components/serviceCall/ServiceCallTable';
import { ServiceCallFormModal } from './components/serviceCall/ServiceCallFormModal';
import { ServiceCallImportModal } from './components/serviceCall/ServiceCallImportModal';
import { DECRecord, ServiceCallRecord } from './types';

export default function App() {
  const {
    decList,
    serviceCallList,
    reminders,
    kpis,
    trendData,
    trendPeriod,
    setTrendPeriod,
    dealerDistribution,
    ringAreaDistribution,
    saLeaderboard,
    loading,
    refreshing,
    loadData,
    apiConfig,
    addDEC,
    updateDEC,
    deleteDEC,
    addServiceCall,
    updateServiceCall,
    deleteServiceCall,
    importDEC,
    importServiceCalls
  } = useData();

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modal states
  const [decModalOpen, setDecModalOpen] = useState(false);
  const [editingDEC, setEditingDEC] = useState<DECRecord | null>(null);
  const [decImportOpen, setDecImportOpen] = useState(false);

  const [svcModalOpen, setSvcModalOpen] = useState(false);
  const [editingSvc, setEditingSvc] = useState<ServiceCallRecord | null>(null);
  const [svcImportOpen, setSvcImportOpen] = useState(false);

  const isConnected = Boolean(apiConfig.webAppUrl && apiConfig.webAppUrl.trim().length > 0);

  return (
    <div className="flex h-screen w-screen bg-slate-100 font-sans text-slate-900 overflow-hidden select-none">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        isConnected={isConnected}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Navbar */}
        <TopNavbar
          activeTab={activeTab}
          refreshing={refreshing}
          onRefresh={() => loadData(true)}
          isConnected={isConnected}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        {/* Content View Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* KPI Section */}
              <KpiCards kpis={kpis} />

              {/* Row 1: Trend Chart & Top 5 Dealers */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                <div className="lg:col-span-7">
                  <TrendChart
                    data={trendData}
                    serviceCallList={serviceCallList}
                    period={trendPeriod}
                    setPeriod={setTrendPeriod}
                  />
                </div>
                <div className="lg:col-span-5">
                  <DealerChart data={dealerDistribution} />
                </div>
              </div>

              {/* Row 2: Ring Area Distribution & SA Leaderboard */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                <div className="lg:col-span-5">
                  <RingAreaChart data={ringAreaDistribution} />
                </div>
                <div className="lg:col-span-7">
                  <LeaderboardSA leaderboard={saLeaderboard} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REMINDER SERVICE */}
          {activeTab === 'reminder' && (
            <div className="max-w-7xl mx-auto">
              <ReminderTable reminders={reminders} loading={loading} />
            </div>
          )}

          {/* TAB 3: RIWAYAT UNIT */}
          {activeTab === 'history' && (
            <div className="max-w-7xl mx-auto">
              <VehicleHistory serviceCalls={serviceCallList} loading={loading} />
            </div>
          )}

          {/* TAB 4: INPUT DEC */}
          {activeTab === 'dec' && (
            <div className="max-w-7xl mx-auto">
              <DecTable
                data={decList}
                loading={loading}
                onAdd={() => {
                  setEditingDEC(null);
                  setDecModalOpen(true);
                }}
                onEdit={(rec) => {
                  setEditingDEC(rec);
                  setDecModalOpen(true);
                }}
                onDelete={deleteDEC}
                onOpenImport={() => setDecImportOpen(true)}
              />
            </div>
          )}

          {/* TAB 5: INPUT SERVICE CALL */}
          {activeTab === 'service_call' && (
            <div className="max-w-7xl mx-auto">
              <ServiceCallTable
                data={serviceCallList}
                loading={loading}
                onAdd={() => {
                  setEditingSvc(null);
                  setSvcModalOpen(true);
                }}
                onEdit={(rec) => {
                  setEditingSvc(rec);
                  setSvcModalOpen(true);
                }}
                onDelete={deleteServiceCall}
                onOpenImport={() => setSvcImportOpen(true)}
              />
            </div>
          )}
        </main>
      </div>

      {/* DEC Form Modal */}
      <DecFormModal
        isOpen={decModalOpen}
        onClose={() => setDecModalOpen(false)}
        initialData={editingDEC}
        onSave={async (record) => {
          if (editingDEC) {
            await updateDEC(record);
          } else {
            await addDEC(record);
          }
        }}
      />

      {/* DEC Import Modal */}
      <DecImportModal
        isOpen={decImportOpen}
        onClose={() => setDecImportOpen(false)}
        onImportSuccess={async (recs) => {
          await importDEC(recs);
        }}
      />

      {/* Service Call Form Modal */}
      <ServiceCallFormModal
        isOpen={svcModalOpen}
        onClose={() => setSvcModalOpen(false)}
        initialData={editingSvc}
        onSave={async (record) => {
          if (editingSvc) {
            await updateServiceCall(record);
          } else {
            await addServiceCall(record);
          }
        }}
      />

      {/* Service Call Import Modal */}
      <ServiceCallImportModal
        isOpen={svcImportOpen}
        onClose={() => setSvcImportOpen(false)}
        existingData={serviceCallList}
        onImportSuccess={async (recs, mode) => {
          await importServiceCalls(recs, mode);
        }}
      />
    </div>
  );
}
