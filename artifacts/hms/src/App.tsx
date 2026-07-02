import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toast';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';

import { AppLayout } from '@/components/layout/AppLayout';
import NotFound from '@/pages/not-found';
import Login from '@/pages/login';
import Dashboard from '@/pages/dashboard';
import Patients from '@/pages/patients';
import NewPatient from '@/pages/patients/new';
import PatientProfile from '@/pages/patients/profile';
import Doctors from '@/pages/doctors';
import NewDoctor from '@/pages/doctors/new';
import DoctorProfile from '@/pages/doctors/profile';
import Appointments from '@/pages/appointments';
import NewAppointment from '@/pages/appointments/new';
import Admissions from '@/pages/admissions';
import NewAdmission from '@/pages/admissions/new';
import MedicalRecords from '@/pages/medical-records';
import LabOrders from '@/pages/lab-orders';
import Pharmacy from '@/pages/pharmacy';
import Billing from '@/pages/billing';
import NewInvoice from '@/pages/billing/new';
import Staff from '@/pages/staff';
import Departments from '@/pages/departments';
import Settings from '@/pages/settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function ProtectedRoute({ component: Component }: { component: any }) {
  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => { window.location.href = '/dashboard'; return null; }} />
      <Route path="/login" component={Login} />
      
      {/* Protected Routes wrapped in AppLayout */}
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      
      <Route path="/patients" component={() => <ProtectedRoute component={Patients} />} />
      <Route path="/patients/new" component={() => <ProtectedRoute component={NewPatient} />} />
      <Route path="/patients/:id" component={() => <ProtectedRoute component={PatientProfile} />} />
      
      <Route path="/doctors" component={() => <ProtectedRoute component={Doctors} />} />
      <Route path="/doctors/new" component={() => <ProtectedRoute component={NewDoctor} />} />
      <Route path="/doctors/:id" component={() => <ProtectedRoute component={DoctorProfile} />} />
      
      <Route path="/appointments" component={() => <ProtectedRoute component={Appointments} />} />
      <Route path="/appointments/new" component={() => <ProtectedRoute component={NewAppointment} />} />
      
      <Route path="/admissions" component={() => <ProtectedRoute component={Admissions} />} />
      <Route path="/admissions/new" component={() => <ProtectedRoute component={NewAdmission} />} />
      
      <Route path="/medical-records" component={() => <ProtectedRoute component={MedicalRecords} />} />
      <Route path="/lab-orders" component={() => <ProtectedRoute component={LabOrders} />} />
      <Route path="/pharmacy" component={() => <ProtectedRoute component={Pharmacy} />} />
      
      <Route path="/billing" component={() => <ProtectedRoute component={Billing} />} />
      <Route path="/billing/new" component={() => <ProtectedRoute component={NewInvoice} />} />
      
      <Route path="/staff" component={() => <ProtectedRoute component={Staff} />} />
      <Route path="/departments" component={() => <ProtectedRoute component={Departments} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
