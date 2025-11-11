const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// Initialize Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME || 'ask_ayo',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// User Model
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  client_id: {
    type: DataTypes.STRING(255),
    unique: true,
    allowNull: false
  },
  first_seen_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW
  },
  last_seen_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW
  },
  total_lookups: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true
});

// Term Lookup Model
const TermLookup = sequelize.define('TermLookup', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  client_id: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  term_key: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  term_display: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  complexity_level: {
    type: DataTypes.STRING(50),
    defaultValue: 'simple'
  },
  page_url: {
    type: DataTypes.TEXT
  },
  page_context: {
    type: DataTypes.TEXT
  },
  found: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lookup_timestamp: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW
  }
}, {
  tableName: 'term_lookups',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false
});

// Feedback Model
const Feedback = sequelize.define('Feedback', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  client_id: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  term_key: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  feedback_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  complexity_level: {
    type: DataTypes.STRING(50)
  },
  comment: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'feedback',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false
});

// AI Rewrite Model
const AIRewrite = sequelize.define('AIRewrite', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  client_id: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  term_key: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  original_explanation: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  rewritten_explanation: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  model: {
    type: DataTypes.STRING(100),
    defaultValue: 'gpt-3.5-turbo'
  },
  tokens_used: {
    type: DataTypes.INTEGER
  },
  cost_usd: {
    type: DataTypes.DECIMAL(10, 6)
  }
}, {
  tableName: 'ai_rewrites',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false
});

// Missing Term Model
const MissingTerm = sequelize.define('MissingTerm', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  client_id: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  missing_text: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  page_url: {
    type: DataTypes.TEXT
  },
  page_context: {
    type: DataTypes.TEXT
  },
  lookup_count: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  first_seen_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW
  },
  last_seen_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW
  }
}, {
  tableName: 'missing_terms',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false
});

// Analytics Daily Model
const AnalyticsDaily = sequelize.define('AnalyticsDaily', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  date: {
    type: DataTypes.DATEONLY,
    unique: true,
    allowNull: false
  },
  total_lookups: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  unique_users: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  total_feedback: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  thumbs_up: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  thumbs_down: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  confused_clicks: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  ai_rewrites: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  top_terms: {
    type: DataTypes.JSONB
  }
}, {
  tableName: 'analytics_daily',
  timestamps: true,
  underscored: true
});

module.exports = {
  sequelize,
  User,
  TermLookup,
  Feedback,
  AIRewrite,
  MissingTerm,
  AnalyticsDaily
};
