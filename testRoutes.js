import axios from "axios";

const BASE_URL = "http://localhost:8000/wings"; // Update if running on a different port

const runTests = async () => {
    try {
        // 1. Create a wing
        const wingRes = await axios.post(`${BASE_URL}`, {
            name: "Youth Wing",
        });
        console.log("✅ Wing Created:", wingRes.data.data);
        const wingId = wingRes.data.data._id;

        // 2. Add a leader to the wing
        const leaderRes = await axios.post(`${BASE_URL}/${wingId}/leader`, {
            name: "Rahul Sharma",
            post: "Youth Leader",
            image: "https://example.com/rahul.jpg",
            phone: "9998887777",
        });
        console.log("✅ Leader Added:", leaderRes.data.data.leader);

        // 3. Add a member to the wing
        const memberRes = await axios.post(`${BASE_URL}/${wingId}/member`, {
            name: "Priya Mehta",
            post: "Coordinator",
            image: "https://example.com/priya.jpg",
            phone: "8887776666",
        });
        console.log("✅ Member Added:", memberRes.data.data.member);

        // 4. Get all wings
        const allWings = await axios.get(`${BASE_URL}`);
        console.log(
            "✅ All Wings:",
            allWings.data.data.map((w) => w.name)
        );

        // 5. Get members of specific wing
        const wingMembers = await axios.get(`${BASE_URL}/${wingId}/members`);
        console.log("✅ Wing Members:");
        console.log("Leader:", wingMembers.data.data.leader?.name);
        console.log(
            "Members:",
            wingMembers.data.data.members.map((m) => m.name)
        );
    } catch (error) {
        if (error.response) {
            console.error("❌ API Error:", error.response.data.message);
        } else {
            console.error("❌ Unexpected Error:", error.message);
        }
    }
};

runTests();
