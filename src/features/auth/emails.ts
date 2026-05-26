import { env } from "@/lib/env";

const APP_NAME = "Horion";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function wrap(content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #111;">
  ${content}
  <hr style="margin-top: 32px; border: none; border-top: 1px solid #e5e5e5;" />
  <p style="font-size: 12px; color: #888;">${APP_NAME} — suivi musculation communautaire</p>
</body>
</html>`;
}

function button(label: string, href: string): string {
  return `<p style="margin: 24px 0;"><a href="${href}" style="display: inline-block; padding: 10px 18px; background: #111; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 500;">${label}</a></p>`;
}

export function adminNewRegistrationEmail(user: { username: string; email: string }) {
  const baseUrl = env.NEXTAUTH_URL;
  return {
    subject: `[${APP_NAME}] Nouvelle inscription à valider`,
    html: wrap(`
      <h1 style="font-size: 20px;">Nouvelle inscription</h1>
      <p>Un membre vient de demander un compte&nbsp;:</p>
      <ul>
        <li><strong>Pseudo&nbsp;:</strong> ${escapeHtml(user.username)}</li>
        <li><strong>Email&nbsp;:</strong> ${escapeHtml(user.email)}</li>
      </ul>
      ${button("Valider depuis l'admin", `${baseUrl}/admin/users`)}
    `),
  };
}

export function accountActivatedEmail(user: { username: string }) {
  const baseUrl = env.NEXTAUTH_URL;
  return {
    subject: `[${APP_NAME}] Ton compte est activé`,
    html: wrap(`
      <h1 style="font-size: 20px;">Bienvenue ${escapeHtml(user.username)}&nbsp;!</h1>
      <p>Ton compte ${APP_NAME} a été validé par l'admin. Tu peux maintenant te connecter et créer ta première séance.</p>
      ${button("Se connecter", `${baseUrl}/login`)}
    `),
  };
}

export function passwordResetEmail(token: string) {
  const baseUrl = env.NEXTAUTH_URL;
  return {
    subject: `[${APP_NAME}] Réinitialisation de mot de passe`,
    html: wrap(`
      <h1 style="font-size: 20px;">Réinitialisation de mot de passe</h1>
      <p>Tu as demandé à réinitialiser ton mot de passe ${APP_NAME}. Clique sur le bouton ci-dessous (lien valide 1&nbsp;heure).</p>
      ${button("Choisir un nouveau mot de passe", `${baseUrl}/reset-password?token=${token}`)}
      <p style="font-size: 12px; color: #888;">Si tu n'as pas fait cette demande, ignore cet email — ton mot de passe reste inchangé.</p>
    `),
  };
}
