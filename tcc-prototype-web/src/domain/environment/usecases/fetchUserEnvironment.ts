import {
    createEmptyEnvironmentConfiguration,
    type EnvironmentLoadResult,
    type EquippedEnvironmentItem,
} from '../types/environment';

export type FetchUserEnvironmentDeps = {
  listUserEnvironmentItems: (userId: string) => Promise<{
    data: EquippedEnvironmentItem[] | null;
    error: { message: string } | null;
  }>;
};

export async function fetchUserEnvironment(
  deps: FetchUserEnvironmentDeps,
  userId: string,
): Promise<EnvironmentLoadResult> {
  if (!userId) {
    return {
      data: createEmptyEnvironmentConfiguration(),
      status: 'error',
      error: 'Usuario nao autenticado.',
    };
  }

  const { data, error } = await deps.listUserEnvironmentItems(userId);

  if (error) {
    return {
      data: createEmptyEnvironmentConfiguration(),
      status: 'error',
      error: error.message,
    };
  }

  const configuration = createEmptyEnvironmentConfiguration();

  for (const equippedItem of data ?? []) {
    configuration.bySlot[equippedItem.slotName] = equippedItem;
  }

  return {
    data: configuration,
    status: 'loaded',
    error: null,
  };
}
