import axios from "axios";
import FormData from "form-data";
import fs from "fs";

const BASE_URL = "http://localhost:8000/wings"; // Update if needed

// 1. Create Wing
async function createWing(name = "Test Wing2") {
    try {
        const res = await axios.post(`${BASE_URL}`, { name });
        console.log("✅ Wing Created:", res.data.data);
        return res.data.data._id;
    } catch (error) {
        console.error(
            "❌ Failed to create wing:",
            error.response?.data || error.message
        );
    }
}

// 2. Add Leader
async function addLeader(wingId) {
    try {
        const form = new FormData();
        form.append("name", "Leader John");
        form.append("post", "President");
        form.append("phone", "9876543210");
        form.append("image", fs.createReadStream("./leader.jpg")); // Ensure this image exists

        const res = await axios.post(`${BASE_URL}/${wingId}/leader`, form, {
            headers: form.getHeaders(),
        });

        console.log("✅ Leader Added:", res.data.data.leader);
    } catch (error) {
        console.error(
            "❌ Failed to add leader:",
            error.response?.data || error.message
        );
    }
}

// 3. Add Member
async function addMember(wingId) {
    try {
        const form = new FormData();
        form.append("name", "Member Alice");
        form.append("post", "Secretary");
        form.append("phone", "9123456780");
        form.append("image", fs.createReadStream("./member.jpg")); // Ensure this image exists

        const res = await axios.post(`${BASE_URL}/${wingId}/member`, form, {
            headers: form.getHeaders(),
        });

        console.log("✅ Member Added:", res.data.data.member);
    } catch (error) {
        console.error(
            "❌ Failed to add member:",
            error.response?.data || error.message
        );
    }
}

// 4. Get All Wings
async function getAllWings() {
    try {
        const res = await axios.get(`${BASE_URL}`);
        console.log("✅ All Wings:", res.data.data);
    } catch (error) {
        console.error(
            "❌ Failed to fetch wings:",
            error.response?.data || error.message
        );
    }
}

// 5. Get All Leaders
async function getAllLeaders() {
    try {
        const res = await axios.get(`${BASE_URL}/all-leaders`);
        console.log("✅ All Leaders:", res.data.data);
    } catch (error) {
        console.error(
            "❌ Failed to fetch leaders:",
            error.response?.data || error.message
        );
    }
}

// 6. Get Members of Wing
async function getWingMembers(wingId) {
    try {
        const res = await axios.get(`${BASE_URL}/${wingId}/members`);
        console.log("✅ Wing Members:", res.data.data);
    } catch (error) {
        console.error(
            "❌ Failed to fetch wing members:",
            error.response?.data || error.message
        );
    }
}

// 7. Get All Wing Members
async function getAllWingMembers() {
    try {
        const res = await axios.get(`${BASE_URL}/wingmembers`);
        console.log("✅ All Wing Members:", res.data.data);
    } catch (error) {
        console.error(
            "❌ Failed to fetch wing members:",
            error.response?.data || error.message
        );
    }
}

// Run all tests sequentially
(async () => {
    console.log("🧪 Testing Wing Routes...\n");

    const wingId = await createWing();

    if (!wingId) return console.error("❌ Cannot proceed without Wing ID");

    await addLeader(wingId);
    await addMember(wingId);
    await getAllWings();
    await getWingMembers(wingId);
    await getAllLeaders();
    await getAllWingMembers();

    console.log("\n🎉 Test Completed.");
})();
