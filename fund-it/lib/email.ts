import { Resend } from 'resend';
import { urgencyLabel } from './lifecycle';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM ?? 'Fund It <hello@example.com>';

type DeadlineItem = {
  title: string;
  deadline: string | null;
  url: string;
  profileName: string;
};

export async function sendDeadlineDigest(toEmail: string, items: DeadlineItem[]) {
  if (!resend) {
    console.warn('RESEND_API_KEY not set, skipping deadline email to', toEmail);
    return;
  }
  if (items.length === 0) return;

  const rows = items
    .map(
      (i) =>
        `<tr><td style="padding:8px 0;font-weight:600;">${i.title}</td><td style="padding:8px 0;color:#8B93A6;">${i.profileName}</td><td style="padding:8px 0;color:#FF5C7A;font-weight:700;">${urgencyLabel(i.deadline)}</td><td style="padding:8px 0;"><a href="${i.url}" style="color:#6C4CFF;">View</a></td></tr>`
    )
    .join('');

  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: `Fund It: ${items.length} deadline${items.length > 1 ? 's' : ''} coming up`,
    html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
      <h2 style="color:#10131A;">Deadlines coming up</h2>
      <table style="width:100%;border-collapse:collapse;">${rows}</table>
    </div>`,
  });
}

export async function sendNewMatchEmail(toEmail: string, profileName: string, count: number, appUrl: string) {
  if (!resend) {
    console.warn('RESEND_API_KEY not set, skipping match email to', toEmail);
    return;
  }
  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: `Fund It found ${count} new match${count > 1 ? 'es' : ''} for ${profileName}`,
    html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
      <h2 style="color:#10131A;">Opportunity, found.</h2>
      <p>Fund It found ${count} new thing${count > 1 ? 's' : ''} for ${profileName}.</p>
      <p><a href="${appUrl}/dashboard" style="color:#6C4CFF;">See what it found</a></p>
    </div>`,
  });
}
