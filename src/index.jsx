import React from 'react';
import { createRoot } from 'react-dom/client';
import { Buffer } from 'buffer';
import './styles/global.scss';
import App from './App';

// gray-matter (blog front matter) expects Node's Buffer in the browser.
window.Buffer = Buffer;

createRoot(document.getElementById('root')).render(<App />);
