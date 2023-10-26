import { requireAuth, requireBlindIndicesEnabled } from "../../middleware";
import { AuthMode } from "../../variables";
import express from "express";

import { secretsRemainderController } from "../../controllers/v3";

const router = express.Router();

router.post(
  "/:secretName",
  requireAuth({
    acceptedAuthModes: [
      AuthMode.JWT,
      AuthMode.API_KEY,
      AuthMode.SERVICE_TOKEN,
      AuthMode.SERVICE_TOKEN_V3
    ]
  }),
  requireBlindIndicesEnabled({
    locationWorkspaceId: "body"
  }),
  secretsRemainderController.createRemainder
);

router.delete(
  "/:secretName",
  requireAuth({
    acceptedAuthModes: [
      AuthMode.JWT,
      AuthMode.API_KEY,
      AuthMode.SERVICE_TOKEN,
      AuthMode.SERVICE_TOKEN_V3
    ]
  }),
  requireBlindIndicesEnabled({
    locationWorkspaceId: "body"
  }),
  secretsRemainderController.deleteRemainder
);

router.patch(
  "/:secretName",
  requireAuth({
    acceptedAuthModes: [
      AuthMode.JWT,
      AuthMode.API_KEY,
      AuthMode.SERVICE_TOKEN,
      AuthMode.SERVICE_TOKEN_V3
    ]
  }),
  requireBlindIndicesEnabled({
    locationWorkspaceId: "body"
  }),
  secretsRemainderController.updateRemainder
);

export default router;
