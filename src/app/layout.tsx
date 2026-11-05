import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daylight — A little progress, every day",
  description: "Your personal task space. Organize your day with lists, priorities, and a little more headspace.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
