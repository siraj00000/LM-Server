import express from "express";
import WarrantyController from "../controllers/warranty.controller.js";
import { upload } from "../middleware/upload_file.middleware.js";
const warrantyRouter = express.Router();
warrantyRouter
    .post("/register-warranty", upload.single('image'), WarrantyController.warrantyRegistration)
    .put("/update-warranty/:id", WarrantyController.updateWarranty)
    .get("/:id", WarrantyController.getWarrantyById);
export default warrantyRouter;
//# sourceMappingURL=warranty.router.js.map