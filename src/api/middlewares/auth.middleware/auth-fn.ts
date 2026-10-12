import { InternalServerError } from "@/common/errors";
import type { Req, Res } from "@/common/types";
import { threadService } from "@/services";
import { currentMemberId } from "./locals";

async function threadParticipantCheck(
  req: Req<{ params: { threadId: string } }>,
  res: Res,
): Promise<void> {
  const memberId = currentMemberId(res);

  const threadId = req.params.threadId;

  if (threadId === undefined)
    throw new InternalServerError(
      `route ${req.url} doesnt have threadId param`,
    );

  await threadService.findOne(threadId, memberId);
}