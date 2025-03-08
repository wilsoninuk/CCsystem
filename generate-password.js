const bcrypt = require('bcryptjs');

const password = '123456';
bcrypt.hash(password, 10).then(hash => {
    console.log('加密后的密码:', hash);
}); 