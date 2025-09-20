import React from "react";
import AuthProvider from "../../providers/provider";
import ToastProvider from "../../providers/toast-provider";

type LayoutProps = {
  children: React.ReactNode;
};

const RootLayout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <AuthProvider>
      <ToastProvider />
      <main>{children}</main>
    </AuthProvider>
  );
};

export default RootLayout;

