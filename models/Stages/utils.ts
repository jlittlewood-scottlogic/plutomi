import { DynamoStage } from '../../types/dynamo';

interface GetAdjacentStagesBasedOnPositionProps {
  position?: number;
  otherStages: DynamoStage[];
}
interface AdjacentStagesResult {
  nextStageId?: string;
  previousStageId?: string;
}

export const sortStages = (unsortedStagesInOpening: DynamoStage[]): DynamoStage[] => {
  if (!unsortedStagesInOpening.length) return [];
  if (unsortedStagesInOpening.length === 1) return unsortedStagesInOpening; // No need to sort

  const firstStage = unsortedStagesInOpening.find((stage) => stage.previousStageId === undefined);

  const sortedStages = [];
  sortedStages.push(firstStage);

  // Push all but the first stage into an object so we can get *almost* O(1) queries
  const mapWithStages: Record<string, DynamoStage> = {};
  unsortedStagesInOpening.slice(1).map((stage) => {
    mapWithStages[stage.stageId] = stage;
  });

  let reachedTheEnd = false;
  let startingStage = firstStage;

  while (!reachedTheEnd) {
    const nextStage = mapWithStages[startingStage.nextStageId];
    sortedStages.push(nextStage);

    if (!nextStage.nextStageId) {
      reachedTheEnd = true;
    }
    startingStage = nextStage;
    // Continue loop until all stages are sorted
  }
  return sortedStages;
};

export const getAdjacentStagesBasedOnPosition = ({
  position,
  otherStages,
}: GetAdjacentStagesBasedOnPositionProps): AdjacentStagesResult => {
  if (position === undefined) {
    // Position not provided, add it to the end
    return {
      nextStageId: undefined,
      previousStageId: otherStages[otherStages.length - 1]?.stageId ?? undefined,
    };
  }

  if (position === 0) {
    // First in the list, get the current first stage
    return {
      previousStageId: undefined,
      nextStageId: otherStages[0]?.stageId ?? undefined,
    };
  }

  const sortedStages = sortStages(otherStages);

  return {
    previousStageId: sortedStages[position]?.stageId ?? undefined,
    nextStageId: sortedStages[position]?.stageId ?? undefined,
  };
};
