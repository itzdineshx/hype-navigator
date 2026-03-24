import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

import { loadEmailSession } from "@/lib/emailAuth";
import { clearWalletSession, getEthereumProvider, loadWalletSession } from "@/lib/walletAuth";

const RequireWalletAuth = () => {
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const emailSession = loadEmailSession();
    if (emailSession) {
      setIsAllowed(true);
      return;
    }

    const session = loadWalletSession();
    if (!session) {
      setIsAllowed(false);
      return;
    }

    const provider = getEthereumProvider();
    if (!provider) {
      clearWalletSession();
      setIsAllowed(false);
      return;
    }

    const verify = async () => {
      try {
        const accounts = (await provider.request({ method: "eth_accounts" })) as string[];
        const activeAddress = accounts?.[0]?.toLowerCase();
        if (!activeAddress || activeAddress !== session.address.toLowerCase()) {
          clearWalletSession();
          setIsAllowed(false);
          return;
        }
        setIsAllowed(true);
      } catch {
        clearWalletSession();
        setIsAllowed(false);
      }
    };

    void verify();

    const handleAccountsChanged = (accounts: unknown) => {
      if (!Array.isArray(accounts) || accounts.length === 0) {
        clearWalletSession();
        setIsAllowed(false);
        return;
      }

      const current = String(accounts[0]).toLowerCase();
      if (current !== session.address.toLowerCase()) {
        clearWalletSession();
        setIsAllowed(false);
      }
    };

    provider.on?.("accountsChanged", handleAccountsChanged);
    return () => {
      provider.removeListener?.("accountsChanged", handleAccountsChanged);
    };
  }, []);

  if (isAllowed === null) {
    return (
      <div className="min-h-screen bg-background gradient-bg-subtle flex items-center justify-center px-6">
        <div className="glass rounded-2xl p-8 text-center max-w-md w-full">
          <p className="text-sm text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAllowed) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default RequireWalletAuth;
