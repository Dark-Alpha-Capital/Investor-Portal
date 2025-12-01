import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (to: string, subject: string, html: string) => {
  const response = await resend.emails.send({
    from: "DARK ALPHA CAPITAL <investors@darkalphacapital.com>",
    to,
    subject,
    html,
  });
  return response;
};
