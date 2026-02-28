import { useMemo } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

import Header from './components/Header';
import Browse from './pages/Browse';
import Publish from './pages/Publish';
import ModelDetail from './pages/ModelDetail';
import AgentBrowse from './pages/AgentBrowse';
import AgentDetail from './pages/AgentDetail';
import AgentRegister from './pages/AgentRegister';
import TaskBrowse from './pages/TaskBrowse';
import TaskDetail from './pages/TaskDetail';

function App() {
  const endpoint = useMemo(() => clusterApiUrl('devnet'), []);
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-slate-900">
              <Header />
              <main>
                <Routes>
                  <Route path="/" element={<Browse />} />
                  <Route path="/publish" element={<Publish />} />
                  <Route path="/model/:address" element={<ModelDetail />} />
                  <Route path="/agents" element={<AgentBrowse />} />
                  <Route path="/agents/register" element={<AgentRegister />} />
                  <Route path="/agent/:address" element={<AgentDetail />} />
                  <Route path="/tasks" element={<TaskBrowse />} />
                  <Route path="/task/:address" element={<TaskDetail />} />
                </Routes>
              </main>
            </div>
          </BrowserRouter>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
