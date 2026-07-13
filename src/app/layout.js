import './globals.css';
import Navbar from './components/Navbar';

export const metadata = {
  title: 'Hotel & Transport Management Portal',
  description: 'Manage hotel bookings, vehicle allocations, driver details, fuel expenses, and generate consolidated project invoices.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <Navbar />
        <main className="app-container">
          {children}
        </main>
      </body>
    </html>
  );
}
