import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email, registration, ticket_id } = await req.json();

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const ticketUrl = `${baseUrl}/tickets/${ticket_id}`;

    const customerEmail = await resend.emails.send({
      from: "AWTuning <calibrations@awtuning.co.uk>",
      to: [email],
      subject: "Your Calibration File Is Ready",
      html: `
        <h2>AWTuning File Portal</h2>

        <p>Your calibration request has been updated.</p>

        <p><strong>Vehicle:</strong> ${registration}</p>

        <p>Your tuned file has now been uploaded and is ready to download in your portal.</p>

        <p>
          <a href="${ticketUrl}" 
             style="display:inline-block;background:#E22120;color:#ffffff;padding:12px 18px;text-decoration:none;border-radius:8px;font-weight:bold;">
            Download Your File
          </a>
        </p>

        <p>If the button does not work, please log in to your AWTuning portal and open your ticket.</p>
      `,
    });

    return NextResponse.json({
      success: true,
      customerEmail,
    });
  } catch (error: any) {
    console.error("TICKET UPDATED EMAIL ERROR:", error);

    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}