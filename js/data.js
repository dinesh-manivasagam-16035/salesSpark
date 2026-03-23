/**
 * Sales Spark — Seed Data & Constants
 * All data is defined here so it can be easily swapped with backend API calls.
 * Fiscal year: April 1 – March 31  (Q1=Apr–Jun, Q2=Jul–Sep, Q3=Oct–Dec, Q4=Jan–Mar)
 */

// ─── Fiscal Calendar ────────────────────────────────────────────────────────
const FISCAL_QUARTERS = {
  Q1: { months: [3, 4, 5],   label: 'Q1 (Apr–Jun)',  start: [3, 1],  end: [5, 30] },
  Q2: { months: [6, 7, 8],   label: 'Q2 (Jul–Sep)',  start: [6, 1],  end: [8, 30] },
  Q3: { months: [9, 10, 11], label: 'Q3 (Oct–Dec)',  start: [9, 1],  end: [11, 31] },
  Q4: { months: [0, 1, 2],   label: 'Q4 (Jan–Mar)',  start: [0, 1],  end: [2, 31] },
};

function getCurrentFiscalQuarter() {
  const m = new Date().getMonth(); // 0-indexed
  if (m >= 3 && m <= 5)  return 'Q1';
  if (m >= 6 && m <= 8)  return 'Q2';
  if (m >= 9 && m <= 11) return 'Q3';
  return 'Q4';
}

function getQuarterEndDate(quarter, year) {
  const map = {
    Q1: new Date(year, 5, 30),
    Q2: new Date(year, 8, 30),
    Q3: new Date(year, 11, 31),
    Q4: new Date(year + 1, 2, 31),
  };
  return map[quarter];
}

