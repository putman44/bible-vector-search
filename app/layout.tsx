import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bible Vector Search",
  description: "Semantic search over passage-sized KJV Bible chunks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
