import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Agentic Scheduler',
  description: 'AI-assisted team scheduling and reminders'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <header className="header">
            <h1>Agentic Scheduler</h1>
          </header>
          <main className="main">{children}</main>
          <footer className="footer">? {new Date().getFullYear()} Agentic Scheduler</footer>
        </div>
      </body>
    </html>
  );
}
