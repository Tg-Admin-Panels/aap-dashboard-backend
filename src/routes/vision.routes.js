import { Router } from "express";
import {
    getAllVisions,
    getVisionById,
    createVision,
    updateVision,
    deleteVision,
    addPointToVision,
    removePointFromVision,
} from "../controllers/vision.controller.js";

const router = Router();

router.route("/").get(getAllVisions).post(createVision);

router.route("/:id").get(getVisionById).put(updateVision).delete(deleteVision);

router
    .route("/:id/points")
    .post(addPointToVision)
    .delete(removePointFromVision);

export default router;
