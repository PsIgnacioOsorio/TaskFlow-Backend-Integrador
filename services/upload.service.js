const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const { Profile } = require("../models");
const { createHttpError } = require("../utils/httpError.util");

const uploadsRoot = path.join(__dirname, "..", "uploads", "avatars");

const detectImageExtension = (buffer) => {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  )) return "png";
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpg";
  }
  if (
    buffer.length >= 12
    && buffer.subarray(0, 4).toString("ascii") === "RIFF"
    && buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) return "webp";
  return null;
};

const removePreviousAvatar = async (avatarUrl) => {
  if (!avatarUrl?.startsWith("/uploads/avatars/")) return;
  const filename = path.basename(avatarUrl);
  try {
    await fs.unlink(path.join(uploadsRoot, filename));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
};

const saveAvatar = async (userId, file) => {
  if (!file?.buffer?.length) throw createHttpError(400, "Debes adjuntar una imagen en el campo file");
  const extension = detectImageExtension(file.buffer);
  if (!extension) {
    throw createHttpError(415, "El contenido del archivo no corresponde a una imagen permitida");
  }

  await fs.mkdir(uploadsRoot, { recursive: true });
  const filename = `${userId}-${crypto.randomUUID()}.${extension}`;
  const absolutePath = path.join(uploadsRoot, filename);
  await fs.writeFile(absolutePath, file.buffer, { flag: "wx" });

  try {
    const [profile] = await Profile.findOrCreate({
      where: { userId },
      defaults: { userId, bio: "", avatarUrl: null }
    });
    const previousAvatar = profile.avatarUrl;
    const avatarUrl = `/uploads/avatars/${filename}`;
    await profile.update({ avatarUrl });
    await removePreviousAvatar(previousAvatar);
    return { avatarUrl, profile: profile.get({ plain: true }) };
  } catch (error) {
    await fs.unlink(absolutePath).catch(() => {});
    throw error;
  }
};

module.exports = { detectImageExtension, removePreviousAvatar, saveAvatar, uploadsRoot };
