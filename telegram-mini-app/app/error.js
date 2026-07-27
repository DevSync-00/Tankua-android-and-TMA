'use client';

import { RotateCcw } from 'lucide-react';

export default function ErrorScreen({ reset }) {
  return (
    <main className="app-error">
      <img src="/tankua-logo.png" alt="Tankua"/>
      <p>YOUR JOURNEY IS SAFE</p>
      <h1>Something didn’t load</h1>
      <span>Return to the previous screen and try again. Your booking has not been submitted.</span>
      <button onClick={reset}><RotateCcw/>Try again</button>
    </main>
  );
}
