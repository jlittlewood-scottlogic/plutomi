// import { Request, Response } from 'express';
// import Joi from 'joi';
// import { Filter, UpdateFilter } from 'mongodb';
// import { IndexableProperties } from '../../@types/indexableProperties';
// import { JOI_SETTINGS, LIMITS } from '../../Config';
// import { QuestionEntity, StageEntity, StageQuestionItemEntity } from '../../models';
// import { findInTargetArray, generateId } from '../../utils';
// import { collections, mongoClient } from '../../utils/connectToDatabase';

// const schema = Joi.object({
//   body: {
//     questionId: Joi.string(),
//     /**
//      * 0 based index on where should the question should be added
//      * If no position is provided, question is added to the end of the stage
//      */
//     position: Joi.number()
//       .min(0)
//       .max(LIMITS.MAX_CHILD_ITEM_LIMIT - 1),
//   },
// }).options(JOI_SETTINGS);

// export const addQuestionToStage = async (req: Request, res: Response) => {
//   const { user } = req;
//   try {
//     await schema.validateAsync(req);
//   } catch (error) {
//     return res.status(400).json({ message: 'An error ocurred', error });
//   }

//   // TODO types, and allow position
//   const { questionId, position }: { questionId: string; position?: number } = req.body;
//   const { stageId } = req.params; // TODO update route to not include openingId

//   const { orgId } = user;
//   const stageFilter: Filter<StageEntity> = {
//     id: stageId,
//     target: [
//       {
//         property: IndexableProperties.Org,
//         value: orgId,
//       },
//     ],
//   };

//   let stage: StageEntity | undefined;
//   try {
//     stage = (await collections.stages.findOne(stageFilter)) as StageEntity;
//   } catch (error) {
//     const msg = 'An error ocurred finding the info for that stage';
//     console.error(msg, error);
//     return res.status(500).json({ message: msg });
//   }

//   if (!stage) {
//     return res.status(404).json({ message: 'Stage not found!' });
//   }

//   const questionFilter: Filter<QuestionEntity> = {
//     id: questionId,
//     target: [{ property: IndexableProperties.Org, value: orgId }],
//   };

//   let question: QuestionEntity | undefined;
//   try {
//     question = (await collections.questions.findOne(questionFilter)) as QuestionEntity;
//   } catch (error) {
//     const msg = 'An error ocurred finding that question in this org';
//     console.error(msg, error);
//     return res.status(500).json({ message: msg });
//   }

//   if (!question) {
//     return res.status(404).json({ message: 'Question not found!' });
//   }

//   // Get the current last question

//   let currentLastStageQuestionItem: StageQuestionItemEntity;
//   const currentLastStageQuestionItemFilter: Filter<StageQuestionItemEntity> = {
//     $and: [
//       // ! TODO: Replace with elemmatch
//       {
//         target: { property: IndexableProperties.Org, value: orgId },
//       },
//       { target: { property: IndexableProperties.Stage, value: stageId } },
//       { target: { property: IndexableProperties.NextQuestion, value: null } },
//     ],
//   };

//   try {
//     currentLastStageQuestionItem = (await collections.stageQuestionItem.findOne(
//       currentLastStageQuestionItemFilter,
//     )) as StageQuestionItemEntity;
//   } catch (error) {
//     const message = 'An error ocurred retrieving the last question in the stage';
//     console.error(message, error);
//     return res.status(500).json(message);
//   }

//   const newStageQuestionItemId = generateId({});
//   const now = new Date();
//   const newStageQuestionItem: StageQuestionItemEntity = {
//     createdAt: now,
//     updatedAt: now,
//     id: newStageQuestionItemId,
//     orgId,
//     target: [
//       { property: IndexableProperties.Question, value: questionId },
//       {
//         property: IndexableProperties.PreviousQuestion,
//         value: currentLastStageQuestionItem
//           ? findInTargetArray(IndexableProperties.Question, currentLastStageQuestionItem)
//           : null,
//       },
//       {
//         // Add it to the end by default
//         // TODO allow position
//         property: IndexableProperties.NextQuestion,
//         value: null,
//       },
//     ],
//   };

//   const session = mongoClient.startSession();

//   let transactionResults;

//   try {
//     transactionResults = await session.withTransaction(async () => {
//       // 1. TODO Create the stage question item

//       await collections.stageQuestionItem.insertOne(newStageQuestionItem, { session });
//       // 2. TODO Increment the totalQuestions on the stage

//       const updateStageOptions: UpdateFilter<StageEntity> = {
//         $inc: { totalQuestions: 1 },
//       };

//       await collections.stages.updateOne(stageFilter, updateStageOptions, { session });
//       // 3. TODO Increment the totalStages on the question

//       const updateQuestionOptions: UpdateFilter<QuestionEntity> = {
//         $inc: { totalStages: 1 },
//       };

//       await collections.questions.updateOne(questionFilter, updateQuestionOptions, { session });
//       await session.commitTransaction();
//     });
//   } catch (error) {
//     const message = 'An error ocurred creating that stage';
//     console.error(message, error);
//     return res.status(500).json(message);
//   } finally {
//     await session.endSession();
//   }

//   return res.status(201).json({ message: 'Question added to stage!' });
// };