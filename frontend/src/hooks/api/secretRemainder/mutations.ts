import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "@app/config/request";

import { secretApprovalRequestKeys } from "../secretApprovalRequest/queries";
import { secretKeys } from "../secrets/queries";
import { secretSnapshotKeys } from "../secretSnapshots/queries";
import {
  TCreateSecretRemainderDTO,
  TDeleteSecretRemainderDTO,
  TUpdateSecretRemainderDTO
} from "./types";

export const useCreateSecretRemainder = () => {
  const queryClient = useQueryClient();
  return useMutation<{}, {}, TCreateSecretRemainderDTO>({
    mutationFn: async ({ secretName, ...rest }) => {
      const { data } = await apiRequest.post(`/api/v3/secrets-remainders/${secretName}`, {
        ...rest
      });
      return data;
    },
    onSuccess: (_, { workspaceId, environment, secretPath }) => {
      queryClient.invalidateQueries(
        secretKeys.getProjectSecret({ workspaceId, environment, secretPath })
      );
      queryClient.invalidateQueries(
        secretSnapshotKeys.list({ environment, workspaceId, directory: secretPath })
      );
      queryClient.invalidateQueries(
        secretSnapshotKeys.count({ environment, workspaceId, directory: secretPath })
      );
      queryClient.invalidateQueries(secretApprovalRequestKeys.count({ workspaceId }));
    }
  });
};

export const useDeleteSecretRemainder = () => {
  const queryClient = useQueryClient();
  return useMutation<{}, {}, TDeleteSecretRemainderDTO>({
    mutationFn: async ({ secretName, ...rest }) => {
      const { data } = await apiRequest.delete(`/api/v3/secrets-remainders/${secretName}`, {
        data: {
          ...rest
        }
      });
      return data;
    },
    onSuccess: (_, { workspaceId, environment, secretPath }) => {
      queryClient.invalidateQueries(
        secretKeys.getProjectSecret({ workspaceId, environment, secretPath })
      );
      queryClient.invalidateQueries(
        secretSnapshotKeys.list({ environment, workspaceId, directory: secretPath })
      );
      queryClient.invalidateQueries(
        secretSnapshotKeys.count({ environment, workspaceId, directory: secretPath })
      );
      queryClient.invalidateQueries(secretApprovalRequestKeys.count({ workspaceId }));
    }
  });
};

export const useUpdateSecretRemainder = () => {
  const queryClient = useQueryClient();
  return useMutation<{}, {}, TUpdateSecretRemainderDTO>({
    mutationFn: async ({ secretName, ...rest }) => {
      const { data } = await apiRequest.patch(`/api/v3/secrets-remainders/${secretName}`, {
        ...rest
      });
      return data;
    },
    onSuccess: (_, { workspaceId, environment, secretPath }) => {
      queryClient.invalidateQueries(
        secretKeys.getProjectSecret({ workspaceId, environment, secretPath })
      );
      queryClient.invalidateQueries(
        secretSnapshotKeys.list({ environment, workspaceId, directory: secretPath })
      );
      queryClient.invalidateQueries(
        secretSnapshotKeys.count({ environment, workspaceId, directory: secretPath })
      );
      queryClient.invalidateQueries(secretApprovalRequestKeys.count({ workspaceId }));
    }
  });
};
