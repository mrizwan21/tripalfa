const str = 'test & < > " \'';
console.log('Original:', str);
console.log('Escaped:', str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;"));
