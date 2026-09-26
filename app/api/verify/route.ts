import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ticketToken } = body;

    if (!ticketToken) {
      return NextResponse.json(
        {
          success: false,
          message: "No ticket QR code provided.",
        },
        { status: 400 }
      );
    }

    // Try to change UNUSED → USED.
    // Only the first successful scan can do this.
    const { data: ticket, error: updateError } = await supabase
      .from("tickets")
      .update({
        status: "USED",
        scanned_at: new Date().toISOString(),
      })
      .eq("ticket_token", ticketToken)
      .eq("status", "UNUSED")
      .select("student_name, student_id, scanned_at")
      .single();

    // Valid unused ticket
    if (!updateError && ticket) {
      return NextResponse.json({
        success: true,
        message: "ENTRY APPROVED",
        studentName: ticket.student_name,
        studentId: ticket.student_id,
        scannedAt: ticket.scanned_at,
      });
    }

    // The ticket was not available as UNUSED.
    // Check whether the token exists at all.
    const { data: existingTicket } = await supabase
      .from("tickets")
      .select("status")
      .eq("ticket_token", ticketToken)
      .maybeSingle();

    // Token exists but was already used
    if (existingTicket) {
      return NextResponse.json({
        success: false,
        message: "TICKET ALREADY USED",
      });
    }

    // Token doesn't exist
    return NextResponse.json({
      success: false,
      message: "INVALID TICKET",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Verification failed.",
      },
      { status: 500 }
    );
  }
}