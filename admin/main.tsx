/**
 * @fileoverview Entry point of the private résumé editor (/admin/). Separate Vite entry,
 * so none of this code ships in the public site bundle.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import ErrorBoundary from '../components/ErrorBoundary';
import ResumeEditor from './ResumeEditor';
import '../styles/globals.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ResumeEditor />
    </ErrorBoundary>
  </React.StrictMode>
);
