import { Router } from "express";
import { staffController } from "./staff-controller";
import { handle } from "@/common/utils/index";
import { validate } from "@/api/middlewares/validate.middleware";
import { childrenCentreStaffParamsSchema, createStaffSchema, findStaffSchema, staffParamsSchema } from "./staff.request";

const staffRouter: Router = Router({ mergeParams: true });

staffRouter.get("/", validate({ params: childrenCentreStaffParamsSchema, query: findStaffSchema }), handle(staffController.find));
staffRouter.get("/:id", validate({ params: staffParamsSchema }), handle(staffController.findOne));
staffRouter.post("/", validate({ params: childrenCentreStaffParamsSchema, body: createStaffSchema }), handle(staffController.create, 201));

export { staffRouter }
