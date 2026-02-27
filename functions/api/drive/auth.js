import { SignJWT, importPKCS8 } from 'jose';

export async function getGoogleAuthToken(env) {
    const credsJson = env.DRIVE_CREDENTIALS;
    if (!credsJson) throw new Error("Missing DRIVE_CREDENTIALS in env");
    const creds = JSON.parse(credsJson);

    const privateKey = await importPKCS8(creds.private_key, 'RS256');

    const jwt = await new SignJWT({
        iss: creds.client_email,
        scope: 'https://www.googleapis.com/auth/drive.file',
        aud: 'https://oauth2.googleapis.com/token'
    })
        .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(privateKey);

    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: jwt
        })
    });

    if (!res.ok) {
        throw new Error(`Failed to get Google Auth Token: ${await res.text()}`);
    }
    const data = await res.json();
    return data.access_token;
}
