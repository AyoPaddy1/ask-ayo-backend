const express = require('express');
const router = express.Router();
const { User, TermLookup, Feedback, MissingTerm } = require('../models');
const { trackEvent } = require('../utils/analytics');

// POST /api/feedback/lookup - Track term lookup
router.post('/lookup', async (req, res) => {
  try {
    const {
      client_id,
      term_key,
      term_display,
      complexity_level,
      page_url,
      page_context,
      found
    } = req.body;

    // Validate required fields
    if (!client_id || !term_key) {
      return res.status(400).json({
        success: false,
        error: 'client_id and term_key are required'
      });
    }

    // Update or create user
    const [user, created] = await User.findOrCreate({
      where: { client_id },
      defaults: {
        client_id,
        first_seen_at: new Date(),
        last_seen_at: new Date(),
        total_lookups: 1
      }
    });

    if (!created) {
      await user.update({
        last_seen_at: new Date(),
        total_lookups: user.total_lookups + 1
      });
    }

    // Create lookup record
    const lookup = await TermLookup.create({
      client_id,
      term_key,
      term_display: term_display || term_key,
      complexity_level: complexity_level || 'simple',
      page_url,
      page_context,
      found: found !== false,
      lookup_timestamp: new Date()
    });

    // If term not found, track as missing
    if (found === false) {
      await MissingTerm.findOrCreate({
        where: { missing_text: term_key },
        defaults: {
          client_id,
          missing_text: term_key,
          page_url,
          page_context,
          lookup_count: 1,
          first_seen_at: new Date(),
          last_seen_at: new Date()
        }
      }).then(async ([missingTerm, created]) => {
        if (!created) {
          await missingTerm.update({
            lookup_count: missingTerm.lookup_count + 1,
            last_seen_at: new Date()
          });
        }
      });
    }

    // Track analytics event
    trackEvent('term_lookup', {
      term_key,
      complexity_level,
      found
    });

    res.json({
      success: true,
      data: {
        lookup_id: lookup.id,
        total_lookups: user.total_lookups
      }
    });
  } catch (error) {
    console.error('Error tracking lookup:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track lookup'
    });
  }
});

// POST /api/feedback/submit - Submit user feedback
router.post('/submit', async (req, res) => {
  try {
    const {
      client_id,
      term_key,
      feedback_type,
      complexity_level,
      comment
    } = req.body;

    // Validate required fields
    if (!client_id || !term_key || !feedback_type) {
      return res.status(400).json({
        success: false,
        error: 'client_id, term_key, and feedback_type are required'
      });
    }

    // Validate feedback_type
    const validTypes = ['thumbs_up', 'thumbs_down', 'confused'];
    if (!validTypes.includes(feedback_type)) {
      return res.status(400).json({
        success: false,
        error: 'feedback_type must be one of: ' + validTypes.join(', ')
      });
    }

    // Create feedback record
    const feedback = await Feedback.create({
      client_id,
      term_key,
      feedback_type,
      complexity_level,
      comment
    });

    // Track analytics event
    trackEvent('feedback_submitted', {
      term_key,
      feedback_type,
      complexity_level
    });

    res.json({
      success: true,
      data: {
        feedback_id: feedback.id
      }
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit feedback'
    });
  }
});

// GET /api/feedback/stats - Get user stats
router.get('/stats/:client_id', async (req, res) => {
  try {
    const { client_id } = req.params;

    // Get user
    const user = await User.findOne({ where: { client_id } });
    if (!user) {
      return res.json({
        success: true,
        data: {
          total_lookups: 0,
          unique_terms: 0,
          days_active: 0
        }
      });
    }

    // Get unique terms count
    const uniqueTerms = await TermLookup.count({
      where: { client_id },
      distinct: true,
      col: 'term_key'
    });

    // Calculate days active
    const firstLookup = await TermLookup.findOne({
      where: { client_id },
      order: [['lookup_timestamp', 'ASC']]
    });

    const daysActive = firstLookup
      ? Math.ceil((new Date() - new Date(firstLookup.lookup_timestamp)) / (1000 * 60 * 60 * 24))
      : 0;

    res.json({
      success: true,
      data: {
        total_lookups: user.total_lookups,
        unique_terms: uniqueTerms,
        days_active: daysActive,
        first_seen: user.first_seen_at,
        last_seen: user.last_seen_at
      }
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stats'
    });
  }
});

module.exports = router;
