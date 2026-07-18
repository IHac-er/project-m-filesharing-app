import "./globals.css";

export const metadata = {
  title: "Project-M",
  description: "Temporary anonymous messaging",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}