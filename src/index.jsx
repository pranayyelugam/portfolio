import React from 'react';
import { Buffer } from 'buffer';
window.Buffer = Buffer;
import { createRoot } from 'react-dom/client';
import './styles/global.scss';
import App from './App';
import './fonts/GreatVibes-Regular.ttf'
import * as serviceWorker from './serviceWorker';

const root = createRoot(document.getElementById('root'));
root.render(<App />);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
