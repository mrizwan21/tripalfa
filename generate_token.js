import jwt from 'jsonwebtoken';

const secret = 'test-jwt-secret-key-change-in-production';
const payload = {
    id: 'test-admin-id',
    email: 'admin@tripalfa.com',
    role: 'admin'
};

const token = jwt.sign(payload, secret, { expiresIn: '1h' });
console.log(token);
