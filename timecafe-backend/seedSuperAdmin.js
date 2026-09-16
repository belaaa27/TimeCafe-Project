require("dotenv").config();
// Import User model and sequelize database instance directly
const User = require("./src/models/User");
const sequelize = require("./src/config/database");

async function seedSuperAdmin() {
  try {
    // 1. Verify database connection
    await sequelize.authenticate();
    console.log("Connected to database...");

    const superAdminEmail = process.env.SUPERADMIN_EMAIL;
    const superAdminPassword = process.env.SUPERADMIN_PASSWORD;

    // 2. Check if account already exists
    const existingSuperAdmin = await User.findOne({
      where: { email: superAdminEmail },
    });

    if (existingSuperAdmin) {
      console.log(`Superadmin account already exists: ${superAdminEmail}`);
      process.exit(0);
    }

    // 3. Create Superadmin account
    await User.create({
      fullName: "System Superadmin",
      email: superAdminEmail,
      password: superAdminPassword,
      role: "super_admin",
    });

    console.log("Superadmin account created successfully!");
    console.log(`Email: ${superAdminEmail}`);

    process.exit(0);
  } catch (error) {
    console.error("Error seeding Superadmin account:", error);
    process.exit(1);
  }
}

seedSuperAdmin();
