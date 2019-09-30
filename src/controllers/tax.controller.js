import { Tax } from '../database/models';
/**
 * Tax controller contains methods which are needed for all tax request
 * Implement the functionality for the methods
 * 
 *  NB: Check the BACKEND CHALLENGE TEMPLATE DOCUMENTATION in the readme of this repository to see our recommended
 *  endpoints, request body/param, and response object for each of these method
 */
class TaxController {
  /**
   * This method get all taxes
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  static async getAllTax(req, res, next) {
    // write code to get all tax from the database here
    try {
      const allTax = await Tax.findAll();
      return res.status(200).json(allTax);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * This method gets a single tax using the tax id
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  static async getSingleTax(req, res, next) {
    // Write code to get a single tax using the tax Id provided in the request param
    const { tax_id } = req.params; // eslint-disable-line
    try {
      const tax = await Tax.findByPk(tax_id);
      if (tax) {
        return res.status(200).json(tax);
      }
      return res.status(404).json({
        error: {
          status: 404,
          message: `Tax with id ${tax_id} does not exist`,  // eslint-disable-line
        },
      });
    } catch (error) {
      return next(error);
    }
  }
}

export default TaxController;
