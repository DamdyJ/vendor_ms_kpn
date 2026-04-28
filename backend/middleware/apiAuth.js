require("dotenv").config();

const apiAuth = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
        res.setHeader("WWW-Authenticate", "Basic");
        return res.status(401).json({ message: "Credential required" });
    }

    const base64Credentials = authHeader.split(" ")[1];
    const credentials = Buffer.from(base64Credentials, "base64").toString(
        "ascii"
    );
    const [username, password] = credentials.split(":");

    if (
        username !== process.env.BASIC_AUTH_USER ||
        password !== process.env.BASIC_AUTH_PASS
    ) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    // const { apiKey } = req.body;
    // if (!apiKey) {
    //     return res.status(401).json({ message: "API key is required in body" });
    // }

    // if (apiKey !== process.env.API_KEY) {
    //     return res.status(403).json({ message: "Invalid API key" });
    // }

    next();
};

module.exports = apiAuth;
