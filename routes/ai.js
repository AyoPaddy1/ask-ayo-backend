const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const { AIRewrite } = require('../models');
const { trackEvent } = require('../utils/analytics');
require('dotenv').config();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// POST /api/ai/rewrite - Get AI rewrite for confused users
router.post('/rewrite', async (req, res) => {
  try {
    const {
      client_id,
      term_key,
      term_display,
      original_explanation,
      complexity_level,
      user_context
    } = req.body;

    // Validate required fields
    if (!client_id || !term_key || !original_explanation) {
      return res.status(400).json({
        success: false,
        error: 'client_id, term_key, and original_explanation are required'
      });
    }

    // Create prompt for ChatGPT
    const prompt = `You are Ask AYO, a financial jargon translator that helps people understand financial terms in plain English.

A user is confused by this explanation of "${term_display || term_key}":

"${original_explanation}"

Please rewrite this explanation to be:
- Clearer and easier to understand
- More conversational and engaging
- Include a real-world example or analogy
- Keep it concise (60-120 words)
- Use the Ask AYO tone: confident, accessible, authentic, supportive

${user_context ? `Additional context: ${user_context}` : ''}

Rewrite the explanation now:`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are Ask AYO, a financial education assistant that translates jargon into plain English with a conversational, confident tone.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    const rewritten_explanation = completion.choices[0].message.content.trim();
    const tokens_used = completion.usage.total_tokens;
    
    // Calculate cost (GPT-3.5-turbo pricing: $0.0015/1K input tokens, $0.002/1K output tokens)
    const input_tokens = completion.usage.prompt_tokens;
    const output_tokens = completion.usage.completion_tokens;
    const cost_usd = (input_tokens * 0.0015 / 1000) + (output_tokens * 0.002 / 1000);

    // Save rewrite to database
    const rewrite = await AIRewrite.create({
      client_id,
      term_key,
      original_explanation,
      rewritten_explanation,
      model: 'gpt-3.5-turbo',
      tokens_used,
      cost_usd
    });

    // Track analytics event
    trackEvent('ai_rewrite', {
      term_key,
      complexity_level,
      tokens_used,
      cost_usd
    });

    res.json({
      success: true,
      data: {
        rewrite_id: rewrite.id,
        rewritten_explanation,
        tokens_used,
        cost_usd: parseFloat(cost_usd.toFixed(6))
      }
    });
  } catch (error) {
    console.error('Error generating AI rewrite:', error);
    
    // Handle OpenAI API errors
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        error: 'OpenAI API error: ' + error.response.data.error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to generate AI rewrite'
    });
  }
});

// GET /api/ai/stats - Get AI usage stats
router.get('/stats', async (req, res) => {
  try {
    const { Sequelize } = require('sequelize');
    
    // Get total rewrites, tokens, and costs
    const stats = await AIRewrite.findOne({
      attributes: [
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_rewrites'],
        [Sequelize.fn('SUM', Sequelize.col('tokens_used')), 'total_tokens'],
        [Sequelize.fn('SUM', Sequelize.col('cost_usd')), 'total_cost']
      ]
    });

    // Get rewrites by date (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const rewritesByDate = await AIRewrite.findAll({
      attributes: [
        [Sequelize.fn('DATE', Sequelize.col('created_at')), 'date'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        [Sequelize.fn('SUM', Sequelize.col('tokens_used')), 'tokens'],
        [Sequelize.fn('SUM', Sequelize.col('cost_usd')), 'cost']
      ],
      where: {
        created_at: {
          [Sequelize.Op.gte]: thirtyDaysAgo
        }
      },
      group: [Sequelize.fn('DATE', Sequelize.col('created_at'))],
      order: [[Sequelize.fn('DATE', Sequelize.col('created_at')), 'DESC']]
    });

    res.json({
      success: true,
      data: {
        total_rewrites: parseInt(stats.dataValues.total_rewrites) || 0,
        total_tokens: parseInt(stats.dataValues.total_tokens) || 0,
        total_cost: parseFloat(stats.dataValues.total_cost) || 0,
        rewrites_by_date: rewritesByDate
      }
    });
  } catch (error) {
    console.error('Error getting AI stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get AI stats'
    });
  }
});

module.exports = router;
