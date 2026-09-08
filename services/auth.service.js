const bcrypt = require("bcryptjs");
const { Credential, Profile, User, sequelize } = require("../models");
const { createHttpError } = require("../utils/httpError.util");
const { presentUser, validateUserPayload } = require("./user.service");
const { createAccessToken } = require("./token.service");

const getBcryptRounds = () => {
  const rounds = Number(process.env.BCRYPT_ROUNDS) || 10;
  return Math.min(Math.max(rounds, 10), 12);
};

const validatePassword = (password) => {
  const value = String(password || "");

  if (value.length < 8 || value.length > 72) {
    throw createHttpError(400, "La contraseña debe tener entre 8 y 72 caracteres");
  }
  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/\d/.test(value)) {
    throw createHttpError(
      400,
      "La contraseña debe incluir mayúscula, minúscula y número"
    );
  }

  return value;
};

const presentAccount = (userRecord) => {
  const user = presentUser(userRecord);
  delete user.credential;
  return user;
};

const registerAccount = async (payload = {}) => {
  const cleanUser = validateUserPayload(payload);
  const password = validatePassword(payload.password);
  const bio = String(payload.bio || "").trim();

  if (bio.length > 240) {
    throw createHttpError(400, "La biografía no puede superar 240 caracteres");
  }

  const existingUser = await User.findOne({ where: { email: cleanUser.email } });
  if (existingUser) throw createHttpError(409, "El correo ya está registrado");

  const passwordHash = await bcrypt.hash(password, getBcryptRounds());

  return sequelize.transaction(async (transaction) => {
    const user = await User.create(cleanUser, { transaction });
    await Credential.create(
      { passwordHash, role: "user", userId: user.id },
      { transaction }
    );
    const profile = await Profile.create(
      { bio, userId: user.id },
      { transaction }
    );

    return presentAccount({
      ...user.get({ plain: true }),
      profile: profile.get({ plain: true })
    });
  });
};

const loginAccount = async ({ email, password } = {}) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const rawPassword = String(password || "");

  const user = await User.findOne({
    where: { email: normalizedEmail },
    include: [
      { model: Credential, as: "credential" },
      { model: Profile, as: "profile" }
    ]
  });

  const validPassword = user?.credential
    ? await bcrypt.compare(rawPassword, user.credential.passwordHash)
    : false;

  if (!user || !validPassword) {
    throw createHttpError(401, "Correo o contraseña incorrectos");
  }
  if (!user.active) throw createHttpError(403, "El usuario se encuentra inactivo");

  return {
    token: createAccessToken(user),
    tokenType: "Bearer",
    expiresIn: process.env.JWT_EXPIRES_IN?.trim() || "1h",
    user: presentAccount(user)
  };
};

module.exports = {
  getBcryptRounds,
  loginAccount,
  presentAccount,
  registerAccount,
  validatePassword
};
