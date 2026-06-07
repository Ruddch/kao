import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Web3Provider } from './providers/Web3Provider';
import { AppRouter } from './router';
import './styles/global.css';
import './styles/typography.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Web3Provider>
      <AppRouter />
    </Web3Provider>
  </StrictMode>,
);
