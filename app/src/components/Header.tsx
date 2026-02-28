import { Link } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function Header() {
  return (
    <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/logo.svg" alt="AgenC" className="h-8 w-8" />
              <h1 className="text-xl font-bold text-white">AgenC Model Registry</h1>
            </Link>
            <nav className="flex space-x-6">
              <Link
                to="/"
                className="text-slate-300 hover:text-white transition-colors font-medium"
              >
                Browse
              </Link>
              <Link
                to="/publish"
                className="text-slate-300 hover:text-white transition-colors font-medium"
              >
                Publish
              </Link>
            </nav>
          </div>
          <WalletMultiButton />
        </div>
      </div>
    </header>
  );
}
