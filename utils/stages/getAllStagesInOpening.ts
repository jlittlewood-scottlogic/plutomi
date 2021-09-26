import { QueryCommand, QueryCommandInput } from "@aws-sdk/lib-dynamodb";
import { Dynamo } from "../../libs/ddbDocClient";
import { GetOpening } from "../openings/getOpeningById";
const { DYNAMO_TABLE_NAME } = process.env;

export async function GetAllStagesInOpening(
  org_id: string,
  opening_id: string
) {
  // TODO now that we have sorting
  // we want to sort the results here based on the sort_order
  // So we should first get the opening's sort_order
  // Then query stages
  // Then sort based on those ID's.
  // TODO also update the client side array onDragEnd until mutate runs with the new order

  const opening = await GetOpening({ org_id, opening_id });
  const { stage_order } = opening;

  const params: QueryCommandInput = {
    TableName: DYNAMO_TABLE_NAME,
    IndexName: "GSI1",
    KeyConditionExpression: "GSI1PK = :GSI1PK",
    ExpressionAttributeValues: {
      ":GSI1PK": `ORG#${org_id}#OPENING#${opening_id}#STAGES`,
    },
  };

  try {
    const response = await Dynamo.send(new QueryCommand(params));
    const all_stages = response.Items;

    const result = stage_order.map((i) =>
      all_stages.find((j) => j.stage_id === i)
    );

    return result;
  } catch (error) {
    throw new Error(error);
  }
}