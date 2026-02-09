
/**
 * Service to handle sending emails via the Gmail API
 */
export const sendGmailMessage = async (
  accessToken: string,
  to: string,
  subject: string,
  body: string
): Promise<{ ok: boolean; error?: string }> => {
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const messageParts = [
    `To: ${to}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${utf8Subject}`,
    '',
    body,
  ];
  const message = messageParts.join('\n');

  // The message needs to be base64url encoded
  const encodedEmail = btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  try {
    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw: encodedEmail,
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      return { ok: false, error: text || `HTTP ${response.status}` };
    }

    return { ok: true };
  } catch (error: any) {
    console.error('Gmail API Error:', error);
    return { ok: false, error: error?.message || 'Network error' };
  }
};
