const Users = require("../models/schemas/users");

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function login(req, res) {
  try {
    const usernameRaw = req.body?.username;
    const passwordRaw = req.body?.password;

    const username = typeof usernameRaw === "string" ? usernameRaw.trim() : "";
    const password = typeof passwordRaw === "string" ? passwordRaw.trim() : "";

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    } 

    const usernameRegex = { $regex: `^${escapeRegex(username)}$`, $options: "i" };
    const user = await Users.findOne({
      $or: [
        { username: usernameRegex },
        { email: usernameRegex },
        { phone_no: usernameRegex },
        { user_id: usernameRegex },
      ],
    }).lean();

    if (!user) {
      console.log("User not found");
      
      return res.status(401).json({ error: "Incorrect username or password" });
    }

    const storedPassword = typeof user.password === "string" ? user.password.trim() : "";
    if (!storedPassword || storedPassword !== password) {
     
      return res.status(401).json({ error: "Incorrect username or password" });
    }

    // Never send password back to frontend
    // eslint-disable-next-line no-unused-vars
    const { password: _pw, ...safeUser } = user;
    return res.json({ user: safeUser });
  } catch (error) {
    // eslint-disable-next-line no-console
   
    return res.status(500).json({ error: "Login failed" });
  }
}

async function signup(req, res) {
  try {
    const { username, password, email, phone_no, role, first_name, last_name } = req.body;

    if (!username || !password || !email || !phone_no || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Role validation
    const validRoles = ["admin", "customer", "hub manager", "customer support team lead", "customer care agent part lead", "accounts team lead", "junior accounts"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role selected" });
    }

    // Check if user already exists
    const existingUser = await Users.findOne({
      $or: [
        { username: username.trim() },
        { email: email.trim() },
        { phone_no: phone_no.trim() }
      ]
    });

    if (existingUser) {
      return res.status(400).json({ error: "User with this username, email or phone already exists" });
    }

    const newUser = new Users({
      username: username.trim(),
      first_name: first_name?.trim(),
      last_name: last_name?.trim(),
      password: password.trim(), // Storing as plain text for consistency
      email: email.trim(),
      phone_no: phone_no.trim(),
      role: role,
      status: true,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
      user_id: `USER_${Date.now()}` // Basic user_id generation
    });

    await newUser.save();

    // eslint-disable-next-line no-unused-vars
    const { password: _pw, ...safeUser } = newUser.toObject();
    return res.status(201).json({ user: safeUser, message: "User created successfully" });
  } catch (err) {
    console.error("Signup failed:", err);
    return res.status(500).json({ error: "Signup failed" });
  }
}

module.exports = { login, signup };

