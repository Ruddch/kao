import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { GlobalLayout } from './components/layout/GlobalLayout';
import { StudioPage } from './pages/Studio';
import { MintPage } from './pages/Mint';
import { DocsLayout } from './pages/Docs/DocsLayout';
import {
  FaqPage,
  GettingStartedPage,
  GuidesPage,
  ContractsPage,
  MechanicsPage,
} from './pages/Docs/DocsPages';
import { HomePage } from './pages/Home';

const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

export const router = createBrowserRouter(
[
  {
    path: '/',
    element: <GlobalLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'checker', element: <MintPage /> },
      { path: 'studio', element: <StudioPage /> },
      {
        path: 'docs',
        element: <DocsLayout />,
        children: [
          { index: true, element: <GettingStartedPage /> },
          { path: 'guides', element: <GuidesPage /> },
          { path: 'contracts', element: <ContractsPage /> },
          { path: 'mechanics', element: <MechanicsPage /> },
          { path: 'faq', element: <FaqPage /> },
        ],
      },
    ],
  },
],
basename ? { basename } : undefined,
);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
