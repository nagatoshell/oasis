import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav2 from "./bottomnav2";
import bitcoinQr from "../assets/qe.jpg";
import eth from "../assets/eth.jpeg";
import tron from "../assets/tron.jpeg";
import { getUsers, updateUser } from "../backend/api";

type PaymentMethod = "bitcoin" | "ethereum" | "tron";

type WalletConfig = {
  label: string;
  network: string;
  address: string;
  configured: boolean;
  qrSrc: string | null;
};

// Replace these two placeholders with YOUR receiving wallet addresses.
// Ethereum addresses normally start with 0x and contain 40 hexadecimal characters.
// TRON addresses normally start with T and contain 34 Base58 characters.
const ETHEREUM_ADDRESS = "0x84356C935959f2F936c82084242bd37F25E75cDB";
const TRON_ADDRESS = "UQDm4k6g0GJ_CpK6i7KUWB6-740Z4cM2Mzk6wUaKUjuh2b7o";
const BITCOIN_ADDRESS = "bc1qv66dmzenn3dwh46h2tgnmaj54q7xr2frre6la2";

const isEthereumAddress = (address: string) =>
  /^0x[a-fA-F0-9]{40}$/.test(address);
const isTronAddress = (address: string) =>
  /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address);

const PaymentOptions: React.FC = () => {
  const [method, setMethod] = useState<PaymentMethod | "">("");
  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState("");
  const [submittedAmount, setSubmittedAmount] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);

  const navigate = useNavigate();

  const wallets: Record<PaymentMethod, WalletConfig> = {
    bitcoin: {
      label: "Bitcoin (BTC)",
      network: "Bitcoin network",
      address: BITCOIN_ADDRESS,
      configured: true,
      qrSrc: bitcoinQr,
    },
    ethereum: {
      label: "Ethereum (ETH)",
      network: "Ethereum Mainnet",
      address: ETHEREUM_ADDRESS,
      configured: isEthereumAddress(ETHEREUM_ADDRESS),
      qrSrc: eth,
    },
    tron: {
      label: "TRON (TRX)",
      network: "TRON network",
      address: TRON_ADDRESS,
      configured: isTronAddress(TRON_ADDRESS),
      qrSrc: tron,
    },
  };

  const activeWallet = method ? wallets[method] : null;

  const formatAmountForHistory = (value: number) =>
    `$${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const handleCopy = async () => {
    if (!activeWallet?.configured) return;

    try {
      await navigator.clipboard.writeText(activeWallet.address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy wallet address:", error);
      alert("Unable to copy the wallet address. Please copy it manually.");
    }
  };

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/[^0-9.]/g, "");
    const parts = value.split(".");
    if (parts.length > 2) return;
    setAmount(value);
  };

  const handlePaymentSubmitted = async () => {
    const paymentAmount = Number(amount);

    if (!method || !activeWallet) {
      alert("Please select a payment method.");
      return;
    }

    if (!activeWallet.configured) {
      alert(`Please configure the ${activeWallet.label} wallet address first.`);
      return;
    }

    if (!amount || !Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      alert("Please enter the amount you sent.");
      return;
    }

    const storedUser = localStorage.getItem("loggedInUser");
    if (!storedUser) {
      alert("Your session has expired. Please log in again.");
      return;
    }

    try {
      setSubmitting(true);
      const user = JSON.parse(storedUser);
      const users = await getUsers();
      const index = users.findIndex((u: any) => u.email === user.email);

      if (index === -1) {
        alert("User account could not be found.");
        return;
      }

      // This creates a PENDING history entry only; it does not verify blockchain receipt.
      const newHistoryEntry = {
        date: new Date().toISOString().split("T")[0],
        amount: paymentAmount,
        description: `${activeWallet.label} Investment Payment`,
        paymentMethod: method,
        network: activeWallet.network,
        type: "pending",
        status: "pending",
        formattedAmount: formatAmountForHistory(paymentAmount),
      };

      const updatedUser = {
        ...user,
        history: [newHistoryEntry, ...(user.history || [])],
      };

      await updateUser(index, updatedUser);
      localStorage.setItem("loggedInUser", JSON.stringify(updatedUser));

      setSubmittedAmount(paymentAmount);
      setAmount("");
      setPaymentSubmitted(true);
    } catch (error) {
      console.error("Failed to submit payment:", error);
      alert("Unable to submit your payment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-xl border border-blue-300 text-left text-sm mt-6">
        <h2 className="text-blue-800 font-bold text-lg mb-2">
          🚀 Secure Your Crypto Mining Investment
        </h2>
        <p className="text-gray-700 mb-4">
          You’re one step away from activating your mining plan with{" "}
          <strong>Oasis</strong>.
        </p>
        <p className="text-gray-700 mb-4">
          To proceed, please select one of the approved payment methods below.
        </p>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="font-semibold text-yellow-800 mb-1">
            Investment Confirmation
          </p>
          <p className="mt-2">
            Payment submissions remain pending until they have been
            independently reviewed.
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <p className="font-semibold text-gray-800 mb-1">
            💼 Investment Summary
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>
              Plan Status:{" "}
              <span className="text-red-600 font-semibold">
                Pending Payment
              </span>
            </li>
            <li>
              Plan Type: <strong>Crypto Mining</strong>
            </li>
            <li>
              Network Allocation:{" "}
              <span className="text-blue-700 font-semibold">
                24h Hashrate Lease
              </span>
            </li>
            <li>
              Reference ID:{" "}
              <code className="bg-gray-100 px-1 rounded">BFC-MIN-009832</code>
            </li>
          </ul>
        </div>

        <p className="text-xs text-gray-500 mb-2">
          ⛏️ Verify the receiving wallet and network carefully before sending
          cryptocurrency.
        </p>
      </div>

      <div className="bg-gray-100 mb-[100px] p-6 flex justify-center items-center">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
          <h1 className="text-xl font-bold text-center text-blue-800 mb-4">
            Choose Payment Method
          </h1>

          <label
            htmlFor="paymentMethod"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Payment method
          </label>
          <select
            id="paymentMethod"
            value={method}
            onChange={(event) => {
              setMethod(event.target.value as PaymentMethod | "");
              setCopied(false);
              setPaymentSubmitted(false);
              setSubmittedAmount(null);
            }}
            className="w-full p-3 border border-gray-300 rounded-md mb-4 outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">-- Select Payment Method --</option>
            <option value="bitcoin">Bitcoin (BTC)</option>
            <option value="ethereum">Ethereum (ETH)</option>
            <option value="tron">TRON (TRX)</option>
          </select>

          {activeWallet && (
            <div className="bg-yellow-50 p-4 rounded-md flex flex-col gap-4 border border-yellow-300 text-sm">
              <div>
                <p className="font-semibold text-gray-800">
                  {activeWallet.label}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Network: {activeWallet.network}
                </p>
              </div>

              {!activeWallet.configured ? (
                <div className="rounded-lg border border-amber-300 bg-amber-100 p-3 text-amber-900">
                  <p className="font-semibold">Wallet address not configured</p>
                  <p className="mt-1">
                    Add your real {activeWallet.label} receiving address to the{" "}
                    <code>ETHEREUM_ADDRESS</code> or <code>TRON_ADDRESS</code>{" "}
                    constant at the top of this file. The QR code will be
                    generated from that address automatically.
                  </p>
                </div>
              ) : (
                <>
                  <p className="font-medium text-gray-800">
                    Send only using the {activeWallet.network} to the wallet
                    address below:
                  </p>

                  {activeWallet.qrSrc && (
                    <div className="flex justify-center">
                      <img
                        src={activeWallet.qrSrc}
                        alt={`${activeWallet.label} wallet QR code`}
                        className="w-[200px] h-[200px] object-contain bg-white rounded"
                        loading="lazy"
                      />
                    </div>
                  )}

                  <div className="flex items-stretch gap-2 mt-2">
                    <input
                      type="text"
                      readOnly
                      aria-label={`${activeWallet.label} wallet address`}
                      value={activeWallet.address}
                      className="font-mono text-red-700 bg-gray-100 border border-gray-300 rounded px-3 py-2 w-full min-w-0 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="bg-blue-800 text-white px-3 py-2 rounded hover:bg-blue-700 transition whitespace-nowrap"
                    >
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </>
              )}

              {!paymentSubmitted ? (
                <div className="border-t border-yellow-200 pt-4 mt-2">
                  <label
                    htmlFor="amountSent"
                    className="block text-sm font-semibold text-gray-800 mb-2"
                  >
                    Amount Sent (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      id="amountSent"
                      type="text"
                      inputMode="decimal"
                      value={amount}
                      onChange={handleAmountChange}
                      placeholder="Enter amount sent"
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Submitting this form records the payment as pending; it does
                    not confirm receipt on the blockchain.
                  </p>
                  <button
                    type="button"
                    onClick={handlePaymentSubmitted}
                    disabled={submitting || !activeWallet.configured}
                    className="w-full mt-4 bg-blue-800 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting
                      ? "Submitting Payment..."
                      : "I Have Made the Payment"}
                  </button>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl text-green-600">✓</span>
                    </div>
                    <div>
                      <p className="text-green-700 font-semibold">
                        Payment Submitted — Pending
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Your reported payment of{" "}
                        <strong>
                          {formatAmountForHistory(submittedAmount ?? 0)}
                        </strong>{" "}
                        has been recorded as pending verification.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/dashboard")}
                    className="w-full mt-4 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
                  >
                    Go to Dashboard
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="w-full mt-6 px-5 py-2 bg-blue-100 text-blue-800 font-semibold rounded-lg hover:bg-blue-200 transition"
          >
            Close Window
          </button>
        </div>
      </div>

      <BottomNav2 />
    </>
  );
};

export default PaymentOptions;
