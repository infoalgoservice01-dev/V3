const axios = require('axios');

async function testAuth() {
    const username = "rayyan@algogroup.us";
    const password = "mL9@Q2v#T4xR";
    const authHeader = 'Basic ' + Buffer.from(username + ':' + password).toString('base64');

    try {
        console.log("=== Attempt 1: Basic Auth on /drivers ===");
        const res = await axios.get('https://api.drivehos.app/api/v1/drivers', {
            headers: { 'Authorization': authHeader }
        });
        console.log("Success! Drivers fetched.");
        return;
    } catch (e) {
        console.log("Failed:", e.response?.status, e.response?.data || e.message);
    }

    try {
        console.log("\n=== Attempt 2: Basic Auth on /auth/user ===");
        const res = await axios.get('https://api.drivehos.app/api/v1/auth/user', {
            headers: { 'Authorization': authHeader }
        });
        console.log("Success! Auth User fetched.");
        return;
    } catch (e) {
        console.log("Failed:", e.response?.status, e.response?.data || e.message);
    }
}

testAuth();
