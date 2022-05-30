import { GetCommandInput, GetCommand } from '@aws-sdk/lib-dynamodb';
import { SdkError } from '@aws-sdk/types';
import { Dynamo } from '../../awsClients/ddbDocClient';
import { DYNAMO_TABLE_NAME, Entities } from '../../Config';
import { DynamoWebhook } from '../../types/dynamo';
import { GetWebhookByIdInput } from '../../types/main';

export default async function Get(props: GetWebhookByIdInput): Promise<[DynamoWebhook, SdkError]> {
  const { orgId, webhookId } = props;
  const params: GetCommandInput = {
    TableName: `${process.env.NODE_ENV}-${DYNAMO_TABLE_NAME}`,
    Key: {
      PK: `${Entities.ORG}#${orgId}#${Entities.WEBHOOK}#${webhookId}`,
      SK: Entities.WEBHOOK,
    },
  };

  try {
    const response = await Dynamo.send(new GetCommand(params));
    return [response.Item as DynamoWebhook, null];
  } catch (error) {
    return [null, error];
  }
}