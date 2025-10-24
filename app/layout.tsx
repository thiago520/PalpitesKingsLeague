import "./globals.css";

export const metadata = {
  title: 'Kings League Palpites',
  description: 'MVP de palpites via chat da Twitch',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br">
      <body className="min-h-screen bg-white text-black">
        {children}
      </body>
    </html>
  );
}
