/**
 * Customer controller handles all requests that has to do with customer
 * Some methods needs to be implemented from scratch while others may contain one or two bugs
 * 
 * - create - allow customers to create a new account
 * - login - allow customers to login to their account
 * - getCustomerProfile - allow customers to view their profile info
 * - updateCustomerProfile - allow customers to update their profile info like name, email, password, day_phone, eve_phone and mob_phone
 * - updateCustomerAddress - allow customers to update their address info
 * - updateCreditCard - allow customers to update their credit card number
 * 
 *  NB: Check the BACKEND CHALLENGE TEMPLATE DOCUMENTATION in the readme of this repository to see our recommended
 *  endpoints, request body/param, and response object for each of these method
 */
import { Customer, Sequelize } from '../database/models';

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const { Op } = Sequelize;
/**
 *
 *
 * @class CustomerController
 */
class CustomerController {
  /**
   * create a customer record
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status, customer data and access token
   * @memberof CustomerController
   */
  static async create(req, res, next) {
    // Implement the function to create the customer account
    const { name, email, password } = req.body;

    try {
      const passwordHash = bcrypt.hashSync(password, 8);
      const newCustomer = await Customer.findOrCreate({
        where: {
          email,
        },
        //attributes: { exclude: ['password'] },
        defaults: {
          name,
          password,
        },
      });
      // eslint-disable-next-line no-underscore-dangle
      if (newCustomer && !newCustomer[0]._options.isNewRecord) {
        // ensure the email has not been registered before
        return res.status(409).json({
          error: {
            status: 409,
            message: `User with email ${email} already exist`,
          },
        });
      }
      const {
        customer_id, // eslint-disable-line
        address_1, // eslint-disable-line
        address_2, // eslint-disable-line
        city,
        region,
        postal_code, // eslint-disable-line
        shipping_region_id, // eslint-disable-line
        credit_card, // eslint-disable-line
        day_phone, // eslint-disable-line
        eve_phone, // eslint-disable-line
        mob_phone, // eslint-disable-line
      // eslint-disable-next-line no-underscore-dangle
      } = newCustomer[0]._previousDataValues;
      const accessToken = `Bearer ${await jwt.sign({ customer_id }, process.env.SECRET_KEY, {
        expiresIn: '24h',
      })}`;
      return res.status(201).send({
        customer: {
          customer_id,
          name,
          email,
          address_1: address_1 || null, // eslint-disable-line
          address_2: address_2 || null, // eslint-disable-line
          city: city || null,
          region: region || null,
          postal_code: postal_code || null, // eslint-disable-line
          shipping_region_id: shipping_region_id || null, // eslint-disable-line
          credit_card: credit_card || null, // eslint-disable-line
          day_phone: day_phone || null, // eslint-disable-line
          eve_phone: eve_phone || null, // eslint-disable-line
          mob_phone: mob_phone || null, // eslint-disable-line
        },
        accessToken,
        expiresIn: '24h',
      });
    } catch (error) {
      return next(email);
    }
  }

