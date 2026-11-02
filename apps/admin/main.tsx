import { createRoot } from 'react-dom/client';
import AdminApp from './AdminApp.tsx';
import '../../src/index.css';

createRoot(document.getElementById('admin-root')!).render(<AdminApp />);
