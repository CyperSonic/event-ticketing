import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { name, universityId, mobile } = body;

    if (!name || !universityId || !mobile) {
      return NextResponse.json(
        { error: "Please fill in all fields." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("tickets")
      .insert({
        student_name: name,
        student_id: universityId,
        mobile: mobile,
      })
      .select("ticket_token")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A ticket already exists for this University ID." },
          { status: 409 }
        );
      }

      console.error(error);

      return NextResponse.json(
        { error: "Could not create ticket." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ticketToken: data.ticket_token,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}