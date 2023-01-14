const { string, object, mixed } = require("yup");
const { apiEndPoints } = require ("../../api");
const MailService  = require("../../services/mail");
const fs = require("fs");
const { uploadFolder } = require("../../config/upload")

const criarChave = (n, r = "") => {
    while (n--) {
        r += String.fromCharCode (
            (
                (r = (Math.random()*62) || 0 ),
                (r += r > 9 ? (r < 36 ? 55 : 61) : 48)
            )
        );
    }
    return r;
}

class Usuarios {
    async store(req, res, next){

        let usuarioSchema = object({
            usu_nome: string()
                .required("Entre com o nome do usuário"),
            usu_email: string()
                .email("Entre com um email válido")
                .required("Entre com um email"),
            usu_senha: string()
                .matches(
                    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/,
                    "A senha precisa conter 6 caracteres, Uma Maiúscula, Uma Minúscula, Um Número e Um Caractere Especial"
                )
                .required("Entre com a senha"),

            usu_nivel: mixed().oneOf(["admin", "comum"], "Tipo de usuário inválido")
        });


        !req.body?.usu_nivel && (req.body = {...req.body, usu_nivel: "comum"});
        !req.body?.usu_celular && (req.body = {...req.body, usu_celular: ""});
        !req.body?.usu_cpf && (req.body = {...req.body, usu_cpf: ""});

        const usu_chave = criarChave(10);
        const {usu_nome, usu_email} = req.body;
        await MailService.sendActivation({ 
            usu_nome, 
            usu_email, 
            usu_chave
         });

        req.body = {
            ...req.body, 
            usu_foto: "", 
            usu_chave: usu_chave,
            usu_emailconfirmado: false,
            usu_cadastroativo: false,
            created_at: new Date(), 
            updated_at: '',
        };

        try {
            await usuarioSchema.validate(req.body);
        } catch (error) {
            return res.status(400).end({error: error.message});
        }

        // Localizar um e-mail cadastrado

        let usuarioFinded = apiEndPoints.db
            .get("usuarios")
            .find({ usu_email: req.body.usu_email })
            .cloneDeep()
            .value();

        if(usuarioFinded){
            return res.status(400).send({error: "Usuário está cadastrado"}).end()
        }  

        next();
    }

    async update(req, res, next){
        req.body = {...req.body, updated_at: new Date()};

        next();
    }

    async activate (req, res, next) {

        const { chave } =  req.params;

        let usuario = apiEndPoints.db
        .get("usuarios")
        .find({ usu_chave: chave })
        .value();

        if(!usuario) {
            return res.status(400).send({error: "Key not finded"}).end()
        }

        usuario.usu_chave = "";
        usuario.usu_cadastroativo = true;
        usuario.usu_emailconfirmado = true;
        apiEndPoints.db.write()

        return res.status(200).send({response: "User Activated"}).end();

    }

    async uploadPhoto(req, res, next) {
        const { id } = req.params;
        const avatar = req.file;

        let usuario = await apiEndPoints.db
        .get("usuarios")
        .find({id: parseInt(id, 10)})
        .value();

        if(!usuario){
            return res.status(400).send({error: "id not found"}).end();
        }

        if(usuario.usu_foto !== ""){
            try {
                fs.unlinkSync(`${uploadFolder}/${usuario.usu_foto}`)
            } catch (error) {
                console.log("Erro ao excluir o arquivo");
                usuario.usu_foto = "";
                usuario.updated_at = new Date();
                apiEndPoints.db.write();
                return res.status(500).send({ error: "Erro" }).end()

            }
        }

        usuario.usu_foto = avatar.filename;
        usuario.usu_updated_at = new Date();
        apiEndPoints.db.write();

        let output = Object.assign({}, usuario)
        delete output.usu_senha

        return res.status(200).send({output}).end();
    }
}

module.exports = new Usuarios();


