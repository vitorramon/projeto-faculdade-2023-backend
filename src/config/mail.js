const configMail = {
    host: "smtp.gmail.com",
    port: "465",
    secure: true,
    auth: {
        user: "teste.usu.validacao@gmail.com",
        pass: "fmprprkhegvuhxvu"
    },
    default: {
        from: "no-reply <teste.usu.validacao@gmail.com>"
    }
};

module.exports = configMail;