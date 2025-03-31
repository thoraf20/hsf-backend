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