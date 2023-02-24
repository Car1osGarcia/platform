const { User } = require('./../../utils/db');
const bcrypt = require('bcrypt');
const { jwtStudentConfig, bcryptConfig } = require('./../../config/index.js');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const sendEmailWelcome = require('./../../helpers/email.welcome');

//log In
module.exports.logIn = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(200).json({ successful: false, message: 'missing to enter data.' });
        }
        const userResult = await User.findOne({ where: { email: email } });
        if (!userResult) {
            return res.status(200).json({ successful: false, message: 'email does not exist.' });
        }
        if (userResult.locked) {
            return res.status(200).json({ successful: false, message: 'blocked user.' });
        }
        if (bcrypt.compareSync(password, userResult.password)) {
            let token = jwt.sign(
                {
                    user: {
                        id: userResult.id
                    }
                },
                jwtStudentConfig.secret_key,
                {
                    expiresIn: jwtStudentConfig.expiresIn,
                    algorithm: jwtStudentConfig.algorithms[0]
                }
            );
            res.status(200).json({
                successful: true,
                message: 'login successful.',
                token: token,
                user: {
                    first_name: userResult.first_name,
                    last_name: userResult.last_name,
                    email: userResult.email,
                    validate_email: userResult.validate_email,
                    phone: userResult.phone
                }
            });
        } else {
            res.status(200).json({ successful: false, message: 'password is incorrect.' });
        }
    } catch (error) {
        console.log(error);
        res.status(400).json({ successful: false, message: error });
    }
};

//Sign Up
module.exports.signUp = async (req, res, next) => {
    try {
        const { first_name, last_name, email, password } = req.body;
        if (!first_name || !last_name || !email || !password) {
            return res.status(200).json({ successful: false, message: 'missing to enter data.' });
        }
        const emailAvailable = await User.findOne({ where: { email: email } });
        if (emailAvailable) {
            return res.status(200).json({ successful: false, message: 'email is busy.' });
        }
        const passwordCrypt = bcrypt.hashSync(password, bcryptConfig.rounds);
        const newUser = await User.create({
            id: uuidv4(),
            first_name,
            last_name,
            email,
            password: passwordCrypt
        });
        let token = jwt.sign(
            {
                user: {
                    id: newUser.id
                }
            },
            jwtStudentConfig.secret_key,
            {
                expiresIn: jwtStudentConfig.expiresIn,
                algorithm: jwtStudentConfig.algorithms[0]
            }
        );
        sendEmailWelcome({ id: newUser.id, first_name, last_name, email });
        res.status(200).json({
            successful: true,
            message: 'successful registration',
            token: token,
            user: {
                first_name: newUser.first_name,
                last_name: newUser.last_name,
                email: newUser.email,
                validate_email: newUser.validate_email,
                phone: newUser.phone
            }
        });
    } catch (error) {
        console.log(error);
        res.status(400).json({ successful: false, error: error });
    }
};

//check token
module.exports.checkToken = async (req, res, next) => {
    try {
        const { id } = req.user;
        const userResult = await User.findOne({ where: { id: id } });
        if (!userResult) {
            return res.status(200).send({ successful: false, message: 'user does not exist.' });
        }
        if (userResult.locked) {
            return res.status(200).json({ successful: false, message: 'blocked user.' });
        }
        res.status(200).json({
            successful: true,
            message: 'login successful.',
            user: {
                first_name: userResult.first_name,
                last_name: userResult.last_name,
                email: userResult.email,
                validate_email: userResult.validate_email,
                phone: userResult.phone
            }
        });
    } catch (error) {
        console.log(error);
        res.status(400).json({ successful: false, message: error });
    }
};

//Recover Password
module.exports.recoverPassword = async (req, res, next) => {
    res.status(200).json({ successful: true, message: 'Recover Password' });
};
