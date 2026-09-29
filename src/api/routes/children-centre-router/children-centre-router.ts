import { Router } from "express";
import { childrenCentreController } from "./children-centre-controller";
import { handle } from "@/common/utils/index";
import { validate } from "@/api/middlewares/validate.middleware";
import { childrenCentreParamsSchema, createChildrenCentreSchema, findChildrenCentresSchema, updateChildrenCentreSchema } from "./children-centre.request";

const childrenCentreRouter: Router = Router();

childrenCentreRouter.get("/", validate({ query: findChildrenCentresSchema }), handle(childrenCentreController.find));
childrenCentreRouter.get("/:id", validate({ params: childrenCentreParamsSchema }), handle(childrenCentreController.findOne));
childrenCentreRouter.post("/", validate({ body: createChildrenCentreSchema }), handle(childrenCentreController.create, 201));
childrenCentreRouter.put("/:id", validate({ params: childrenCentreParamsSchema, body: updateChildrenCentreSchema }), handle(childrenCentreController.update));

export { childrenCentreRouter }
