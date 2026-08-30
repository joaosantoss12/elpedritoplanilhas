import { AuthProvider } from './context/AuthContext';
import { PlanilhaPage } from './pages/PlanilhaPage';

export default function App() {
  return (
    <AuthProvider>
      <PlanilhaPage />
    </AuthProvider>
  );
}
