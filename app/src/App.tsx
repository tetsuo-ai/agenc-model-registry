import { useMemo } from "react";
import { Routes, Route } from "react-router-dom";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import Header from "./components/Header";
import Browse from "./pages/Browse";
import Publish from "./pages/Publish";
import ModelDetail from "./pages/ModelDetail";

const NETWORK = "devnet";

export default function App() {
  const endpoint = useMemo(() => clusterApiUrl(NETWORK), []);
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
              <Routes>
                <Route path="/" element={<Browse />} />
                <Route path="/publish" element={<Publish />} />
                <Route path="/model/:address" element={<ModelDetail />} />
              </Routes>
            </main>
            <footer className="text-center text-gray-600 text-sm py-4 border-t border-gray-800">
              Permanent. Uncensorable. On-chain.
            </footer>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
