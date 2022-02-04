import { QueryCommandInput, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { Dynamo } from "../../AWSClients/ddbDocClient";
import { ENTITY_TYPES } from "../../Config";
import { DynamoUser } from "../../types/dynamo";
import { GetUserByEmailInput } from "../../types/main";
const { DYNAMO_TABLE_NAME } = process.env;
import { SdkError } from "@aws-sdk/types";
export default async function GetByEmail(
  props: GetUserByEmailInput
): Promise<[DynamoUser, null] | [null, SdkError]> {
  const { email } = props;
  const params: QueryCommandInput = {
    TableName: `${process.env.NODE_ENV}-${DYNAMO_TABLE_NAME}`,
    IndexName: "GSI2",
    KeyConditionExpression: "GSI2PK = :GSI2PK AND GSI2SK = :GSI2SK",
    ExpressionAttributeValues: {
      ":GSI2PK": email.toLowerCase().trim(),
      ":GSI2SK": ENTITY_TYPES.USER,
    },
  };

  try {
    const response = await Dynamo.send(new QueryCommand(params));
    return [response.Items[0] as DynamoUser, null];
    // TODO are we sure the first item will be the user? Switch this to .find
  } catch (error) {
    return [null, error];
  }
}