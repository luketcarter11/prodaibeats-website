import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface EmailOptions {
  to: string
  subject: string
  text: string
  attachments?: {
    filename: string
    content: Buffer
  }[]
}

export async function sendEmail(options: EmailOptions) {
  try {
    await resend.emails.send({
      from: 'ProdAI Beats <noreply@prodaibeats.com>',
      to: options.to,
      subject: options.subject,
      text: options.text,
      attachments: options.attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content.toString('base64'),
      })),
    })
  } catch (error) {
    console.error('Failed to send email:', error)
    throw error
  }
} 