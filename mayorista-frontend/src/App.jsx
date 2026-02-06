import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DarkModeProvider } from './context/DarkModeContext';
import { AppRouter } from './router/AppRouter';
import './App.css'; // Keep existing styles if any

function App() {
  return (
    <DarkModeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </AuthProvider>
    </DarkModeProvider>
  );
}

export default App;