import { env } from "./env";

type SendParams = {
  to: string;
  subject: string;
  html: string;
};

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export async function sendEmail(params: SendParams): Promise<void> {
  // Stub : aucun envoi tant que Resend n'est pas configuré
  if (!env.RESEND_API_KEY) {
    console.log("📧 [email stub]");
    console.log(`   to: ${params.to}`);
    console.log(`   subject: ${params.subject}`);
    return;
  }

  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM ?? "Horion <noreply@horion.local>",
      to: params.to,
      subject: params.subject,
      html: params.html,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Resend API error: ${res.status} ${errorBody}`);
  }
}
