import type { ChildrenCentreEnrollmentsParamsSchema, CreateEnrollmentSchema, EnrollmentParamsSchema, FindEnrollmentsSchema, FindUnenrolledChildrenSchema, UpdateEnrollmentSchema } from "./enrollment.request.ts";
import { bindAll } from "@/common/utils";
import type { Req } from "@/common/types";
import {
  childService,
  childrenCentreService,
  enrollmentService,
  type ChildService,
  type ChildrenCentreService,
  type EnrollmentService,
} from "@/services";

class EnrollmentController {
  constructor(
    private enrollmentService: EnrollmentService,
    private childService: ChildService,
    private childrenCentreService: ChildrenCentreService,
  ) {
    bindAll(this);
  }

  async create(req: Req<{ params: ChildrenCentreEnrollmentsParamsSchema, body: CreateEnrollmentSchema }>) {
    const { childrenCentreId } = req.params;

    await Promise.all([
      this.childrenCentreService.findOne(childrenCentreId),
      this.childService.findOne(req.body.childId),
    ]);

    return this.enrollmentService.create({ ...req.body, childrenCentreId });
  }

  async find(req: Req<{ params: ChildrenCentreEnrollmentsParamsSchema, query: FindEnrollmentsSchema }>) {
    const { childrenCentreId } = req.params;

    await this.childrenCentreService.findOne(childrenCentreId);

    return this.enrollmentService.find({ ...req.query, childrenCentreId });
  }

  async findUnenrolledChildren(req: Req<{ params: ChildrenCentreEnrollmentsParamsSchema, query: FindUnenrolledChildrenSchema }>) {
    const { childrenCentreId } = req.params;

    await this.childrenCentreService.findOne(childrenCentreId);

    return this.childService.findUnenrolled({ ...req.query, childrenCentreId });
  }

  async findOne(req: Req<{ params: EnrollmentParamsSchema }>) {
    return this.enrollmentService.findOne(req.params.id, req.params.childrenCentreId);
  }

  async update(req: Req<{ params: EnrollmentParamsSchema, body: UpdateEnrollmentSchema }>) {
    return this.enrollmentService.update(req.params.id, req.params.childrenCentreId, req.body);
  }
}

export const enrollmentController = new EnrollmentController(enrollmentService, childService, childrenCentreService);
