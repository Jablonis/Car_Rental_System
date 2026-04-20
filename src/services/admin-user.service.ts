import User from "../models/user.model.js";
import type {
  AdminCreateUserData,
  AdminUpdateUserData,
} from "../validators/user.validator.js";

async function getAllUsers(search?: string) {
  return User.findAll(search);
}

async function getUserById(userId: number) {
  return User.findById(userId);
}

async function createAdminUser(data: AdminCreateUserData) {
  const existing = await User.findByEmail(data.email);

  if (existing) {
    throw new Error("Používateľ s týmto emailom už existuje");
  }

  const user = new User({
    name: data.name,
    email: data.email,
    password: data.password,
    isAdmin: data.isAdmin === "1",
  });

  await user.save();
  return user;
}

async function updateAdminUser(
  userId: number,
  data: AdminUpdateUserData,
  currentAdminId: number,
) {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("Používateľ neexistuje");
  }

  const emailTaken = await User.emailExists(data.email, userId);
  if (emailTaken) {
    throw new Error("Používateľ s týmto emailom už existuje");
  }

  const nextIsAdmin = data.isAdmin === "1";

  if (user.user_id === currentAdminId && !nextIsAdmin) {
    const adminCount = await User.countAdmins();

    if (adminCount <= 1) {
      throw new Error("Nemôžeš odobrať rolu poslednému adminovi");
    }
  }

  user.name = data.name;
  user.email = data.email;
  user.isAdmin = nextIsAdmin;

  await user.save();
  return user;
}

async function deleteAdminUser(userId: number, currentAdminId: number) {
  if (userId === currentAdminId) {
    throw new Error("Admin nemôže vymazať sám seba");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new Error("Používateľ neexistuje");
  }

  if (user.isAdmin) {
    const adminCount = await User.countAdmins();

    if (adminCount <= 1) {
      throw new Error("Nemôžeš vymazať posledného admina");
    }
  }

  await User.deleteById(userId);
}

export {
  getAllUsers,
  getUserById,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
};