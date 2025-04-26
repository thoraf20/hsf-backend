export function generateRandomSixNumbers(): number {
    return Math.floor(100000 + Math.random() * 900000);
}
export function generateDefaultPassword(): string {
    const randomNumber = generateRandomSixNumbers();
    let randomText = Math.random().toString(36).substring(2, 8); // Generates a random alphanumeric string
    randomText = randomText.charAt(0).toUpperCase() + randomText.slice(1); // Capitalize the first letter
    return `${randomText}@${randomNumber}`;
}

export function generateTransactionId(): string {
    const timestamp = Date.now().toString(36);
    const randomString = Math.random().toString(36).substring(2, 10);
    return `TX-${timestamp}-${randomString.toUpperCase()}`;
}

export function generateReferenceNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `REF-${timestamp}-${randomString}`;
}

export async function syncToCalendar(details: {
    platform: string,
    meeting_link: string,
    date: string,
    time: string,
    user_id: string,
  }) {
    // TODO: Integrate with Google Calendar, Zoom, Outlook etc.
    console.log(`Syncing meeting to ${details.platform} calendar for user ${details.user_id}`)
  }
  

export function generateInvitationToken(): string {
    const randomString = Math.random().toString(36).substring(2, 12);
    const timestamp = Date.now().toString(36);
    return `INV-${randomString.toUpperCase()}-${timestamp}`;
}