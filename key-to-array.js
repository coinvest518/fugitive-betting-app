const bs58 = require('bs58');
const fs = require('fs');

// Replace with your base58 private key string
const base58 = '3RemjGHExAUzYkjZS4ySxXtuK8MtUJWHZEcJbsyiXir88Cq4K1Ch8CtRfrj1HHcdTYCmswu8FDY7aw8sPqpeTBtX';

const arr = Array.from(bs58.decode(base58));
fs.writeFileSync('private-key-array.json', JSON.stringify(arr));
console.log('Done! Array written to private-key-array.json');