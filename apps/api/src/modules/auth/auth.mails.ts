import type { MailMessage } from "../../infra/mail/mail.service";

export function verificationEmail(to: string, username: string, code: string): MailMessage {
  return {
    to,
    subject: `${code} — ваш код подтверждения Instagram Clone`,
    text: [
      `Привет, ${username}!`,
      "",
      `Код для подтверждения email: ${code}`,
      "Код действует 15 минут.",
      "",
      "Если вы не регистрировались, просто проигнорируйте это письмо.",
    ].join("\n"),
  };
}

export function passwordResetEmail(to: string, username: string, code: string): MailMessage {
  return {
    to,
    subject: `${code} — код для сброса пароля Instagram Clone`,
    text: [
      `Привет, ${username}!`,
      "",
      `Код для сброса пароля: ${code}`,
      "Код действует 15 минут.",
      "",
      "Если вы не запрашивали сброс, ничего не делайте: пароль останется прежним.",
    ].join("\n"),
  };
}
