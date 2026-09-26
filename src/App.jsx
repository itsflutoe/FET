import React from 'react';
import { CompanionProvider,useCompanion } from './hooks/useCompanion';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
function Main(){const {profile}=useCompanion();return profile?<Dashboard/>:<Onboarding/>}
export default function App(){return <CompanionProvider><Main/></CompanionProvider>}
