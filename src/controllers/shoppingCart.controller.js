/**
 * Check each method in the shopping cart controller and add code to implement
 * the functionality or fix any bug.
 * The static methods and their function include:
 * 
 * - generateUniqueCart - To generate a unique cart id
 * - addItemToCart - To add new product to the cart
 * - getCart - method to get list of items in a cart
 * - updateCartItem - Update the quantity of a product in the shopping cart
 * - emptyCart - should be able to clear shopping cart
 * - removeItemFromCart - should delete a product from the shopping cart
 * - createOrder - Create an order
 * - getCustomerOrders - get all orders of a customer
 * - getOrderSummary - get the details of an order
 * - processStripePayment - process stripe payment
 * 
 *  NB: Check the BACKEND CHALLENGE TEMPLATE DOCUMENTATION in the readme of this repository to see our recommended
 *  endpoints, request body/param, and response object for each of these method
 */
import { Order, OrderDetail, Customer, ShoppingCart, Product } from '../database/models';

const uuidv4 = require('uuid/v4');
const jwt = require('jsonwebtoken');
/**
 *
 *
 * @class shoppingCartController
 */
class ShoppingCartController {
  /**
   * Generate a shopping cart_id
   * Generates a new timestamped string(uuid string),
   * and gets the last substring of the generated uuid
   * @static
   * @param {obj} req express request object
   * @param {obj} res express response object
   * @returns {json} returns json response with cart_id
   * @memberof shoppingCartController
   */
  static generateUniqueCart(req, res) {
    // eslint-disable-next-line camelcase
    const cart_id = uuidv4();

    return res.status(200).send({
      cart_id,
    });
  }

  /**
   * adds item to a cart with cart_id
   *
   * @static
   * @param {obj} req express request object
   * @param {obj} res express response object
   * @returns {json} returns json response with cart
   * @memberof ShoppingCartController
   */
  static async addItemToCart(req, res, next) {
    // eslint-disable-next-line camelcase
    const { cart_id, product_id, attributes, quantity } = req.body;
    const accessToken = req.headers.authorization;
    const decodedToken = jwt.decode(accessToken.substring(7)); // remove the Bearer tag
    const customerId = decodedToken.customer_id;

    try {
      let shopping;
      if (customerId) {
        shopping = await ShoppingCart.upsert({
          cart_id: cart_id.substring(10),
          product_id,
          attributes,
          quantity,
        });
      }
      if (shopping) {
        const lastEntry = await ShoppingCart.findOne({
          where: {
            product_id,
          },
          order: [['added_on', 'DESC']],
          attributes: ['item_id', 'cart_id', 'product_id', 'attributes', 'quantity'],
        });
        return res.status(201).json(lastEntry);
      }
      return res.status(400).json('Could not add item to cart.');
    } catch (error) {
      return next(error);
    }
  }

  /**
   * get shopping cart using the cart_id
   *
   * @static
   * @param {obj} req express request object
   * @param {obj} res express response object
   * @returns {json} returns json response with cart
   * @memberof ShoppingCartController
   */
  static async getCart(req, res, next) {
    // implement method to get cart items
    const accessToken = req.headers.authorization;
    const decodedToken = jwt.decode(accessToken.substring(7)); // remove the Bearer tag
    const customerId = decodedToken.customer_id;
    // eslint-disable-next-line camelcase
    const { cart_id } = req.params;
    try {
      let cart;
      if (customerId) {
        cart = await ShoppingCart.findAll({
          where: {
            cart_id,
          },
          attributes: ['item_id', 'cart_id', 'product_id', 'attributes', 'quantity'],
          include: [
            {
              model: Product,
              attributes: ['name', 'price', 'discounted_price', 'image'],
            },
          ],
        });
      }
      if (cart) {
        const items = cart.map(item => {
          const {
            // eslint-disable-next-line camelcase
            item_id,
            quantity,
            attributes,
            // eslint-disable-next-line camelcase
            product_id,
            // eslint-disable-next-line camelcase
            Product: { name, discounted_price, price, image },
          } = item;
          return {
            item_id,
            cart_id,
            name,
            attributes,
            product_id,
            image,
            price,
            discounted_price,
            quantity,
            subtotal: quantity * price,
          };
        });
        return res.status(200).json(items);
      }
      return res.status(404).json('Could not find a cart with that id.');
    } catch (error) {
      return next(error);
    }
  }

