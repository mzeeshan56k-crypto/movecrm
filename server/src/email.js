// Email sending via Resend. Optional — when RESEND_API_KEY isn't set, calls are
// skipped gracefully so the app runs fine without email configured.
export const emailConfigured = () => !!process.env.RESEND_API_KEY;

export async function sendEmail({ to, subject, html }) {
  if (!emailConfigured()) return { skipped: true };
  const recipients = Array.isArray(to) ? to : [to];
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL || 'MoveCRM <onboarding@resend.dev>',
      to: recipients,
      subject,
      html,
    }),
  });
  if (!res.ok) throw new Error(`Email send failed (${res.status}): ${await res.text()}`);
  return res.json();
}