  /**
   * log in a customer
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status, and access token
   * @memberof CustomerController
   */
  static async login(req, res, next) {
    // implement function to login to user account
    const { email, password } = req.body;

    try {
      const customer = await Customer.findOne({
        where: {
          email,
        },
      });
      if (customer) {
        if (!bcrypt.compareSync(password, customer.password)) {
          return res.status(401).json({ message: 'Incorrect password' });
        }
        const accessToken = `Bearer ${await jwt.sign(
          { customer_id: customer.customer_id },
          process.env.SECRET_KEY,
          { expiresIn: '24h' }
        )}`;
        const {
          customer_id, // eslint-disable-line
          name,
          email, // eslint-disable-line
          address_1, // eslint-disable-line
          address_2, // eslint-disable-line
          city,
          region,
          postal_code, // eslint-disable-line
          shipping_region_id, // eslint-disable-line
          credit_card, // eslint-disable-line
          day_phone, // eslint-disable-line
          eve_phone, // eslint-disable-line
          mob_phone, // eslint-disable-line
        } = customer;
        return res.status(200).json({
          customer: {
            customer_id,
            name,
            email,
            address_1,
            address_2,
            city,
            region,
            postal_code,
            shipping_region_id,
            credit_card,
            day_phone,
            eve_phone,
            mob_phone,
          },
          accessToken,
          expiresIn: '24h',
        });
        
      }
      return res.status(404).json({
        error: {
          status: 404,
          message: `User does not exist`,
        },
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * log in a customer
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status, and access token
   * @memberof CustomerController
   */
  static async facebookLogin(req, res, next) {
    // implement function to login to user account
    const { accessToken } = req.body;
    try {
      const customer = await Customer.findOne({
        where: {
          accessToken,
        },
      });
      if (customer) {
        return res.status(200).json({
          customer,
          accessToken: null,
          expiresIn: null,
        });
      }
      return res.status(404).json({
        error: {
          status: 404,
          message: `User does not exist`,
        },
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * get customer profile data
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status customer profile data
   * @memberof CustomerController
   */
  static async getCustomerProfile(req, res, next) {
    const accessToken = req.headers.authorization;
    const decodedToken = jwt.decode(accessToken.substring(7)); // remove the Bearer tag
    const customerId = decodedToken.customer_id;

    try {
      const customer = await Customer.findOne({
        where: {
          customer_id: customerId,
        },
        attributes: { exclude: ['password'] },
      });
      if (customer) {
        return res.status(200).json(customer);
      }
      return res.status(404).json('The user does not exist');
    } catch (error) {
      return next(error);
    }
  }

  /**
   * update customer profile data such as name, email, password, day_phone, eve_phone and mob_phone
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status customer profile data
   * @memberof CustomerController
   */
  static async updateCustomerProfile(req, res, next) {
    // Implement function to update customer profile like name, day_phone, eve_phone and mob_phone

    // eslint-disable-next-line camelcase
    const { email, name, day_phone, eve_phone, mob_phone } = req.body;
    const accessToken = req.headers.authorization;
    const decodedToken = jwt.decode(accessToken.substring(7)); // remove the Bearer tag
    const customerId = decodedToken.customer_id;
    try {
      const existingEmail = await Customer.findOne({
        where: {
          email,
          customer_id: {
            // compare array of [Op.like] queries
            [Op.not]: customerId,
          },
        },
      });
      if (!existingEmail) {
        await Customer.update(
          {
            email,
            name,
            day_phone,
            eve_phone,
            mob_phone,
          },
          {
            returning: true,
            where: {
              // eslint-disable-next-line prettier/prettier
            customer_id: customerId,
            },
          }
        );
        const customer = await Customer.findOne({
          where: {
            customer_id: customerId,
          },
          attributes: { exclude: ['password'] },
        });
        return res.status(200).json(customer);
      }
      return res.status(403).json({ message: 'Email already taken' });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * update customer profile data such as address_1, address_2, city, region, postal_code, country and shipping_region_id
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status customer profile data
   * @memberof CustomerController
   */
  static async updateCustomerAddress(req, res, next) {
    // write code to update customer address info such as address_1, address_2, city, region, postal_code, country
    // and shipping_region_id
    // eslint-disable-next-line camelcase
    const {
      address_1, // eslint-disable-line
      address_2, // eslint-disable-line
      city,
      region,
      postal_code, // eslint-disable-line
      country,
      shipping_region_id, // eslint-disable-line
    } = req.body;
    const accessToken = req.headers.authorization;
    const decodedToken = jwt.decode(accessToken.substring(7)); // remove the Bearer tag
    const customerId = decodedToken.customer_id;
    try {
      await Customer.update(
        {
          address_1,
          address_2,
          city,
          region,
          postal_code,
          country,
          shipping_region_id,
        },
        {
          returning: true,
          where: {
            // eslint-disable-next-line prettier/prettier
          customer_id: customerId,
          },
        }
      );
      const customer = await Customer.findOne({
        where: {
          customer_id: customerId,
        },
        attributes: { exclude: ['password'] },
      });
      return res.status(200).json(customer);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * update customer credit card
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status customer profile data
   * @memberof CustomerController
   */
  static async updateCreditCard(req, res, next) {
    // write code to update customer credit card number
    // eslint-disable-next-line camelcase
    const { credit_card } = req.body;
    const accessToken = req.headers.authorization;
    const decodedToken = jwt.decode(accessToken.substring(7)); // remove the Bearer tag
    const customerId = decodedToken.customer_id;
    try {
      await Customer.update(
        {
          credit_card,
        },
        {
          returning: true,
          where: {
            // eslint-disable-next-line prettier/prettier
          customer_id: customerId,
          },
        }
      );
      const customer = await Customer.findOne({
        where: {
          customer_id: customerId,
        },
        attributes: { exclude: ['password'] },
      });
      return res.status(200).json(customer);
    } catch (error) {
      return next(error);
    }
  }
}

export default CustomerController;
