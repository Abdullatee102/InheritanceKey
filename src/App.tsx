import React, { useState } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LandingPage } from './features/landing/LandingPage';
import { OwnerDashboard } from './features/plans/OwnerDashboard';
import { CreatePlanWizard } from './features/plans/CreatePlanWizard';
import { BeneficiaryPortal } from './features/beneficiaries/BeneficiaryPortal';
import { PlanDetailView } from './features/plans/PlanDetailView';
import { SecurityPage } from './features/security/SecurityPage';
import { AdminPanel } from './features/admin/AdminPanel';

export function App() {
  const [activeTab, setActiveTab] = useState('landing');
  const [selectedPlanId, setSelectedPlanId] = useState<bigint | null>(null);

  const handleSelectPlan = (planId: bigint) => {
    setSelectedPlanId(planId);
    setActiveTab('plan-detail');
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#090D16] text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8">
        {activeTab === 'landing' && (
          <LandingPage
            onLaunchApp={() => setActiveTab('my-plans')}
            onCreatePlan={() => setActiveTab('create-plan')}
          />
        )}

        {activeTab === 'my-plans' && (
          <OwnerDashboard
            onCreatePlanClick={() => setActiveTab('create-plan')}
            onSelectPlan={handleSelectPlan}
          />
        )}

        {activeTab === 'create-plan' && (
          <CreatePlanWizard
            onSuccess={() => setActiveTab('my-plans')}
            onCancel={() => setActiveTab('my-plans')}
          />
        )}

        {activeTab === 'beneficiary' && <BeneficiaryPortal />}

        {activeTab === 'plan-detail' && selectedPlanId !== null && (
          <PlanDetailView
            planId={selectedPlanId}
            onBack={() => setActiveTab('my-plans')}
          />
        )}

        {activeTab === 'security' && <SecurityPage />}

        {activeTab === 'admin' && <AdminPanel />}
      </main>

      <Footer />
    </div>
  );
}

export default App;

