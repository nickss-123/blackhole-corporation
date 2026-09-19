import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blackhole Corporation",
  description: "Blackhole Corporation member platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
