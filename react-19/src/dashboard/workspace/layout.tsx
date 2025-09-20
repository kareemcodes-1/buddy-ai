

import { Navbar } from "../../components/navbar";
import ToastProvider from "../../providers/toast-provider";
import { AuthProvider } from "../../providers/auth-provider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ToastProvider />
      <Navbar />
      {children}
    </AuthProvider>
  );
}
