import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email, registration, company_name } = await req.json();

    const companyName = company_name || email;

    const customerEmail = await resend.emails.send({
      from: "AWTuning <calibrations@awtuning.co.uk>",
      to: [email],
      subject: "Ticket Created",
      html: `
        <h2>AWTuning File Portal</h2>
        <p>Your ticket has been created successfully.</p>
        <p><strong>Vehicle:</strong> ${registration}</p>
        <p>We will update you once your file is ready.</p>
      `,
    });

    const adminEmail = await resend.emails.send({
      from: "AWTuning <calibrations@awtuning.co.uk>",
      to: ["adam@awtuning.co.uk"],
      subject: "New Calibration Request Created",
      html: `
        <h2>AWTuning File Portal</h2>
        <p>A tuner has submitted a new calibration request.</p>
        <p><strong>Tuner:</strong> ${companyName}</p>
        <p><strong>Vehicle:</strong> ${registration}</p>
        <p>Please log in and carry out request ASAP.</p>
        <p><strong>Remember to set status to In Progress.</strong></p>
      `,
    });

    return NextResponse.json({
      success: true,
      customerEmail,
      adminEmail,
    });
  } catch (error: any) {
    console.error("EMAIL ERROR:", error);

    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}