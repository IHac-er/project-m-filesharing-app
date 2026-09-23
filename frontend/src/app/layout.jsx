import Header from "./_components/Header";
import Footer from "./_components/Footer"

import "./globals.css";
import "./page.module.css"


export const metadata = {
  title: "Project-M",
  description: "Temporary anonymous messaging",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}