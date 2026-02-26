import { Link, useLocation } from "react-router-dom";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function Header() {
  const location = useLocation();

  const navLinks = [
    { to: "/", label: "Browse" },
    { to: "/publish", label: "Publish" },
  ];

  return (
    <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-white">
              ModelRegistry
            </span>
            <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full font-mono">
              on-chain
            </span>
          </Link>

          <nav className="flex gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? "bg-gray-800 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <WalletMultiButton className="!bg-gray-800 !rounded-lg !h-10 !text-sm" />
      </div>
    </header>
  );
}
