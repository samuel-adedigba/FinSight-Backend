import {
  createUser,
  getUserById,
  getUserByEmail,
  updateUserDetails,
  getAllUsers,
  deleteUser,
  updateUserIdentity,
} from "../services/userService.js";
import { hashValue, verifyValue } from "../lib/hash.js";
import { generateToken } from "../auth/jwt.js";

export async function createUserController(req, res, next) {
  try {
    const { name, email, password, phone, role } = req.body;
    // Validate required fields
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ error: 'Name, email, password, and phone are required' });
    }

    // Prevent duplicates 
    if (await getUserByEmail(email)) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const hashed = await hashValue(password);

    // Delegate to service (which auto‐creates bank account)
    const user = await createUser({ name, email, password: hashed, phone, role });

    res.status(201).json({
      message: 'User created successfully (and FinSight account provisioned)',
      user
    });
  } catch (err) {
    next(err);
  }
}

export async function getUserByIdController(req, res, next) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }
    const user = await getUserById(Number(id));
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "User found",
      user,
    });
  } catch (error) {
    console.error("Error in getUserByIdController:", error);
    next(error);
  }
}

export async function deleteUserByIdController(req, res, next) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    const userAdmin = await getUserById(Number(id));
    if (userAdmin.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        message: "You are not authorized to delete any user",
      });
    }

    const user = await deleteUser(Number(id));
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "User deleted successfully",
      user,
    });
  } catch (error) {
    console.error("Error in deleteUserByIdController:", error);
    next(error);
  }
}

export async function getUserByEmailController(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    } else if (!password) {
      return res.status(400).json({
        message: "Password is required",
      });
    }

    const user = await getUserByEmail(email);
    const comparePassword = await verifyValue(password, user.password);
    const loginToken = generateToken({ id: user.id, role: user.role });

    if (user && !comparePassword) {
      return res.status(401).json({
        message: "Invalid password",
      });
    } else if (user.email !== email) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    if (user) {
      return res.status(200).json({
        message: "Login successful",
        user,
        token: loginToken,
      });
    }
  } catch (error) {
    next(error);
  }
}

export async function updateUserDetailsController(req, res, next) {
  try {
    const id = Number(req.user.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Valid user ID is required" });
    }
    const { name, email } = req.body;
    if (!name) {
      return res.status(400).json({
        message: "Name is required",
      });
    }
    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }
    const user = await updateUserDetails({
      id,
      name,
      email,
    });
    res.status(200).json({
      message: "User details updated successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAllUsersController(req, res, next) {
  try {
     const id = req.user.id;
    if (!id) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }
    const userAdmin = await getUserById(Number(id));
    if (userAdmin.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        message: "You are not authorized to view all users",
      });
    }
    const users = await getAllUsers();
    res.status(200).json({
      message: "Users retrieved successfully",
      users,
    });
  } catch (error) {
    next(error);
  }
};

export async function updateUserIdentityController(req, res, next) {
  try {
    const id = req.user.id;
    const { bvn, nin } = req.body;

    if (!/^\d{11}$/.test(bvn)) {
      return res.status(400).json({ error: 'BVN must be 11 digits' });
    }
    if (!/^\d{11,}$/.test(nin)) {
      return res.status(400).json({ error: 'NIN is required' });
    }

    const user = await updateUserIdentity({ id, bvn, nin });
    res.status(200).json({
      message: 'Identity verified',
      user: { id: user.id, bvn: user.bvn, nin: user.nin }
    });
  } catch (err) {
    next(err);
  }
}