'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const { Op } = require('sequelize');
const {
  models: { User, Expense },
} = require('./models/models');

function createServer() {
  const app = express();

  app.use(bodyParser.json());

  app.post('/users', async (req, res) => {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Missing name' });
    }

    try {
      const newUser = await User.create({ name });

      res.status(201).json(newUser);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/users', async (req, res) => {
    try {
      const users = await User.findAll();

      res.json(users);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/users/:id', async (req, res) => {
    try {
      const user = await User.findByPk(req.params.id);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.patch('/users/:id', async (req, res) => {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Missing name' });
    }

    try {
      const user = await User.findByPk(req.params.id);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      user.name = name;
      await user.save();
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.delete('/users/:id', async (req, res) => {
    try {
      const deletedCount = await User.destroy({ where: { id: req.params.id } });

      if (deletedCount === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/expenses', async (req, res) => {
    try {
      const { userId, from, to, categories } = req.query;
      const where = {};

      if (userId) {
        where.userId = userId;
      }

      if (from || to) {
        where.spentAt = {};

        if (from) {
          where.spentAt[Op.gte] = new Date(from);
        }

        if (to) {
          where.spentAt[Op.lte] = new Date(to);
        }
      }

      if (categories) {
        const cats = Array.isArray(categories)
          ? categories
          : categories.split(',');

        where.category =
          cats.length === 1 ? cats[0] : { [require('sequelize').Op.in]: cats };
      }

      const expenses = await Expense.findAll({ where });

      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/expenses', async (req, res) => {
    const { userId, spentAt, title, amount, category, note } = req.body;

    if (
      typeof userId !== 'number' ||
      typeof spentAt !== 'string' ||
      typeof title !== 'string' ||
      title.trim() === '' ||
      typeof amount !== 'number'
    ) {
      return res
        .status(400)
        .json({ message: 'Missing or invalid required fields' });
    }

    try {
      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(400).json({ message: 'User not found' });
      }

      const expenseData = {
        userId,
        spentAt: new Date(spentAt),
        title,
        amount,
        category: category || null,
        note: note || null,
      };

      const newExpense = await Expense.create(expenseData);

      res.status(201).json(newExpense);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/expenses/:id', async (req, res) => {
    try {
      const expense = await Expense.findByPk(req.params.id);

      if (!expense) {
        return res.status(404).json({ message: 'Expense not found' });
      }
      res.json(expense);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.patch('/expenses/:id', async (req, res) => {
    try {
      const expense = await Expense.findByPk(req.params.id);

      if (!expense) {
        return res.status(404).json({ message: 'Expense not found' });
      }

      const fields = ['spentAt', 'title', 'amount', 'category', 'note'];

      fields.forEach((field) => {
        if (req.body[field] !== undefined) {
          expense[field] = req.body[field];
        }
      });

      await expense.save();
      res.json(expense);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.delete('/expenses/:id', async (req, res) => {
    try {
      const deletedCount = await Expense.destroy({
        where: { id: req.params.id },
      });

      if (deletedCount === 0) {
        return res.status(404).json({ message: 'Expense not found' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  return app;
}

module.exports = { createServer };
