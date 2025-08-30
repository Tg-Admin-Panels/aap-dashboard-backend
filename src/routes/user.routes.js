import { Router } from "express";
import {
    createAdmin,
    getCurrentUser,
    getUserById,
    getUsers,
    login,
    logout,
} from "../controllers/user.controller.js";
import {
    ensureAuthenticated,
    ensureAdmin,
    ensureSuperAdmin,
    ensureVolunteer,
    ensureWingleader,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/me", ensureAuthenticated, getCurrentUser);

router.route("/login").post(login);
router.route("/logout").post(logout);

router.use(ensureAuthenticated);
router.route("/admin").post(createAdmin);
router.route("/").get(ensureAdmin, getUsers);
router.route("/:id").get(ensureAdmin, getUserById);

export default router;
