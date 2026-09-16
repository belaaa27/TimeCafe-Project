require("dotenv").config();
const app = require("./src/app");
const { sequelize } = require("./src/models");

const PORT = process.env.PORT;

const startServer = async () => {
  try {
    // Authenticate database connection
    await sequelize.authenticate();
    console.log("✅ MySQL Database connected successfully.");

    // Sync models to database (creates tables if they don't exist)
    // Note: Using { alter: true } updates schema without dropping data.
    await sequelize.sync({ alter: true });
    console.log("✅ Database models synchronized.");

    app.listen(PORT, () => {
      console.log(
        `🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`,
      );
    });
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error);
    process.exit(1);
  }
};

startServer();
