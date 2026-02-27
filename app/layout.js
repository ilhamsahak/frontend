import "./globals.css";

export const metadata = {
  title: "Magic Chess Automanaged Tournament",
  description:
    "Register your team and compete in the Magic Chess Automanaged Tournament.",
  icons: {
    icon: "/tournament-logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