  /**
   * update cart item quantity using the item_id in the request param
   *
   * @static
   * @param {obj} req express request object
   * @param {obj} res express response object
   * @returns {json} returns json response with cart
   * @memberof ShoppingCartController
   */
  static async updateCartItem(req, res, next) {
    const { item_id } = req.params // eslint-disable-line
    const { quantity } = req.body;
    const accessToken = req.headers.authorization;
    const decodedToken = jwt.decode(accessToken.substring(7)); // remove the Bearer tag
    const customerId = decodedToken.customer_id;
    try {
      if (customerId) {
        await ShoppingCart.update(
          {
            quantity,
          },
          {
            returning: true,
            where: {
              // eslint-disable-next-line prettier/prettier
              item_id
            },
          }
        );
      }
      const updatedItem = await ShoppingCart.findByPk(item_id);
      return res.status(200).json(updatedItem);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * removes all items in a cart
   *
   * @static
   * @param {obj} req express request object
   * @param {obj} res express response object
   * @returns {json} returns json response with cart
   * @memberof ShoppingCartController
   */
  static async emptyCart(req, res, next) {
    const { cart_id } = req.params // eslint-disable-line
    const accessToken = req.headers.authorization;
    const decodedToken = jwt.decode(accessToken.substring(7)); // remove the Bearer tag
    const customerId = decodedToken.customer_id;
    try {
      let emptyCart;
      if (customerId) {
        emptyCart = await ShoppingCart.destroy({
          where: {
            // eslint-disable-next-line prettier/prettier
            cart_id
          },
        });
      }
      if (emptyCart) {
        return res.status(200).json([]);
      }
      return res.status(400).json('Unable to empty cart');
    } catch (error) {
      return next(error);
    }
  }

  /**
   * remove single item from cart
   * cart id is obtained from current session
   *
   * @static
   * @param {obj} req express request object
   * @param {obj} res express response object
   * @returns {json} returns json response with message
   * @memberof ShoppingCartController
   */
  static async removeItemFromCart(req, res, next) {
    const { item_id } = req.params // eslint-disable-line
    const accessToken = req.headers.authorization;
    const decodedToken = jwt.decode(accessToken.substring(7)); // remove the Bearer tag
    const customerId = decodedToken.customer_id;
    try {
      let removedItem;
      if (customerId) {
        removedItem = await ShoppingCart.destroy({
          where: {
            // eslint-disable-next-line prettier/prettier
            item_id
          },
        });
      }
      if (removedItem) {
        return res.status(200).json({ message: 'successfully removed the item' });
      }
      return res.status(400).json('Unable to remove the item');
    } catch (error) {
      return next(error);
    }
  }

  /**
   * create an order from a cart
   *
   * @static
   * @param {obj} req express request object
   * @param {obj} res express response object
   * @returns {json} returns json response with created order
   * @memberof ShoppingCartController
   */
  static async createOrder(req, res, next) {
    // eslint-disable-next-line camelcase
    const { cart_id, shipping_id, tax_id } = req.body;
    const accessToken = req.headers.authorization;
    const decodedToken = jwt.decode(accessToken.substring(7)); // remove the Bearer tag
    const customerId = decodedToken.customer_id;

    try {
      const order = await Order.upsert({
        customer_id: customerId,
        cart_id,
        shipping_id,
        tax_id,
      });
      if (order) {
        const id = await Order.count();
        return res.status(201).json({ order_id: id });
      }
      return res.status(400).json('Could not create the order.');
    } catch (error) {
      return next(error);
    }
  }

  /**
   *
   *
   * @static
   * @param {obj} req express request object
   * @param {obj} res express response object
   * @returns {json} returns json response with customer's orders
   * @memberof ShoppingCartController
   */
  static async getCustomerOrders(req, res, next) {
    const { customer_id } = req;  // eslint-disable-line
    const accessToken = req.headers.authorization;
    const decodedToken = jwt.decode(accessToken.substring(7)); // remove the Bearer tag
    const customerId = decodedToken.customer_id;
    try {
      const orders = await Order.findAll({
        where: {
          customer_id: customerId,
        },
        include: [
          {
            model: Customer,
            as: 'name',
            attributes: ['name'],
          },
        ],
        raw: true,
        attributes: ['order_id', 'total_amount', 'created_on', 'shipped_on'],
      });
      if (orders) {
        return res.status(200).json(orders);
      }
      return res.status(400).json('You have not yet placed an order. ');
    } catch (error) {
      return next(error);
    }
  }

  /**
   *
   *
   * @static
   * @param {obj} req express request object
   * @param {obj} res express response object
   * @returns {json} returns json response with order summary
   * @memberof ShoppingCartController
   */
  static async getOrderSummary(req, res, next) {
    const { order_id } = req.params;  // eslint-disable-line
    try {
      const order = await OrderDetail.findByPk(order_id);
      if (order) {
        return res.status(200).json({
          order_id,
          order_items: order,
        });
      }
      return res.status(404).json('The order does not exist');
    } catch (error) {
      return next(error);
    }
  }

    /**
   *
   *
   * @static
   * @param {obj} req express request object
   * @param {obj} res express response object
   * @returns {json} returns json response with short details of order
   * @memberof ShoppingCartController
   */
  static async getOrderShortDetail(req, res, next) {
    // eslint-disable-next-line camelcase
    const { order_id } = req.params;
    try {
      const orders = await Order.findOne({
        where: {
          order_id,
        },
        include: [
          {
            model: Customer,
            attributes: ['name'],
          },
        ],
        raw: true,
        attributes: ['order_id', 'total_amount', 'created_on', 'shipped_on', 'status'],
      });
      if (orders) {
        return res.status(200).json(orders);
      }
      return res.status(400).json('You have not yet placed an order. ');
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @static
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  static async processStripePayment(req, res, next) {
    const { email, stripeToken, order_id } = req.body; // eslint-disable-line
    const { customer_id } = req;  // eslint-disable-line
    try {
      // implement code to process payment and send order confirmation email here
    } catch (error) {
      return next(error);
    }
  }
}

export default ShoppingCartController;
