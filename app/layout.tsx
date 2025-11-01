import "./globals.css";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Kings League Palpites",
  description: "MVP de palpites via chat da Twitch",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <body className="min-h-screen bg-[#0b0b0b] text-zinc-100">
        {children}
        <Footer />
      </body>
    </html>
  );
}
