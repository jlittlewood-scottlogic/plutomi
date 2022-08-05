import { Request, Response } from 'express';
import { Opening } from '../../entities/Opening';
import { Org } from '../../entities/Org';
import { DB } from '../../models';
import * as CreateError from '../../utils/createError';

export const deleteOpening = async (req: Request, res: Response) => {
  const { openingId } = req.params;
  const { user } = req;

  try {
    await Opening.findByIdAndDelete(openingId);

    try {
      await Org.updateOne(
        {
          _id: user.orgId,
        },
        {
          $inc: {
            totalOpenings: -1,
          },
        },
      );
      return res.status(200).json({ message: 'Opening deleted!' });
    } catch (error) {
      return res
        .status(200)
        .json({ message: 'Opening deleted, but unable to decrement opening count in org' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting opening' });
  }
};
