import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        mobileNumber: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ["superadmin","admin", "volunteer"],
            default: "user",
            required: true,
        },
        // wing: {
        //     type: mongoose.Schema.Types.ObjectId,
        //     ref: "Wing",
        //     required: function () {
        //         return this.role === "wingleader";
        //     },
        // },
        volunteer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Volunteer",
            required: function () {
                return this.role === "volunteer";
            },
        },
    },
    { timestamps: true }
);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    );
};

const User = mongoose.model("User", userSchema);
export default User;
