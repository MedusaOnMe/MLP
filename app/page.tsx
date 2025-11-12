"use client";

import { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import { createToken, uploadImageToPinata, uploadMetadataToPinata, buyTokens, type TokenMetadata } from "@/lib/pump";

interface LaunchedToken {
  id: string;
  mint: string;
  name: string;
  symbol: string;
  imageUrl: string;
  creator: string;
  signature: string;
  timestamp: number;
  pumpfunUrl: string;
}

export default function Home() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [website, setWebsite] = useState("");
  const [twitter, setTwitter] = useState("");
  const [telegram, setTelegram] = useState("");
  const [isMayhemMode, setIsMayhemMode] = useState(true);
  const [devBuyEnabled, setDevBuyEnabled] = useState(false);
  const [devBuyAmount, setDevBuyAmount] = useState(0.1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [signature, setSignature] = useState("");
  const [createdMint, setCreatedMint] = useState<string | null>(null);
  const [recentLaunches, setRecentLaunches] = useState<LaunchedToken[]>([]);

  // Fetch recent launches on mount
  useEffect(() => {
    fetchRecentLaunches();
  }, []);

  const fetchRecentLaunches = async () => {
    try {
      const response = await fetch("/api/get-launches?limit=6");
      if (response.ok) {
        const data = await response.json();
        setRecentLaunches(data.launches || []);
      }
    } catch (error) {
      console.error("Error fetching launches:", error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wallet.publicKey) {
      setError("Please connect your wallet first");
      return;
    }

    if (!name || !symbol || !description || !image) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError("");
    setStatus("");
    setSignature("");
    setCreatedMint(null);

    try {
      // Step 1: Upload image to IPFS
      setStatus("Uploading image to IPFS...");
      const imageUrl = await uploadImageToPinata(image);

      // Step 2: Upload metadata to IPFS
      setStatus("Uploading metadata to IPFS...");
      const metadata: TokenMetadata = {
        name,
        symbol,
        description,
        imageUrl,
        website: website || undefined,
        twitter: twitter || undefined,
        telegram: telegram || undefined,
      };
      const metadataUri = await uploadMetadataToPinata(metadata);

      // Step 3: Create token on-chain
      setStatus("Creating token on-chain...");
      const result = await createToken(connection, wallet, {
        name,
        symbol,
        uri: metadataUri,
        creator: wallet.publicKey,
        isMayhemMode,
      });

      setSignature(result.signature);
      setCreatedMint(result.mint);

      // Step 4: Save to Firebase
      setStatus("Saving launch data...");
      await fetch("/api/save-launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mint: result.mint,
          name,
          symbol,
          imageUrl,
          creator: wallet.publicKey.toString(),
          signature: result.signature,
          timestamp: Date.now(),
        }),
      });

      setStatus("Token created successfully!");

      // Refresh recent launches
      fetchRecentLaunches();

      // Reset form
      setName("");
      setSymbol("");
      setDescription("");
      setImage(null);
      setWebsite("");
      setTwitter("");
      setTelegram("");
      const fileInput = document.getElementById("image-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create token");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-red-950 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-red-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-6xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent mb-2 animate-gradient">
              MayhemPad
            </h1>
            <p className="text-gray-400 text-lg">Launch tokens with Mayhem Mode</p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://x.com/MayhemPad"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-black/40 border border-purple-500/30 rounded-xl hover:border-purple-500/50 hover:bg-purple-900/20 transition-all duration-300 group"
              aria-label="Follow us on X"
            >
              <svg
                className="w-6 h-6 text-gray-300 group-hover:text-purple-400 transition-colors"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <WalletMultiButton className="!bg-gradient-to-r !from-purple-600 !to-red-600 hover:!from-purple-700 hover:!to-red-700 !transition-all !duration-300 !rounded-xl !font-bold" />
          </div>
        </header>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Main Form */}
            <div className="bg-black/40 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-8 shadow-2xl hover:border-purple-500/50 transition-all duration-300">
              <h2 className="text-3xl font-bold text-white mb-6">
                Create Your Token
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Token Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-purple-300 mb-2">
                      Token Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-900/70 border border-purple-500/40 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition"
                      placeholder="Mayhem Token"
                      disabled={loading}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-purple-300 mb-2">
                      Symbol *
                    </label>
                    <input
                      type="text"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                      className="w-full px-4 py-3 bg-gray-900/70 border border-purple-500/40 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition uppercase"
                      placeholder="MAYHEM"
                      disabled={loading}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-purple-300 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-900/70 border border-purple-500/40 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition resize-none"
                      placeholder="Describe your token and its purpose..."
                      rows={3}
                      disabled={loading}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-purple-300 mb-2">
                      Token Image *
                    </label>
                    <input
                      id="image-input"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full px-4 py-3 bg-gray-900/70 border border-purple-500/40 rounded-xl text-white file:mr-4 file:py-2 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-gradient-to-r file:from-purple-600 file:to-pink-600 file:text-white hover:file:from-purple-700 hover:file:to-pink-700 focus:outline-none transition cursor-pointer"
                      disabled={loading}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Automatically uploaded to IPFS via Pinata
                    </p>
                  </div>
                </div>

                {/* Social Links (Optional) */}
                <div className="border-t border-purple-500/20 pt-6">
                  <h3 className="text-lg font-bold text-white mb-4">
                    Social Links (Optional)
                  </h3>
                  <div className="space-y-3">
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-900/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition text-sm"
                      placeholder="Website URL"
                      disabled={loading}
                    />
                    <input
                      type="text"
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-900/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition text-sm"
                      placeholder="Twitter/X handle"
                      disabled={loading}
                    />
                    <input
                      type="text"
                      value={telegram}
                      onChange={(e) => setTelegram(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-900/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition text-sm"
                      placeholder="Telegram link"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Mayhem Mode Toggle */}
                <div className="flex items-center justify-between p-5 bg-gradient-to-r from-purple-900/40 to-red-900/40 border border-purple-500/50 rounded-xl hover:border-purple-400/70 transition">
                  <div>
                    <label className="block text-base font-bold text-purple-200 mb-1">
                      Mayhem Mode
                    </label>
                    <p className="text-xs text-gray-400">Token-2022 with enhanced features</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMayhemMode(!isMayhemMode)}
                    className={`relative w-16 h-8 rounded-full transition-all duration-300 ${
                      isMayhemMode ? "bg-gradient-to-r from-purple-600 to-red-600" : "bg-gray-700"
                    }`}
                    disabled={loading}
                  >
                    <span
                      className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 ${
                        isMayhemMode ? "translate-x-8" : ""
                      }`}
                    />
                  </button>
                </div>

                {/* Dev Buy Section - Coming Soon */}
                <div className="border-t border-purple-500/20 pt-6">
                  <div className="flex items-center justify-between p-4 bg-gray-900/30 border border-gray-600/30 rounded-xl">
                    <div>
                      <label className="block text-base font-bold text-gray-400">
                        Dev Buy
                      </label>
                      <p className="text-xs text-gray-500">Coming soon - atomic create + buy in one transaction</p>
                    </div>
                    <span className="px-3 py-1 bg-purple-900/50 border border-purple-500/50 rounded-full text-xs font-bold text-purple-300">
                      Soon
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !wallet.publicKey}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white font-bold rounded-xl hover:from-purple-700 hover:via-pink-700 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-purple-500/50 text-lg"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      {status || "Processing..."}
                    </span>
                  ) : (
                    "Launch Token"
                  )}
                </button>

                {/* Status Messages */}
                {error && (
                  <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-xl text-red-200 text-sm animate-in slide-in-from-top">
                    <span className="font-bold">Error:</span> {error}
                  </div>
                )}

                {signature && (
                  <div className="p-4 bg-green-900/30 border border-green-500/50 rounded-xl space-y-2 animate-in slide-in-from-top">
                    <p className="text-green-200 font-bold">
                      {status}
                    </p>
                    <a
                      href={`https://solscan.io/tx/${signature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-400 hover:text-green-300 text-sm break-all underline block"
                    >
                      View on Solscan →
                    </a>
                  </div>
                )}
              </form>
            </div>

            {/* Info Cards */}
            <div className="space-y-6">
              {/* What is Mayhem Mode */}
              <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-xl border border-purple-500/40 rounded-2xl p-6 shadow-xl hover:border-purple-400/60 transition-all duration-300 hover:transform hover:scale-[1.02]">
                <h3 className="text-2xl font-bold text-white mb-4">
                  What is Mayhem Mode?
                </h3>
                <p className="text-gray-300 mb-4 leading-relaxed">
                  Mayhem Mode uses <span className="text-purple-400 font-bold">Token-2022</span> (the next-generation token standard)
                  and the Mayhem protocol to create tokens with advanced features and enhanced capabilities.
                </p>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">▸</span>
                    <span>Token-2022 standard support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">▸</span>
                    <span>Advanced bonding curve mechanics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">▸</span>
                    <span>Integrated with Mayhem protocol infrastructure</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">▸</span>
                    <span>Enhanced fee distribution system</span>
                  </li>
                </ul>
              </div>

              {/* How it Works */}
              <div className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 backdrop-blur-xl border border-blue-500/40 rounded-2xl p-6 shadow-xl hover:border-blue-400/60 transition-all duration-300 hover:transform hover:scale-[1.02]">
                <h3 className="text-2xl font-bold text-white mb-4">
                  How It Works
                </h3>
                <ol className="space-y-3 text-gray-300">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center font-bold text-sm">1</span>
                    <span>Upload your token image - automatically goes to IPFS via Pinata</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center font-bold text-sm">2</span>
                    <span>Metadata JSON is created and uploaded to IPFS</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center font-bold text-sm">3</span>
                    <span>Token is created on-chain with the metadata URI</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center font-bold text-sm">4</span>
                    <span>Your launch is saved and displayed in Recent Launches</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-7 h-7 bg-green-600 rounded-full flex items-center justify-center font-bold text-sm">5</span>
                    <span className="font-bold text-green-400">Everything is handled automatically!</span>
                  </li>
                </ol>
              </div>

              {/* Features */}
              <div className="bg-gradient-to-br from-orange-900/40 to-red-900/40 backdrop-blur-xl border border-orange-500/40 rounded-2xl p-6 shadow-xl hover:border-orange-400/60 transition-all duration-300 hover:transform hover:scale-[1.02]">
                <h3 className="text-2xl font-bold text-white mb-4">
                  Features
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/30 rounded-lg p-3 border border-orange-500/30">
                    <div className="text-xs text-gray-300 font-semibold">Full Metadata</div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3 border border-orange-500/30">
                    <div className="text-xs text-gray-300 font-semibold">Recent Launches</div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3 border border-orange-500/30">
                    <div className="text-xs text-gray-300 font-semibold">Instant Launch</div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3 border border-orange-500/30">
                    <div className="text-xs text-gray-300 font-semibold">Secure IPFS</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Launches */}
        {recentLaunches.length > 0 && (
          <div className="max-w-6xl mx-auto mt-16">
            <h2 className="text-4xl font-black bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent mb-8 text-center">
              Recent Launches
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentLaunches.map((launch) => (
                <a
                  key={launch.id}
                  href={launch.pumpfunUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-black/40 backdrop-blur-xl border border-green-500/30 rounded-2xl p-6 shadow-xl hover:border-green-400/60 hover:transform hover:scale-[1.05] transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    {launch.imageUrl && (
                      <img
                        src={launch.imageUrl}
                        alt={launch.name}
                        className="w-16 h-16 rounded-xl object-cover border-2 border-green-500/50 group-hover:border-green-400 transition"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-white truncate group-hover:text-green-400 transition">
                        {launch.name}
                      </h3>
                      <p className="text-green-400 font-mono text-sm">${launch.symbol}</p>
                      <p className="text-gray-500 text-xs mt-1 truncate font-mono">
                        {launch.mint.slice(0, 8)}...{launch.mint.slice(-8)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                    <span>{new Date(launch.timestamp).toLocaleDateString()}</span>
                    <span className="text-green-400 group-hover:text-green-300 transition">
                      View on pump.fun →
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-500 text-sm">
          <p>Built for the Solana community</p>
        </footer>
      </div>

      <style jsx global>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        @keyframes slide-in-from-top {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-in {
          animation: slide-in-from-top 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
