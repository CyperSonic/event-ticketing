"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function ScannerPage() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isRunningRef = useRef(false);
  const hasStartedRef = useRef(false); // guards against Strict Mode double-invoke

  const [message, setMessage] = useState(
    "Point the camera at a ticket QR code."
  );

  const [status, setStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );

  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    // Prevent React 18 Strict Mode (dev) from starting the camera twice.
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const scanner = new Html5Qrcode("reader");
    scannerRef.current = scanner;
    let cancelled = false;

    async function stopAndClear() {
      if (!isRunningRef.current) return;
      isRunningRef.current = false;
      try {
        await scanner.stop();
      } catch {}
      try {
        // Removes the video/canvas nodes html5-qrcode injected into #reader
        // BEFORE React touches that DOM subtree again. Skipping this is what
        // causes "Failed to execute 'removeChild' on 'Node'" crashes.
        await scanner.clear();
      } catch {}
    }

    async function startScanner() {
      try {
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,

            // Make the QR scanning area square
            // based on the actual camera viewfinder size.
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const size = Math.floor(
                Math.min(viewfinderWidth, viewfinderHeight) * 0.65
              );

              return {
                width: size,
                height: size,
              };
            },

            disableFlip: false,
          },

          async (decodedText) => {
            if (cancelled) return;

            await stopAndClear();

            if (cancelled) return;

            setScanning(false);
            setMessage("Checking ticket...");
            setStatus("idle");

            try {
              const response = await fetch("/api/verify", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  ticketToken: decodedText,
                }),
              });

              const data = await response.json();

              if (cancelled) return;

              if (data.success) {
                setStatus("success");
                setMessage("ENTRY APPROVED");
                setStudentName(data.studentName);
                setStudentId(data.studentId);
              } else {
                setStatus("error");
                setMessage(data.message || "TICKET REJECTED");
              }
            } catch (error) {
              console.error(error);
              if (!cancelled) {
                setStatus("error");
                setMessage("Could not verify ticket.");
              }
            }
          },

          () => {
            // Ignore normal scanning messages
          }
        );

        if (cancelled) {
          // Component unmounted while camera was still starting up.
          await stopAndClear();
          return;
        }

        isRunningRef.current = true;
      } catch (error) {
        console.error(error);

        if (!cancelled) {
          setStatus("error");
          setMessage(
            "Camera could not start. Please allow camera permission."
          );
        }
      }
    }

    startScanner();

    return () => {
      cancelled = true;
      stopAndClear();
    };
  }, []);

  function scanAnother() {
    window.location.reload();
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6">

        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-sm font-semibold text-indigo-400 tracking-wider">
            ORGANIZER
          </p>

          <h1 className="text-3xl font-bold mt-2">
            Ticket Scanner
          </h1>

          <p className="text-slate-400 mt-2">
            Scan the student's QR code
          </p>
        </div>

        {/* Camera — kept mounted whenever scanning is true so html5-qrcode's
            injected DOM nodes are always cleared (via stopAndClear) before
            this element is ever removed by React. */}
        {scanning && (
          <div
            id="reader"
            className="w-full overflow-hidden rounded-xl bg-black"
          />
        )}

        {/* Status */}
        <div
          className={`mt-6 rounded-xl p-5 text-center ${
            status === "success"
              ? "bg-green-950 border border-green-700"
              : status === "error"
              ? "bg-red-950 border border-red-700"
              : "bg-slate-800 border border-slate-700"
          }`}
        >
          <h2
            className={`text-2xl font-bold ${
              status === "success"
                ? "text-green-400"
                : status === "error"
                ? "text-red-400"
                : "text-white"
            }`}
          >
            {message}
          </h2>

          {status === "success" && (
            <div className="mt-4 text-left">
              <p className="text-slate-300">
                <span className="text-slate-500">
                  Name:
                </span>{" "}
                {studentName}
              </p>

              <p className="text-slate-300 mt-2">
                <span className="text-slate-500">
                  University ID:
                </span>{" "}
                {studentId}
              </p>
            </div>
          )}
        </div>

        {/* Scan Another */}
        {!scanning && (
          <button
            onClick={scanAnother}
            className="w-full mt-5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-lg transition"
          >
            Scan Another Ticket
          </button>
        )}

        <p className="text-center text-xs text-slate-500 mt-5">
          Only valid unused tickets will be accepted.
        </p>

      </div>
    </main>
  );
}