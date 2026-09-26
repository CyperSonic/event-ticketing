"use client";

import { useState } from "react";
import QRCode from "qrcode";

export default function Home() {
  const [name, setName] = useState("");
  const [universityId, setUniversityId] = useState("");
  const [mobile, setMobile] = useState("");

  const [loading, setLoading] = useState(false);
  const [ticketToken, setTicketToken] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [error, setError] = useState("");

  async function handleBooking() {
    setError("");

    if (!name || !universityId || !mobile) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          universityId,
          mobile,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Booking failed.");
        return;
      }

      // Generate QR code from the unique ticket token
      const qr = await QRCode.toDataURL(data.ticketToken);

      setTicketToken(data.ticketToken);
      setQrCode(qr);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6">

      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-8">

        {!ticketToken ? (
          <>
            {/* Header */}
            <div className="text-center mb-8">

              <p className="text-sm font-semibold text-indigo-400 tracking-wider">
                UNIVERSITY EVENT
              </p>

              <h1 className="text-4xl font-bold text-white mt-2">
                Garba Night
              </h1>

              <p className="text-slate-400 mt-2">
                Entrepreneur & Idea Exchange Meet
              </p>

            </div>

            {/* Form */}
            <div className="space-y-5">

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Full Name
                </label>

                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-600 rounded-lg px-4 py-3 text-white bg-slate-800 placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* University ID */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  University ID
                </label>

                <input
                  type="text"
                  placeholder="Enter your university ID"
                  value={universityId}
                  onChange={(e) => setUniversityId(e.target.value)}
                  className="w-full border border-slate-600 rounded-lg px-4 py-3 text-white bg-slate-800 placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Mobile */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Mobile Number
                </label>

                <input
                  type="tel"
                  placeholder="Enter your mobile number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full border border-slate-600 rounded-lg px-4 py-3 text-white bg-slate-800 placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="text-sm text-red-300 bg-red-950 border border-red-800 p-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Button */}
              <button
                type="button"
                onClick={handleBooking}
                disabled={loading}
                className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating Ticket..." : "Book My Ticket"}
              </button>

            </div>

            <p className="text-center text-xs text-slate-500 mt-6">
              One ticket per student
            </p>
          </>
        ) : (

          /* SUCCESS SCREEN */
          <div className="text-center">

            <p className="text-sm font-semibold text-green-400">
              TICKET BOOKED SUCCESSFULLY
            </p>

            <h1 className="text-3xl font-bold text-white mt-2">
              Your Ticket
            </h1>

            <p className="text-slate-400 mt-2">
              Show this QR code at the event entrance.
            </p>

            {/* QR Code */}
            {qrCode && (
              <div className="bg-white p-4 rounded-xl mt-6 inline-block">
                <img
                  src={qrCode}
                  alt="Ticket QR Code"
                  className="w-56 h-56"
                />
              </div>
            )}

            {/* Ticket ID */}
            <div className="mt-6 p-4 bg-slate-800 border border-slate-700 rounded-lg">

              <p className="text-xs text-slate-400">
                Ticket ID
              </p>

              <p className="text-sm font-mono text-white break-all mt-2">
                {ticketToken}
              </p>

            </div>

            <p className="text-xs text-slate-500 mt-5">
              Keep this QR code safe. It will be scanned at the entrance.
            </p>

          </div>
        )}

      </div>
    </main>
  );
}