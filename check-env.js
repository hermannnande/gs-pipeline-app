console.log("--- ENV CHECK ---");
console.log("NODE_ENV:", process.env.NODE_ENV);
if (process.env.DATABASE_URL) {
  console.log("DATABASE_URL is set. Length:", process.env.DATABASE_URL.length);
  console.log("Starts with:", process.env.DATABASE_URL.substring(0, 15));
} else {
  console.error("❌ DATABASE_URL is NOT set or empty");
}
console.log("--- END CHECK ---");

