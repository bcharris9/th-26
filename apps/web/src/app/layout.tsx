import "./globals.css";

export const metadata = {
  title: "VoiceBank Demo",
  description: "Voice-first banking assistant demo shell",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="shell-bg">
          <div className="shell-frame">{children}</div>
        </div>
      </body>
    </html>
  );
}
