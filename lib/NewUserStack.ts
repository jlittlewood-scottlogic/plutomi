import * as dotenv from "dotenv";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as path from "path";
import * as cdk from "@aws-cdk/core";
import * as sqs from "@aws-cdk/aws-sqs";
import * as lambda from "@aws-cdk/aws-lambda";
import * as lambdaEventSources from "@aws-cdk/aws-lambda-event-sources";
import { NodejsFunction } from "@aws-cdk/aws-lambda-nodejs";
import * as iam from "@aws-cdk/aws-iam";
import { STREAM_EVENTS } from "../Config";
import * as events from "@aws-cdk/aws-events";

const resultDotEnv = dotenv.config({
  path: __dirname + `../../.env.${process.env.NODE_ENV}`,
});

if (resultDotEnv.error) {
  throw resultDotEnv.error;
}

interface NewUserStackProps extends cdk.StackProps {
  table: dynamodb.Table;
}

/**
 * This stack has 4 main purposes:
 * 1. When a user *attempts* to log in, send them an email with their login link
 * 2. When a user logs in for the first time, set their `verifiedEmail` property to TRUE
 * 3. When a user logs in for the first time, send an email to the app admin letting them know
 * 4. When a user logs in for the first time, send that user a welcome email
 */
export default class NewUserStack extends cdk.Stack {
  public readonly SendLoginLinkQueue: sqs.Queue;
  /**
   * @param {cdk.Construct} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */

  constructor(scope: cdk.App, id: string, props: NewUserStackProps) {
    super(scope, id, props);

    const SES_DOMAIN = process.env.DOMAIN_NAME;
    const API_URL: string = process.env.API_URL;
    const STACK = [
      {
        queue: {
          queueName: "",
          visibilityTimeout: cdk.Duration.seconds(10),
        },
        function: {
          name: "SendLoginLinkFunction",
        },
      },
    ];

    this.SendLoginLinkQueue = new sqs.Queue(this, "SendLoginLinkQueue", {
      queueName: "SendLoginLinkQueue",
      visibilityTimeout: cdk.Duration.seconds(10),
      receiveMessageWaitTime: cdk.Duration.seconds(20),
      encryption: sqs.QueueEncryption.KMS,
    });

    const createdFunction = new NodejsFunction(this, "SendLoginLinkFunction", {
      memorySize: 128,
      timeout: cdk.Duration.seconds(5),
      runtime: lambda.Runtime.NODEJS_14_X,
      architecture: lambda.Architecture.ARM_64,
      bundling: {
        minify: true,
        externalModules: ["aws-sdk"],
      },
      handler: "main",
      entry: path.join(__dirname, `/../functions/sendLoginLink.ts`),
      environment: {
        API_URL: API_URL,
      },
      description:
        "Sends login links to users when they sign in with their email",
    });
    createdFunction.addEventSource(
      new lambdaEventSources.SqsEventSource(this.SendLoginLinkQueue, {
        batchSize: 1,
      })
    );
    createdFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["ses:SendEmail"],
        resources: [
          `arn:aws:ses:us-east-1:${
            cdk.Stack.of(this).account
          }:identity/${SES_DOMAIN}`,
        ],
      })
    );
  }
}
