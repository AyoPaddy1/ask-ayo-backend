const express = require('express');
const router = express.Router();
const { Sequelize } = require('sequelize');
const { TermLookup, Feedback, User, MissingTerm, AnalyticsDaily } = require('../models');

// GET /api/analytics/overview - Get overview stats
router.get('/overview', async (req, res) => {
  try {
    // Total users
    const totalUsers = await User.count();

    // Total lookups
    const totalLookups = await TermLookup.count();

    // Total feedback
    const totalFeedback = await Feedback.count();

    // Active users (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const activeUsers = await User.count({
      where: {
        last_seen_at: {
          [Sequelize.Op.gte]: sevenDaysAgo
        }
      }
    });

    // Most popular terms (top 10)
    const popularTerms = await TermLookup.findAll({
      attributes: [
        'term_key',
        'term_display',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'lookup_count'],
        [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('client_id'))), 'unique_users']
      ],
      where: { found: true },
      group: ['term_key', 'term_display'],
      order: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'DESC']],
      limit: 10,
      raw: true
    });

    // Most confusing terms (top 10)
    const confusingTerms = await Feedback.findAll({
      attributes: [
        'term_key',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'confused_count']
      ],
      where: { feedback_type: 'confused' },
      group: ['term_key'],
      order: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'DESC']],
      limit: 10,
      raw: true
    });

    // Missing terms (top 10)
    const missingTerms = await MissingTerm.findAll({
      attributes: ['missing_text', 'lookup_count', 'last_seen_at'],
      order: [['lookup_count', 'DESC']],
      limit: 10
    });

    res.json({
      success: true,
      data: {
        overview: {
          total_users: totalUsers,
          active_users: activeUsers,
          total_lookups: totalLookups,
          total_feedback: totalFeedback
        },
        popular_terms: popularTerms,
        confusing_terms: confusingTerms,
        missing_terms: missingTerms
      }
    });
  } catch (error) {
    console.error('Error getting analytics overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics overview'
    });
  }
});

// GET /api/analytics/daily - Get daily analytics
router.get('/daily', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const dailyStats = await AnalyticsDaily.findAll({
      where: {
        date: {
          [Sequelize.Op.gte]: startDate
        }
      },
      order: [['date', 'DESC']]
    });

    res.json({
      success: true,
      data: dailyStats
    });
  } catch (error) {
    console.error('Error getting daily analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get daily analytics'
    });
  }
});

// GET /api/analytics/term/:term_key - Get analytics for specific term
router.get('/term/:term_key', async (req, res) => {
  try {
    const { term_key } = req.params;

    // Total lookups
    const totalLookups = await TermLookup.count({
      where: { term_key, found: true }
    });

    // Unique users
    const uniqueUsers = await TermLookup.count({
      where: { term_key, found: true },
      distinct: true,
      col: 'client_id'
    });

    // Complexity level breakdown
    const complexityBreakdown = await TermLookup.findAll({
      attributes: [
        'complexity_level',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      where: { term_key, found: true },
      group: ['complexity_level'],
      raw: true
    });

    // Feedback breakdown
    const feedbackBreakdown = await Feedback.findAll({
      attributes: [
        'feedback_type',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      where: { term_key },
      group: ['feedback_type'],
      raw: true
    });

    // Recent lookups (last 10)
    const recentLookups = await TermLookup.findAll({
      where: { term_key, found: true },
      order: [['lookup_timestamp', 'DESC']],
      limit: 10,
      attributes: ['client_id', 'complexity_level', 'page_url', 'lookup_timestamp']
    });

    res.json({
      success: true,
      data: {
        term_key,
        total_lookups: totalLookups,
        unique_users: uniqueUsers,
        complexity_breakdown: complexityBreakdown,
        feedback_breakdown: feedbackBreakdown,
        recent_lookups: recentLookups
      }
    });
  } catch (error) {
    console.error('Error getting term analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get term analytics'
    });
  }
});

// GET /api/analytics/user-engagement - Get user engagement metrics
router.get('/user-engagement', async (req, res) => {
  try {
    // Average lookups per user
    const avgLookupsPerUser = await User.findOne({
      attributes: [
        [Sequelize.fn('AVG', Sequelize.col('total_lookups')), 'avg_lookups']
      ],
      raw: true
    });

    // User distribution by lookup count
    const userDistribution = await User.findAll({
      attributes: [
        [Sequelize.literal('CASE WHEN total_lookups <= 5 THEN \'1-5\' WHEN total_lookups <= 10 THEN \'6-10\' WHEN total_lookups <= 20 THEN \'11-20\' WHEN total_lookups <= 50 THEN \'21-50\' ELSE \'50+\' END'), 'bucket'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'user_count']
      ],
      group: [Sequelize.literal('CASE WHEN total_lookups <= 5 THEN \'1-5\' WHEN total_lookups <= 10 THEN \'6-10\' WHEN total_lookups <= 20 THEN \'11-20\' WHEN total_lookups <= 50 THEN \'21-50\' ELSE \'50+\' END')],
      raw: true
    });

    // Retention (users active in last 7 days vs last 30 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeLastWeek = await User.count({
      where: { last_seen_at: { [Sequelize.Op.gte]: sevenDaysAgo } }
    });

    const activeLastMonth = await User.count({
      where: { last_seen_at: { [Sequelize.Op.gte]: thirtyDaysAgo } }
    });

    res.json({
      success: true,
      data: {
        avg_lookups_per_user: parseFloat(avgLookupsPerUser.avg_lookups || 0).toFixed(2),
        user_distribution: userDistribution,
        retention: {
          active_last_week: activeLastWeek,
          active_last_month: activeLastMonth,
          retention_rate: activeLastMonth > 0 ? ((activeLastWeek / activeLastMonth) * 100).toFixed(2) + '%' : '0%'
        }
      }
    });
  } catch (error) {
    console.error('Error getting user engagement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user engagement metrics'
    });
  }
});

module.exports = router;
