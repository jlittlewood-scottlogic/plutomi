import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import AppStack from './AppStack';
import DynamoDBStack from './DynamoDBStack';
import StorageStack from './StorageStack';

export default class PipelineStage extends cdk.Stage {
  constructor(scope: Construct, stageName: string, props?: cdk.StageProps) {
    super(scope, stageName, props);

    // const appStack = new AppStack(this, `${stageName}-AppStack`);
    const dynamoDbStack = new DynamoDBStack(this, `${stageName}-DynamoDBStack`);
    const storageStack = new StorageStack(this, `${stageName}-StorageStack`);
  }
}