
/**
 * Opens the user's default mail client with a pre-filled email.
 * @param to The recipient's email address.
 * @param subject The subject line of the email.
 * @param htmlBody The HTML content of the email.
 */
export const sendEmail = (to: string, subject: string, htmlBody: string): void => {
    if (!to || !subject || !htmlBody) {
        console.warn("Attempted to trigger mail client with missing `to`, `subject`, or `body`.");
        return;
    }
    
    // Convert basic HTML to plain text for mailto link.
    // This handles line breaks and removes other HTML tags for better compatibility.
    const plainTextBody = htmlBody
        .replace(/<br\s*\/?>/gi, '\n') 
        .replace(/<[^>]*>/g, '');      

    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(plainTextBody);

    const mailtoLink = `mailto:${to}?subject=${encodedSubject}&body=${encodedBody}`;

    // This command opens the default mail client.
    window.location.href = mailtoLink;
};
