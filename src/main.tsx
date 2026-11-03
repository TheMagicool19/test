import {createRoot} from 'react-dom/client';

// Tipografia self-hosted (nessuna richiesta esterna, nessun FOUT)
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';

import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
