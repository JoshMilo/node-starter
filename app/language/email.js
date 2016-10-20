module.exports = {
  password: {
    subject: 'Password reset',
    sent: 'Password reset instructions have been sent to {{email}}.',
    message: `
      <p>Hello, {{firstName}}!</p>
      <p>We received a request to reset the password associated with this email address. If you made this request, please follow the instructions below.</p>
      <p>If you did not request to have your password reset, you can safely ignore this email.</p>
      <p><strong>Click the link below to reset your password:</strong></p>
      <p><a href="https://{{host}}/reset-password/{{token}}">https://{{host}}/reset-password/{{token}}</a></p>
    `,
  },
  verification: {
    subject: 'Please verify your account',
    sent: 'A verification email has been sent to {{email}} with instructions on fully activating your account.',
    message: `
      <p>Hello {{firstName}}!</p>
      <p>In order to verify your email and fully activate your account, please click the link below.</p>
      <p><a href="https://{{host}}/user/verify-email/{{token}}">https://{{host}}/user/verify-email/{{token}}</a></p>
    `,
  },
}
