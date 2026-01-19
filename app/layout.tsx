import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";

const kanit = Kanit({
  variable: "--font-kanit",
  subsets: ["latin", "thai"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "ข่าวสาร มทร.ศรีวิชัย | RUts News",
  description: "ติดตามข่าวสารและประกาศจากทุกคณะ มหาวิทยาลัยเทคโนโลยีราชมงคลศรีวิชัย",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body
        className={`${kanit.className} ${kanit.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
