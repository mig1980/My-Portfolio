/**
 * @fileoverview Application entry point.
 * @description Bootstraps the React application and mounts it to the DOM.
 * @author Michael Gavrilov
 * @version 1.0.0
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';
import { initAnalytics } from './utils/analytics';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

void initAnalytics();

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
