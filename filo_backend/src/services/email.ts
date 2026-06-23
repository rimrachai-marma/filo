import { Resend } from "resend";

export class EmailService {
  private resend: Resend | null = null;
  private readonly from: string;
  private readonly appUrl: string;

  constructor() {
    this.from = process.env.RESEND_FROM || "noreply@filo.com";
    this.appUrl = process.env.APP_URL || "http://localhost:3000";

    if (process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY);
    }
  }

  private buildUrl(path: string, token: string): string {
    return `${this.appUrl}${path}?token=${token}`;
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.resend) {
      console.log(`\n📧 EMAIL (dev — no RESEND_API_KEY set)`);
      console.log(`   To: ${to}`);
      console.log(`   Subject: ${subject}`);
      console.log(`   Body: ${html}\n`);
      return;
    }

    const { error } = await this.resend.emails.send({
      from: this.from,
      to,
      subject,
      html,
    });

    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendVerificationEmail(email: string, token: string, name: string): Promise<void> {
    const url = this.buildUrl("/auth/verify-email", token);
    const html = /* html */ `
      <p>Hi ${name},</p>
      <p>
        Thanks for signing up! Please verify your email by clicking the link
        below:
      </p>
      <p><a href="${url}">${url}</a></p>
      <p>Expires in 24 hours.</p>
    `;
    await this.send(email, "Verify your email – Filo", html);
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const url = this.buildUrl("/auth/reset-password", token);
    const html = /* html */ `
      <p>You requested a password reset. Click the link below to set a new password:</p>
      <p><a href="${url}">${url}</a></p>
      <p>If you didn't request this, you can ignore this email.</p>
      <p>Expires in 1 hour.</p>
    `;
    await this.send(email, "Reset your password – Filo", html);
  }
}


// import nodemailer, { type Transporter } from "nodemailer";

// export class EmailService {
//   private transporter: Transporter | null = null;
//   private readonly from: string;
//   private readonly appUrl: string;

//   constructor() {
//     this.from = process.env.SMTP_FROM || "noreply@filo.com";
//     this.appUrl = process.env.APP_URL || "http://localhost:3000";

//     if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_PORT) {
//       this.transporter = nodemailer.createTransport({
//         host: process.env.SMTP_HOST,
//         port: parseInt(process.env.SMTP_PORT),
//         secure: false,
//         auth: {
//           user: process.env.SMTP_USER,
//           pass: process.env.SMTP_PASS,
//         },
//       });
//     }
//   }

//   private buildUrl(path: string, token: string): string {
//     return `${this.appUrl}${path}?token=${token}`;
//   }

//   private async send(to: string, subject: string, html: string): Promise<void> {
//     if (!this.transporter) {
//       console.log(`\n📧 EMAIL (dev — no SMTP set)`);
//       console.log(`   To: ${to}`);
//       console.log(`   Subject: ${subject}`);
//       console.log(`   Body: ${html}\n`);

//       return;
//     }

//     await this.transporter.sendMail({ from: this.from, to, subject, html });
//   }

//   async sendVerificationEmail(email: string, token: string, name: string): Promise<void> {
//     const url = this.buildUrl("/auth/verify-email", token);

//     const html = /* html */ `
//       <p>Hi ${name},</p>
//       <p>
//         Thanks for signing up! Please verify your email by clicking the link
//         below:
//       </p>
//       <p><a href="${url}">${url}</a></p>
//       <p>Expires in 24 hours.</p>
//     `;

//     await this.send(email, "Verify your email – Filo", html);
//   }

//   async sendPasswordResetEmail(email: string, token: string): Promise<void> {
//     const url = this.buildUrl("/auth/reset-password", token);

//     const html = /* html */ `
//         <p>You requested a password reset. Click the link below to set a new password:</p>
//         <p><a href="${url}">${url}</a></p>
//         <p>If you didn't request this, you can ignore this email.</p>
//         <p>Expires in 1 hour.</p>
//       `;

//     await this.send(email, "Reset your password – Filo", html);
//   }
// }
