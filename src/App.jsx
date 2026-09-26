import React from 'react';
import { CompanionProvider, useCompanion } from './hooks/useCompanion';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';

function Main() {
  const { profile } = useCompanion();
  return profile ? <Dashboard /> : <Onboarding />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <CompanionProvider>
        <Main />
      </CompanionProvider>
    </ErrorBoundary>
  );
}
