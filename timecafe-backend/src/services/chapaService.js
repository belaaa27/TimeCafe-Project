// Node 18+ (you are on Node v20.12.2) includes native global fetch.
// Removing `const fetch = require('node-fetch')` resolves the ERR_REQUIRE_ESM error.

const CHAPA_URL = "https://api.chapa.co/v1/transaction/initialize";
const CHAPA_VERIFY_URL = "https://api.chapa.co/v1/transaction/verify";

/**
 * Initialize a transaction with Chapa
 * @param {Object} data - Contains amount, currency, email, first_name, last_name, tx_ref, return_url
 */
exports.initializePayment = async (data) => {
  try {
    const response = await fetch(CHAPA_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    return await response.json();
  } catch (error) {
    console.error("Chapa Init Error:", error);
    throw new Error("Failed to initialize payment with Chapa");
  }
};

/**
 * Verify a transaction with Chapa
 * @param {String} tx_ref - The unique transaction reference
 */
exports.verifyPayment = async (tx_ref) => {
  try {
    const response = await fetch(`${CHAPA_VERIFY_URL}/${tx_ref}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
      },
    });

    return await response.json();
  } catch (error) {
    console.error("Chapa Verify Error:", error);
    throw new Error("Failed to verify payment with Chapa");
  }
};
