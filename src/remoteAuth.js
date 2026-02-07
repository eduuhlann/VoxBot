const WebSocket = require('ws');
const NodeRSA = require('node-rsa');
const crypto = require('crypto');
const EventEmitter = require('events');
const QRCode = require('qrcode');

class RemoteAuth extends EventEmitter {
    constructor() {
        super();
        this.ws = null;
        this.key = new NodeRSA({ b: 2048 });
        this.key.setOptions({ encryptionScheme: 'pkcs1' });
        this.fingerprint = null;
    }

    connect() {
        this.ws = new WebSocket('wss://remote-auth-gateway.discord.gg/?v=2', {
            origin: 'https://discord.com'
        });

        this.ws.on('open', () => {
            // console.log('Remote Auth WS Connected');
        });

        this.ws.on('message', async (data) => {
            const message = JSON.parse(data);

            switch (message.op) {
                case 'hello':
                    // Send Init
                    const publicKey = this.key.exportKey('public');
                    // Format public key as base64 but removing headers
                    // Actually Discord expects standard PEM or DER usually.
                    // The protocol sends the public key in a specific format.
                    // Let's assume standard PEM for now, but usually it needs to be raw or specific.
                    // Key export: 'pkcs8-public-pem'

                    const encodedKey = this.key.exportKey('pkcs8-public-pem')
                        .replace(/-----BEGIN PUBLIC KEY-----\n|\n-----END PUBLIC KEY-----/g, '')
                        .replace(/\n/g, '');

                    this.ws.send(JSON.stringify({
                        op: 'init',
                        encoded_public_key: encodedKey
                    }));

                    setInterval(() => {
                        this.ws.send(JSON.stringify({ op: 'heartbeat' }));
                    }, message.heartbeat_interval);
                    break;

                case 'nonce_proof':
                    // Decrypt nonce
                    const nonce = this.key.decrypt(Buffer.from(message.encrypted_nonce, 'base64'));
                    // Create proof (SHA256 hash of nonce)
                    const proof = crypto.createHash('sha256').update(nonce).digest('base64')
                        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); // URL Safe Base64

                    this.ws.send(JSON.stringify({
                        op: 'nonce_proof',
                        proof: proof
                    }));
                    break;

                case 'pending_remote_init':
                    this.fingerprint = message.fingerprint;
                    // Generate QR Code
                    const qrUrl = `https://discordapp.com/ra/${this.fingerprint}`;
                    const qrBuffer = await QRCode.toBuffer(qrUrl);
                    this.emit('qr', qrBuffer);
                    break;

                case 'pending_ticket':
                    // Ticket received. User scanned.
                    const ticket = message.encrypted_user_payload; // Need to decrypt this? 
                    // No, usually wait for pending_login
                    // Actually, 'pending_ticket' means user scanned but not confirmed.
                    // We need to wait.
                    break;

                case 'pending_login':
                    // User confirmed on phone.
                    // Payload contains encrypted token?
                    // Actually, discord sends 'ticket' which we exchange?
                    // No, v2 sends 'encrypted_token' in 'pending_login' or 'finish'?
                    // Let's check protocols. Usually 'finish' has the data.
                    // Wait, v2 sends a ticket. Then we have to POST to an endpoint?
                    // Or it sends 'pending_login' with ticket.
                    // Actually, Discord Remote Auth V2 Flow:
                    // 1. Init -> Hello
                    // 2. Nonce Proof
                    // 3. Pending Remote Init (Fingerprint)
                    // 4. Pending Ticket (User Scanned)
                    // 5. Pending Login (User Confirmed) -> Ticket
                    // 6. We use ticket to POST /users/@me/remote-auth/login
                    // 7. Response contains encrypted_token
                    // 8. Decrypt token.

                    // Implementation note: Handling this full flow correctly require fetch.

                    if (message.ticket) {
                        this.exchangeTicket(message.ticket);
                    }
                    break;

                case 'finish':
                    // V1 used to send token here. V2 implies ticket exchange.
                    // But let's check payload.
                    if (message.encrypted_token) {
                        const token = this.key.decrypt(Buffer.from(message.encrypted_token, 'base64'), 'utf8');
                        this.emit('token', token);
                        this.ws.close();
                    }
                    break;

                case 'cancel':
                    this.emit('cancel');
                    this.ws.close();
                    break;
            }
        });
    }

    async exchangeTicket(ticket) {
        // Exchange ticket for token
        try {
            const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
            const response = await fetch('https://discord.com/api/v9/users/@me/remote-auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticket: ticket })
            });
            const data = await response.json();
            if (data.encrypted_token) {
                const token = this.key.decrypt(Buffer.from(data.encrypted_token, 'base64'), 'utf8');
                this.emit('token', token);
                this.ws.close();
            }
        } catch (e) {
            console.error(e);
            this.emit('error', e);
        }
    }
}

module.exports = RemoteAuth;
