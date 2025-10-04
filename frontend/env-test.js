// Quick test to check environment variables
console.log("VITE_API_BASE_URL:", import.meta.env?.VITE_API_BASE_URL);
console.log("Environment mode:", import.meta.env?.MODE);
console.log("Dev mode:", import.meta.env?.DEV);
console.log("Prod mode:", import.meta.env?.PROD);

// Test the API configuration
import { config, endpoints } from "./src/config/api.js";
console.log("API Config:", config);
console.log("Endpoints:", endpoints);
