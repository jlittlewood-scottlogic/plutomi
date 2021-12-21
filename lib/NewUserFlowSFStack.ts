import * as dotenv from "dotenv";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as cdk from "@aws-cdk/core";
import * as sfn from "@aws-cdk/aws-stepfunctions";
import * as tasks from "@aws-cdk/aws-stepfunctions-tasks";
import * as logs from "@aws-cdk/aws-logs";
import { EMAILS } from "../Config";
const resultDotEnv = dotenv.config({
  path: __dirname + `../../.env.${process.env.NODE_ENV}`,
});

if (resultDotEnv.error) {
  throw resultDotEnv.error;
}

interface NewUserFlowSFProps extends cdk.StackProps {
  table: dynamodb.Table;
}

export default class NewUserFlowSFStack extends cdk.Stack {
  public NewUserFlowSF: sfn.StateMachine;
  /**
   * @param {cdk.Construct} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */

  constructor(scope: cdk.App, id: string, props: NewUserFlowSFProps) {
    super(scope, id, props);

    const updateUser = new tasks.DynamoUpdateItem(
      this,
      "UpdateVerifiedEmailStatus",
      {
        key: {
          PK: tasks.DynamoAttributeValue.fromString(
            sfn.JsonPath.stringAt("$.PK")
          ),

          SK: tasks.DynamoAttributeValue.fromString("USER"),
        },
        table: props.table,
        updateExpression: "SET verifiedEmail = :newValue",
        expressionAttributeValues: {
          ":newValue": tasks.DynamoAttributeValue.fromBoolean(true),
        },
        /**
         * If the value of ResultPath is null, that means that the state’s own raw output is discarded and its raw input becomes its result.
         * https://states-language.net/spec.html#filters
         * We want the original input to be passed down to the next tasks so that we can format emails
         */
        resultPath: sfn.JsonPath.DISCARD,
      }
    );
    updateUser.addRetry({ maxAttempts: 2 });

    const SES_SETTINGS = {
      service: "ses",
      action: "sendEmail",
      iamResources: [
        `arn:aws:ses:${cdk.Stack.of(this).region}:${
          cdk.Stack.of(this).account
        }:identity/${process.env.DOMAIN_NAME}`,
      ],
    };

    const notifyAdmin = new tasks.CallAwsService(this, "NotifyAdminOfNewUser", {
      //TODO update once native integration is implemented
      ...SES_SETTINGS,
      parameters: {
        Source: `Plutomi <${EMAILS.GENERAL}>`,
        Destination: {
          ToAddresses: [EMAILS.ADMIN],
        },
        Message: {
          Subject: {
            "Data.$": `States.Format('New user signed up - {}', $.email)`,
          },
          Body: {
            Html: {
              "Data.$": `States.Format('<h1>User ID: {}</h1>', $.userId)`,
            },
          },
        },
      },
    });

    const welcomeNewUser = new tasks.CallAwsService(this, "WelcomeNewUser", {
      //TODO update once native integration is implemented
      ...SES_SETTINGS,
      parameters: {
        Source: `Jose Valerio <${EMAILS.ADMIN}>`,
        Destination: {
          "ToAddresses.$": `States.Array($.email)`,
        },
        Message: {
          Subject: {
            Data: `Welcome to Plutomi!`,
          },
          Body: {
            Html: {
              Data: `<h1>Hello there!</h1><p>Just wanted to make you aware that this website is still in active development and <strong>you will lose your data!!!</strong><br><br>
                Please let us know if you have any questions, concerns, or feature requests by replying to this email or <a href="https://github.com/plutomi/plutomi" rel=noreferrer target="_blank" >creating an issue on Github</a>!</p>`,
            },
          },
        },
      },
    });

    const definition = updateUser.next(
      new sfn.Parallel(this, "Parallel")
        .branch(notifyAdmin)
        .branch(welcomeNewUser)
    );

    const log = new logs.LogGroup(this, "NewUserFlowSFLogGroup");

    this.NewUserFlowSF = new sfn.StateMachine(this, "NewUserFlowSF", {
      stateMachineName: "NewUserFlowSF",
      definition,
      timeout: cdk.Duration.minutes(5),
      stateMachineType: sfn.StateMachineType.EXPRESS,
      logs: {
        // Not enabled by default
        includeExecutionData: true,
        destination: log,
        level: sfn.LogLevel.ALL,
      },
    });
    props.table.grantWriteData(this.NewUserFlowSF);
  }
}
