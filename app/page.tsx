"use client";

import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { createToken, uploadImageToPinata, uploadMetadataToPinata } from "@/lib/pump";

export default function Home() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [isMayhemMode, setIsMayhemMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [signature, setSignature] = useState("");

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

    try {
      // Step 1: Upload image to IPFS
      setStatus("Uploading image to IPFS...");
      const imageUrl = await uploadImageToPinata(image);

      // Step 2: Upload metadata to IPFS
      setStatus("Uploading metadata to IPFS...");
      const metadataUri = await uploadMetadataToPinata(name, symbol, description, imageUrl);

      // Step 3: Create token on-chain
      setStatus("Creating token on-chain...");
      const sig = await createToken(connection, wallet, {
        name,
        symbol,
        uri: metadataUri,
        creator: wallet.publicKey,
        isMayhemMode,
      });

      setSignature(sig);
      setStatus("Token created successfully!");

      // Reset form
      setName("");
      setSymbol("");
      setDescription("");
      setImage(null);
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-red-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-red-500">
              MayhemPad
            </h1>
            <p className="text-gray-400 mt-2">Launch tokens with Mayhem Mode</p>
          </div>
          <WalletMultiButton />
        </div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-black/50 backdrop-blur-lg border border-purple-500/30 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-3xl font-bold mb-6 text-white">Create Your Token</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Token Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
                  placeholder="e.g., Mayhem Token"
                  disabled={loading}
                  required
                />
              </div>

              {/* Symbol */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Token Symbol
                </label>
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
                  placeholder="e.g., MAYHEM"
                  disabled={loading}
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
                  placeholder="Describe your token..."
                  rows={3}
                  disabled={loading}
                  required
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Token Image
                </label>
                <input
                  id="image-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-purple-500/30 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 focus:outline-none transition"
                  disabled={loading}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Image will be automatically uploaded to IPFS via Pinata
                </p>
              </div>

              {/* Mayhem Mode Toggle */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-900/30 to-red-900/30 border border-purple-500/50 rounded-lg">
                <div>
                  <label className="block text-sm font-bold text-purple-300 mb-1">
                    Mayhem Mode
                  </label>
                  <p className="text-xs text-gray-400">
                    Enable for Token-2022 with mayhem protocol features
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMayhemMode(!isMayhemMode)}
                  disabled={loading}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    isMayhemMode ? "bg-purple-600" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      isMayhemMode ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !wallet.publicKey}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-red-600 hover:from-purple-700 hover:to-red-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold rounded-lg transition-all transform hover:scale-105 disabled:scale-100 shadow-lg"
              >
                {loading ? "Creating..." : "Launch Token"}
              </button>
            </form>

            {/* Status Messages */}
            {status && (
              <div className="mt-6 p-4 bg-green-900/30 border border-green-500/50 rounded-lg">
                <p className="text-green-400 font-medium">{status}</p>
              </div>
            )}

            {error && (
              <div className="mt-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
                <p className="text-red-400 font-medium">{error}</p>
              </div>
            )}

            {signature && (
              <div className="mt-6 p-4 bg-blue-900/30 border border-blue-500/50 rounded-lg">
                <p className="text-blue-400 font-medium mb-2">Transaction Signature:</p>
                <a
                  href={`https://solscan.io/tx/${signature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-300 hover:text-blue-200 break-all underline"
                >
                  {signature}
                </a>
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="mt-8 space-y-6">
            <div className="p-6 bg-black/30 backdrop-blur-lg border border-gray-700/30 rounded-xl">
              <h3 className="text-xl font-bold text-white mb-3">What is Mayhem Mode?</h3>
              <p className="text-gray-400 mb-3">
                Mayhem Mode uses Token-2022 (the next-generation token standard) and the Mayhem protocol
                to create tokens with advanced features and enhanced capabilities.
              </p>
              <ul className="list-disc list-inside text-gray-400 space-y-1">
                <li>Token-2022 standard support</li>
                <li>Advanced bonding curve mechanics</li>
                <li>Integrated with Mayhem protocol infrastructure</li>
                <li>Enhanced fee distribution system</li>
              </ul>
            </div>

            <div className="p-6 bg-black/30 backdrop-blur-lg border border-blue-500/30 rounded-xl">
              <h3 className="text-xl font-bold text-white mb-3">How it works</h3>
              <ol className="list-decimal list-inside text-gray-400 space-y-2">
                <li>Upload your token image - automatically goes to IPFS via Pinata</li>
                <li>Metadata JSON is created and uploaded to IPFS</li>
                <li>Token is created on-chain with the metadata URI</li>
                <li>Everything is handled automatically!</li>
              </ol>
              <p className="text-gray-400 mt-3 text-sm">
                Requires a free Pinata API key. Get one at{" "}
                <a href="https://www.pinata.cloud/" target="_blank" className="text-blue-400 hover:underline">
                  pinata.cloud
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