function countWorkingDaysLeft(endDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let count = 0;
  const cur = new Date(today);
  while (cur <= endDate) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

// ─── BU Groups & Services ────────────────────────────────────────────────────
const BU_SERVICE_MAP = {
  'BI & Analytics': [
    'Creator', 'QENGINE Analytics', 'Analytics On Premise', 'Flow', 'DataPrep', 'Apptics'
  ],
  'HelpDesk & ITSM': [
    'Desk', 'HelpDesk'
  ],
  'HR Suite': [
    'HR-Recruit', 'People', 'Expense', 'Payroll', 'Shifts', 'PeoplePlus', 'Workerly'
  ],
  'Workplace': [
    'Workplace', 'Mail', 'Docs', 'Connect', 'Vault', 'Wiki', 'Sign',
    'Cliq', 'WorkDrive', 'Show', 'Sheet', 'Writer', 'Remotely',
    'Team Inbox', 'Zeptomail', 'Learn', 'Notebook', 'CommunitySpaces'
  ],
  'Projects & PM': [
    'Projects', 'Sprints', 'BugTracker', 'Projects Plus'
  ],
  'Automation': [
    'Qntrl'
  ],
  'Marketing': [
    'Campaigns', 'Marketing Automation', 'Marketing Plus', 'Social',
    'Lead Chain', 'SalesIQ', 'Forms', 'Landing Pages', 'Survey', 'Sites'
  ],
  'Finance': [
    'Books', 'Inventory', 'Billing/Subscriptions', 'Finance Plus',
    'Checkout', 'Backstage', 'PageSense'
  ],
  'Communications & Support': [
    'Assist', 'Meeting', 'Lens', 'Webinar',
    'Zoho Voice (ANZ)', 'Zoho Voice (APAC)', 'Zoho Voice (IND)', 'Zoho Voice (MEA)',
    'Zoho Bookings (ANZ)', 'Zoho Bookings (APAC)', 'Zoho Bookings (IND)', 'Zoho Bookings (MEA)'
  ],
  'Field Services': [
    'FSM - Field Service Management'
  ],
  'Developer Platform': [
    'Zoho Catalyst'
  ]
};

// ─── Regions & States ────────────────────────────────────────────────────────
const REGION_STATE_MAP = {
  'India North': {
    country: 'India',
    states: ['Delhi', 'Haryana', 'Uttar Pradesh', 'Rajasthan', 'Punjab', 'Himachal Pradesh', 'Uttarakhand', 'Jammu & Kashmir']
  },
  'India South': {
    country: 'India',
    states: ['Karnataka', 'Tamil Nadu', 'Kerala', 'Andhra Pradesh', 'Telangana', 'Puducherry']
  },
  'India East': {
    country: 'India',
    states: ['West Bengal', 'Odisha', 'Jharkhand', 'Bihar', 'Assam', 'Chhattisgarh']
  },
  'India West': {
    country: 'India',
    states: ['Maharashtra', 'Gujarat', 'Goa', 'Madhya Pradesh']
  },
  'ANZ': {
    country: 'Australia / New Zealand',
    states: ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia', 'Tasmania', 'Auckland', 'Wellington', 'Christchurch']
  },
  'APAC': {
    country: 'Asia Pacific',
    states: ['Singapore', 'Malaysia', 'Indonesia', 'Philippines', 'Thailand', 'Vietnam', 'Japan', 'South Korea', 'Hong Kong', 'Taiwan']
  },
  'MEA': {
    country: 'Middle East & Africa',
    states: ['UAE', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain', 'Oman', 'Egypt', 'South Africa', 'Kenya', 'Nigeria', 'Jordan']
  },
  'Americas': {
    country: 'Americas',
    states: ['California', 'New York', 'Texas', 'Florida', 'Illinois', 'Washington', 'Toronto', 'Vancouver', 'Mexico City']
  },
  'Europe': {
    country: 'Europe',
    states: ['United Kingdom', 'Germany', 'France', 'Netherlands', 'Spain', 'Italy', 'Sweden', 'Norway', 'Denmark', 'Belgium']
  }
};

// ─── Org Hierarchy ───────────────────────────────────────────────────────────
// targets & achieved are in USD for each quarter
const ORG_HIERARCHY = [
  {
    id: 'dir1',
    name: 'Peter Balaji',
    role: 'Director of Sales',
    avatar: 'PB',
    region: 'India North',
    bu: 'BI & Analytics',
    email: 'peter.balaji@salesspark.io',
    joined: '2019-01-15',
    targets:  { Q1: 8200000, Q2: 9000000, Q3: 9500000, Q4: 10000000 },
    achieved: { Q1: 7900000, Q2: 8700000, Q3: 9100000, Q4: 4200000 },
    renewalRate: 0.88,
    churn: 0.07,
    reports: [
      {
        id: 'mgr1',
        name: 'Jinil K Sreejayan',
        role: 'Assistant Director',
        avatar: 'JK',
        region: 'India North',
        bu: 'BI & Analytics',
        email: 'jinil.k@salesspark.io',
        joined: '2020-06-01',
        targets:  { Q1: 2400000, Q2: 2600000, Q3: 2800000, Q4: 3000000 },
        achieved: { Q1: 2300000, Q2: 2500000, Q3: 2650000, Q4: 1100000 },
        renewalRate: 0.90,
        churn: 0.06,
        reports: [
          {
            id: 'rep1',
            name: 'Arjun Sharma',
            role: 'Senior Sales Rep',
            avatar: 'AS',
            region: 'India North',
            bu: 'BI & Analytics',
            email: 'arjun.s@salesspark.io',
            joined: '2021-03-10',
            targets:  { Q1: 800000, Q2: 870000, Q3: 930000, Q4: 1000000 },
            achieved: { Q1: 780000, Q2: 850000, Q3: 890000, Q4: 380000 },
            renewalRate: 0.91,
            churn: 0.05,
            reports: []
          },
          {
            id: 'rep2',
            name: 'Priya Nair',
            role: 'Sales Rep',
            avatar: 'PN',
            region: 'India North',
            bu: 'HR Suite',
            email: 'priya.n@salesspark.io',
            joined: '2022-01-20',
            targets:  { Q1: 700000, Q2: 780000, Q3: 850000, Q4: 950000 },
            achieved: { Q1: 720000, Q2: 800000, Q3: 860000, Q4: 390000 },
            renewalRate: 0.89,
            churn: 0.07,
            reports: []
          },
          {
            id: 'rep3',
            name: 'Ravi Kumar',
            role: 'Sales Rep',
            avatar: 'RK',
            region: 'India North',
            bu: 'Workplace',
            email: 'ravi.k@salesspark.io',
            joined: '2021-09-05',
            targets:  { Q1: 900000, Q2: 950000, Q3: 1020000, Q4: 1050000 },
            achieved: { Q1: 800000, Q2: 850000, Q3: 900000, Q4: 330000 },
            renewalRate: 0.85,
            churn: 0.09,
            reports: []
          }
        ]
      },
      {
        id: 'mgr2',
        name: 'Sarah Mitchell',
        role: 'Regional Sales Manager',
        avatar: 'SM',
        region: 'ANZ',
        bu: 'Workplace',
        email: 'sarah.m@salesspark.io',
        joined: '2019-11-01',
        targets:  { Q1: 1800000, Q2: 2000000, Q3: 2200000, Q4: 2400000 },
        achieved: { Q1: 1750000, Q2: 1950000, Q3: 2150000, Q4: 1050000 },
        renewalRate: 0.93,
        churn: 0.04,
        reports: [
          {
            id: 'rep4',
            name: 'James Wilson',
            role: 'Senior Sales Rep',
            avatar: 'JW',
            region: 'ANZ',
            bu: 'Workplace',
            email: 'james.w@salesspark.io',
            joined: '2020-08-15',
            targets:  { Q1: 950000, Q2: 1050000, Q3: 1150000, Q4: 1250000 },
            achieved: { Q1: 920000, Q2: 1020000, Q3: 1120000, Q4: 550000 },
            renewalRate: 0.94,
            churn: 0.04,
            reports: []
          },
          {
            id: 'rep5',
            name: 'Emma Thompson',
            role: 'Sales Rep',
            avatar: 'ET',
            region: 'ANZ',
            bu: 'Finance',
            email: 'emma.t@salesspark.io',
            joined: '2021-05-20',
            targets:  { Q1: 850000, Q2: 950000, Q3: 1050000, Q4: 1150000 },
            achieved: { Q1: 830000, Q2: 930000, Q3: 1030000, Q4: 500000 },
            renewalRate: 0.92,
            churn: 0.05,
            reports: []
          }
        ]
      },
      {
        id: 'mgr3',
        name: 'Rahul Gupta',
        role: 'Regional Sales Manager',
        avatar: 'RG',
        region: 'India South',
        bu: 'Marketing',
        email: 'rahul.g@salesspark.io',
        joined: '2020-03-01',
        targets:  { Q1: 2000000, Q2: 2200000, Q3: 2400000, Q4: 2600000 },
        achieved: { Q1: 1700000, Q2: 1900000, Q3: 2050000, Q4: 750000 },
        renewalRate: 0.82,
        churn: 0.12,
        reports: [
          {
            id: 'rep6',
            name: 'Deepak Reddy',
            role: 'Senior Sales Rep',
            avatar: 'DR',
            region: 'India South',
            bu: 'Marketing',
            email: 'deepak.r@salesspark.io',
            joined: '2021-07-12',
            targets:  { Q1: 700000, Q2: 770000, Q3: 840000, Q4: 900000 },
            achieved: { Q1: 580000, Q2: 640000, Q3: 700000, Q4: 250000 },
            renewalRate: 0.80,
            churn: 0.14,
            reports: []
          },
          {
            id: 'rep7',
            name: 'Anitha Krishnan',
            role: 'Sales Rep',
            avatar: 'AK',
            region: 'India South',
            bu: 'Finance',
            email: 'anitha.k@salesspark.io',
            joined: '2022-04-05',
            targets:  { Q1: 650000, Q2: 720000, Q3: 790000, Q4: 860000 },
            achieved: { Q1: 590000, Q2: 650000, Q3: 710000, Q4: 290000 },
            renewalRate: 0.84,
            churn: 0.11,
            reports: []
          },
          {
            id: 'rep8',
            name: 'Suresh Menon',
            role: 'Sales Rep',
            avatar: 'SK',
            region: 'India South',
            bu: 'HR Suite',
            email: 'suresh.m@salesspark.io',
            joined: '2021-11-20',
            targets:  { Q1: 650000, Q2: 710000, Q3: 770000, Q4: 840000 },
            achieved: { Q1: 530000, Q2: 610000, Q3: 640000, Q4: 210000 },
            renewalRate: 0.81,
            churn: 0.13,
            reports: []
          }
        ]
      },
      {
        id: 'mgr4',
        name: 'Ahmed Al-Rashid',
        role: 'Regional Sales Manager',
        avatar: 'AA',
        region: 'MEA',
        bu: 'Communications & Support',
        email: 'ahmed.r@salesspark.io',
        joined: '2020-08-10',
        targets:  { Q1: 1000000, Q2: 1200000, Q3: 1300000, Q4: 1500000 },
        achieved: { Q1:  980000, Q2: 1150000, Q3: 1260000, Q4:  620000 },
        renewalRate: 0.87,
        churn: 0.08,
        reports: [
          {
            id: 'rep9',
            name: 'Khalid Hassan',
            role: 'Senior Sales Rep',
            avatar: 'KH',
            region: 'MEA',
            bu: 'Communications & Support',
            email: 'khalid.h@salesspark.io',
            joined: '2021-01-10',
            targets:  { Q1: 500000, Q2: 600000, Q3: 650000, Q4: 750000 },
            achieved: { Q1: 490000, Q2: 580000, Q3: 630000, Q4: 310000 },
            renewalRate: 0.88,
            churn: 0.07,
            reports: []
          },
          {
            id: 'rep10',
            name: 'Fatima Al-Zahra',
            role: 'Sales Rep',
            avatar: 'FZ',
            region: 'MEA',
            bu: 'Finance',
            email: 'fatima.z@salesspark.io',
            joined: '2022-06-15',
            targets:  { Q1: 500000, Q2: 600000, Q3: 650000, Q4: 750000 },
            achieved: { Q1: 490000, Q2: 570000, Q3: 630000, Q4: 310000 },
            renewalRate: 0.86,
            churn: 0.09,
            reports: []
          }
        ]
      },
      {
        id: 'mgr5',
        name: 'Jessica Chen',
        role: 'Regional Sales Manager',
        avatar: 'JC',
        region: 'APAC',
        bu: 'Projects & PM',
        email: 'jessica.c@salesspark.io',
        joined: '2019-05-20',
        targets:  { Q1: 1000000, Q2: 1000000, Q3: 800000, Q4: 500000 },
        achieved: { Q1: 1170000, Q2: 1200000, Q3:  900000, Q4:  680000 },
        renewalRate: 0.95,
        churn: 0.03,
        reports: [
          {
            id: 'rep11',
            name: 'Wei Zhang',
            role: 'Senior Sales Rep',
            avatar: 'WZ',
            region: 'APAC',
            bu: 'Projects & PM',
            email: 'wei.z@salesspark.io',
            joined: '2020-10-05',
            targets:  { Q1: 500000, Q2: 500000, Q3: 400000, Q4: 250000 },
            achieved: { Q1: 590000, Q2: 620000, Q3: 460000, Q4: 350000 },
            renewalRate: 0.96,
            churn: 0.02,
            reports: []
          },
          {
            id: 'rep12',
            name: 'Tanaka Hiroshi',
            role: 'Sales Rep',
            avatar: 'TH',
            region: 'APAC',
            bu: 'Automation',
            email: 'tanaka.h@salesspark.io',
            joined: '2021-04-18',
            targets:  { Q1: 300000, Q2: 300000, Q3: 250000, Q4: 150000 },
            achieved: { Q1: 360000, Q2: 350000, Q3: 280000, Q4: 200000 },
            renewalRate: 0.95,
            churn: 0.03,
            reports: []
          },
          {
            id: 'rep13',
            name: 'Preethi Sharma',
            role: 'Sales Rep',
            avatar: 'PS',
            region: 'APAC',
            bu: 'BI & Analytics',
            email: 'preethi.s@salesspark.io',
            joined: '2022-02-10',
            targets:  { Q1: 200000, Q2: 200000, Q3: 150000, Q4: 100000 },
            achieved: { Q1: 220000, Q2: 230000, Q3: 160000, Q4: 130000 },
            renewalRate: 0.94,
            churn: 0.04,
            reports: []
          }
        ]
      }
    ]
  }
];

// ─── Revenue Trend (monthly, last 12 months) ─────────────────────────────────
const REVENUE_TREND = [
  { month: 'Apr', revenue: 2400000, target: 2600000 },
  { month: 'May', revenue: 2600000, target: 2700000 },
  { month: 'Jun', revenue: 2900000, target: 2900000 },
  { month: 'Jul', revenue: 2700000, target: 3000000 },
  { month: 'Aug', revenue: 3100000, target: 3000000 },
  { month: 'Sep', revenue: 2900000, target: 3000000 },
  { month: 'Oct', revenue: 3200000, target: 3100000 },
  { month: 'Nov', revenue: 3400000, target: 3200000 },
  { month: 'Dec', revenue: 3500000, target: 3200000 },
  { month: 'Jan', revenue: 1800000, target: 3300000 },
  { month: 'Feb', revenue: 1500000, target: 3300000 },
  { month: 'Mar', revenue: 900000,  target: 3400000 },
];

// ─── Win Rate by Region ──────────────────────────────────────────────────────
const WIN_RATE_BY_REGION = [
  { region: 'India North', winRate: 68, deals: 142, won: 97 },
  { region: 'India South', winRate: 54, deals: 110, won: 59 },
  { region: 'ANZ',         winRate: 72, deals: 95,  won: 68 },
  { region: 'APAC',        winRate: 78, deals: 88,  won: 69 },
  { region: 'MEA',         winRate: 63, deals: 78,  won: 49 },
];

// ─── Product Performance ─────────────────────────────────────────────────────
const PRODUCT_PERFORMANCE = [
  { product: 'BI & Analytics',           revenue: 4200000, growth: 18 },
  { product: 'Workplace',                revenue: 3800000, growth: 12 },
  { product: 'HR Suite',                 revenue: 2600000, growth: 9 },
  { product: 'Marketing',                revenue: 2100000, growth: 22 },
  { product: 'Finance',                  revenue: 1900000, growth: 14 },
  { product: 'Projects & PM',            revenue: 1500000, growth: 31 },
  { product: 'Communications & Support', revenue: 1200000, growth: 8 },
  { product: 'Automation',               revenue:  900000, growth: 45 },
  { product: 'Field Services',           revenue:  600000, growth: 11 },
  { product: 'Developer Platform',       revenue:  400000, growth: 37 },
];

// ─── Pipeline Data ───────────────────────────────────────────────────────────
const PIPELINE_DATA = {
  Q1: { total: 18500000, won: 7900000, lost: 2100000, open: 8500000 },
  Q2: { total: 20200000, won: 8700000, lost: 1900000, open: 9600000 },
  Q3: { total: 22000000, won: 9100000, lost: 2400000, open: 10500000 },
  Q4: { total: 24500000, won: 4200000, lost: 1800000, open: 18500000 },
};

// ─── At-Risk Deals ───────────────────────────────────────────────────────────
const AT_RISK_DEALS = [
  { name: 'TechCorp India Renewal',    value: 420000, rep: 'Arjun Sharma',   daysLeft: 12, risk: 'high' },
  { name: 'GlobalFinance Suite',       value: 380000, rep: 'Emma Thompson',  daysLeft: 8,  risk: 'critical' },
  { name: 'MegaCorp HR Expansion',     value: 510000, rep: 'Priya Nair',     daysLeft: 18, risk: 'medium' },
  { name: 'ANZ Gov Analytics',         value: 290000, rep: 'James Wilson',   daysLeft: 5,  risk: 'critical' },
  { name: 'MEA Telecom Marketing',     value: 340000, rep: 'Khalid Hassan',  daysLeft: 21, risk: 'medium' },
  { name: 'APAC Startup Automation',   value: 175000, rep: 'Wei Zhang',      daysLeft: 9,  risk: 'high' },
];

// ─── Retention / Churn Data ──────────────────────────────────────────────────
const RETENTION_DATA = {
  Q1: { renewals: 342, churned: 28, renewalRate: 0.924, mrr: 8200000, nrr: 1.12 },
  Q2: { renewals: 361, churned: 24, renewalRate: 0.937, mrr: 8700000, nrr: 1.15 },
  Q3: { renewals: 378, churned: 31, renewalRate: 0.924, mrr: 9100000, nrr: 1.11 },
  Q4: { renewals: 195, churned: 18, renewalRate: 0.915, mrr: 4200000, nrr: 1.08 },
};

// ─── Live Feed Events ────────────────────────────────────────────────────────
const LIVE_FEED_EVENTS = [
  { id: 1, type: 'deal_won',     time: '2 min ago',  user: 'Wei Zhang',        msg: 'Closed TechAsia Automation deal',            value: 175000,  icon: '🏆' },
  { id: 2, type: 'deal_risk',    time: '8 min ago',  user: 'Deepak Reddy',     msg: 'GlobalFinance deal marked at-risk',           value: 380000,  icon: '⚠️' },
  { id: 3, type: 'target_hit',   time: '22 min ago', user: 'Emma Thompson',    msg: 'Hit 85% of Q4 personal target',               value: null,    icon: '🎯' },
  { id: 4, type: 'deal_won',     time: '1 hr ago',   user: 'James Wilson',     msg: 'Renewed ANZ SaaS bundle',                     value: 290000,  icon: '🏆' },
  { id: 5, type: 'alert',        time: '2 hr ago',   user: 'System',           msg: 'Rahul Gupta team is 42% behind Q4 target',    value: null,    icon: '🔴' },
  { id: 6, type: 'deal_won',     time: '3 hr ago',   user: 'Arjun Sharma',     msg: 'Signed BFSI Analytics annual deal',           value: 380000,  icon: '🏆' },
  { id: 7, type: 'renewal',      time: '4 hr ago',   user: 'Fatima Al-Zahra', msg: 'MEA Finance Plus renewed — 2-year contract',   value: 310000,  icon: '🔄' },
  { id: 8, type: 'commission',   time: '5 hr ago',   user: 'Tanaka Hiroshi',   msg: 'Accelerate commission unlocked (+15%)',        value: null,    icon: '💎' },
  { id: 9, type: 'deal_lost',    time: '6 hr ago',   user: 'Suresh Menon',     msg: 'Lost Pharma HR deal to competitor',           value: 210000,  icon: '❌' },
  { id: 10, type: 'milestone',   time: '1 day ago',  user: 'Jessica Chen',     msg: 'APAC team crossed $1M milestone in Q4',       value: null,    icon: '🌟' },
  { id: 11, type: 'deal_won',    time: '1 day ago',  user: 'Preethi Sharma',   msg: 'Closed SG Fintech BI deal',                   value: 130000,  icon: '🏆' },
  { id: 12, type: 'alert',       time: '2 days ago', user: 'System',           msg: 'Q4 deadline in 62 working days',              value: null,    icon: '📅' },
];

// ─── Commission Tiers (Accelerate) ──────────────────────────────────────────
const COMMISSION_TIERS = [
  { label: 'Base',        threshold: 0,    rate: 0.08 },
  { label: 'Accelerate',  threshold: 0.80, rate: 0.12 },
  { label: 'Turbo',       threshold: 1.00, rate: 0.18 },
  { label: 'Elite',       threshold: 1.20, rate: 0.25 },
];

// ─── Years Available ─────────────────────────────────────────────────────────
const AVAILABLE_YEARS = [2022, 2023, 2024, 2025];

// ─── Utility: flatten all reps from hierarchy ───────────────────────────────
function getAllReps(nodes, reps = []) {
  nodes.forEach(n => {
    if (n.reports && n.reports.length === 0) reps.push(n); // leaf = rep
    else if (n.reports) getAllReps(n.reports, reps);
  });
  return reps;
}

function getAllNodes(nodes, result = []) {
  nodes.forEach(n => {
    result.push(n);
    if (n.reports && n.reports.length > 0) getAllNodes(n.reports, result);
  });
  return result;
}

function computeRollup(node, quarter) {
  if (!node.reports || node.reports.length === 0) {
    return { target: node.targets[quarter], achieved: node.achieved[quarter] };
  }
  let target = node.targets[quarter];
  let achieved = node.achieved[quarter];
  node.reports.forEach(r => {
    const sub = computeRollup(r, quarter);
    target += sub.target;
    achieved += sub.achieved;
  });
  return { target, achieved };
}
