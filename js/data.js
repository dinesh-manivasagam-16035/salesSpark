/* =====================================================================
   SalesSpark – Data Layer
   All region/country mappings, BU/service mappings, org hierarchy,
   and sample financial data used throughout the application.
   ===================================================================== */

const DATA = (() => {
  /* ---------- Region ↔ Country mapping ---------- */
  const countryRegionMap = [
    { country: "United States", code: "US", region: "US" },
    { country: "Albania", code: "AL", region: "ConEurope" },
    { country: "Algeria", code: "DZ", region: "MEA" },
    { country: "American Samoa", code: "AS", region: "APAC" },
    { country: "Andorra", code: "AD", region: "ConEurope" },
    { country: "Angola", code: "AO", region: "MEA" },
    { country: "Anguilla", code: "AI", region: "LATAM" },
    { country: "Antarctica", code: "AQ", region: "Others" },
    { country: "Antigua and Barbuda", code: "AG", region: "LATAM" },
    { country: "Argentina", code: "AR", region: "LATAM" },
    { country: "Armenia", code: "AM", region: "ConEurope" },
    { country: "Aruba", code: "AW", region: "LATAM" },
    { country: "Australia", code: "AU", region: "ANZ" },
    { country: "Austria", code: "AT", region: "ConEurope" },
    { country: "Azerbaijan", code: "AZ", region: "ConEurope" },
    { country: "Bahamas", code: "BS", region: "LATAM" },
    { country: "Bahrain", code: "BH", region: "MEA" },
    { country: "Bangladesh", code: "BD", region: "APAC" },
    { country: "Barbados", code: "BB", region: "LATAM" },
    { country: "Belarus", code: "BY", region: "ConEurope" },
    { country: "Belgium", code: "BE", region: "ConEurope" },
    { country: "Belize", code: "BZ", region: "LATAM" },
    { country: "Benin", code: "BJ", region: "MEA" },
    { country: "Bermuda", code: "BM", region: "LATAM" },
    { country: "Bhutan", code: "BT", region: "APAC" },
    { country: "Bolivia", code: "BO", region: "LATAM" },
    { country: "Bosnia and Herzegovina", code: "BA", region: "ConEurope" },
    { country: "Botswana", code: "BW", region: "MEA" },
    { country: "Bouvet Island", code: "BV", region: "MEA" },
    { country: "Brazil", code: "BR", region: "Brazil" },
    { country: "British Indian Ocean Territory", code: "IO", region: "UK" },
    { country: "Brunei Darussalam", code: "BN", region: "APAC" },
    { country: "Bulgaria", code: "BG", region: "ConEurope" },
    { country: "Burkina Faso", code: "BF", region: "MEA" },
    { country: "Burundi", code: "BI", region: "MEA" },
    { country: "Cambodia", code: "KH", region: "APAC" },
    { country: "Cameroon", code: "CM", region: "MEA" },
    { country: "Canada", code: "CA", region: "Canada" },
    { country: "Cape Verde", code: "CV", region: "MEA" },
    { country: "Cayman Islands", code: "KY", region: "LATAM" },
    { country: "Central African Republic", code: "CF", region: "MEA" },
    { country: "Chad", code: "TD", region: "MEA" },
    { country: "Chile", code: "CL", region: "LATAM" },
    { country: "China", code: "CN", region: "China" },
    { country: "Christmas Island", code: "CX", region: "ANZ" },
    { country: "Cocos (Keeling) Islands", code: "CC", region: "ANZ" },
    { country: "Colombia", code: "CO", region: "LATAM" },
    { country: "Comoros", code: "KM", region: "MEA" },
    { country: "Congo", code: "CG", region: "MEA" },
    { country: "Congo, Democratic Republic", code: "CD", region: "MEA" },
    { country: "Cook Islands", code: "CK", region: "APAC" },
    { country: "Costa Rica", code: "CR", region: "LATAM" },
    { country: "Croatia", code: "HR", region: "ConEurope" },
    { country: "Cyprus", code: "CY", region: "ConEurope" },
    { country: "Czech Republic", code: "CZ", region: "ConEurope" },
    { country: "Denmark", code: "DK", region: "ConEurope" },
    { country: "Djibouti", code: "DJ", region: "MEA" },
    { country: "Dominica", code: "DM", region: "LATAM" },
    { country: "Dominican Republic", code: "DO", region: "LATAM" },
    { country: "East Timor", code: "TL", region: "APAC" },
    { country: "Ecuador", code: "EC", region: "LATAM" },
    { country: "Egypt", code: "EG", region: "MEA" },
    { country: "El Salvador", code: "SV", region: "LATAM" },
    { country: "Equatorial Guinea", code: "GQ", region: "MEA" },
    { country: "India", code: "IN", region: "India" },
    { country: "New Zealand", code: "NZ", region: "ANZ" },
    { country: "United Kingdom", code: "GB", region: "UK" },
    { country: "Germany", code: "DE", region: "ConEurope" },
    { country: "France", code: "FR", region: "ConEurope" },
    { country: "Japan", code: "JP", region: "APAC" },
    { country: "Singapore", code: "SG", region: "APAC" },
    { country: "South Korea", code: "KR", region: "APAC" },
    { country: "Indonesia", code: "ID", region: "APAC" },
    { country: "Malaysia", code: "MY", region: "APAC" },
    { country: "Thailand", code: "TH", region: "APAC" },
    { country: "Vietnam", code: "VN", region: "APAC" },
    { country: "Philippines", code: "PH", region: "APAC" },
    { country: "South Africa", code: "ZA", region: "MEA" },
    { country: "Nigeria", code: "NG", region: "MEA" },
    { country: "Kenya", code: "KE", region: "MEA" },
    { country: "UAE", code: "AE", region: "MEA" },
    { country: "Saudi Arabia", code: "SA", region: "MEA" },
    { country: "Mexico", code: "MX", region: "LATAM" },
    { country: "Peru", code: "PE", region: "LATAM" },
    { country: "Italy", code: "IT", region: "ConEurope" },
    { country: "Spain", code: "ES", region: "ConEurope" },
    { country: "Netherlands", code: "NL", region: "ConEurope" },
    { country: "Sweden", code: "SE", region: "ConEurope" },
    { country: "Norway", code: "NO", region: "ConEurope" },
    { country: "Finland", code: "FI", region: "ConEurope" },
    { country: "Poland", code: "PL", region: "ConEurope" },
    { country: "Switzerland", code: "CH", region: "ConEurope" },
    { country: "Ireland", code: "IE", region: "UK" },
    { country: "Taiwan", code: "TW", region: "APAC" },
    { country: "Hong Kong", code: "HK", region: "APAC" }
  ];

  const regions = [...new Set(countryRegionMap.map(c => c.region))].sort();

  function countriesForRegion(region) {
    if (!region || region === "All") return countryRegionMap.map(c => c.country).sort();
    return countryRegionMap.filter(c => c.region === region).map(c => c.country).sort();
  }

  function regionForCountry(country) {
    const entry = countryRegionMap.find(c => c.country === country);
    return entry ? entry.region : "Others";
  }

  /* ---------- BU ↔ Service mapping ---------- */
  const buServiceMap = {
    "BI & Analytics": [
      "Creator & QENGINE", "Analytics", "Analytics On Premise"
    ],
    "Communication & Collaboration": [
      "FLOW", "Cliq", "Mail", "Connect", "Workdrive", "Show",
      "Sheet", "Writer", "Docs", "Sign", "Vault", "Wiki",
      "Team Inbox", "Zeptomail", "Notebook", "CommunitySpaces", "Remotely", "Learn"
    ],
    "HR & Workforce": [
      "HelpDesk-Desk", "HR-Recruit", "People", "Expense", "Payroll",
      "Shifts", "Peopleplus", "Workerly", "Workplace"
    ],
    "Project Management": [
      "Projects", "Sprints", "BugTracker", "Projects Plus", "Qntrl"
    ],
    "Marketing": [
      "Campaigns", "Marketing Automation", "Marketing Plus", "Social", "Lead Chain"
    ],
    "Sales & Engagement": [
      "SalesIQ", "Forms", "Landing Pages", "Survey", "Sites", "Pagesense"
    ],
    "Finance": [
      "Books", "Inventory", "Billing/Subscriptions", "Finance Plus", "Checkout"
    ],
    "Events": ["Backstage"],
    "Remote Support": [
      "Assist", "Meeting", "Lens", "Webinar"
    ],
    "Voice & Bookings": [
      "Zoho Voice", "Zoho Bookings"
    ],
    "Field Service": ["FSM"],
    "Platform": ["Zoho Catalyst"]
  };

  const buList = Object.keys(buServiceMap).sort();
  const allServices = Object.values(buServiceMap).flat().sort();

  function servicesForBU(bu) {
    if (!bu || bu === "All") return allServices;
    return buServiceMap[bu] || [];
  }

  /* ---------- Org hierarchy ---------- */
  const orgHierarchy = {
    id: "d1",
    name: "Peter Balaji",
    role: "Director of Sales",
    avatar: "PB",
    target: 18000000,
    achieved: 12420000,
    children: [
      {
        id: "m1",
        name: "Jinil K Sreejayan",
        role: "Assistant Director",
        avatar: "JS",
        target: 6000000,
        achieved: 4380000,
        reportsTo: "Peter Balaji",
        children: [
          { id: "r1", name: "Arun Kumar", role: "Senior Sales Rep", avatar: "AK", target: 2000000, achieved: 1620000, reportsTo: "Jinil K Sreejayan", children: [] },
          { id: "r2", name: "Priya Nair", role: "Sales Rep", avatar: "PN", target: 2000000, achieved: 1480000, reportsTo: "Jinil K Sreejayan", children: [] },
          { id: "r3", name: "Rahul Menon", role: "Sales Rep", avatar: "RM", target: 2000000, achieved: 1280000, reportsTo: "Jinil K Sreejayan", children: [] }
        ]
      },
      {
        id: "m2",
        name: "Sarah Chen",
        role: "Regional Manager – APAC",
        avatar: "SC",
        target: 6000000,
        achieved: 4140000,
        reportsTo: "Peter Balaji",
        children: [
          { id: "r4", name: "Wei Zhang", role: "Senior Sales Rep", avatar: "WZ", target: 2000000, achieved: 1700000, reportsTo: "Sarah Chen", children: [] },
          { id: "r5", name: "Kenji Tanaka", role: "Sales Rep", avatar: "KT", target: 2000000, achieved: 1340000, reportsTo: "Sarah Chen", children: [] },
          { id: "r6", name: "Mei Lin", role: "Sales Rep", avatar: "ML", target: 2000000, achieved: 1100000, reportsTo: "Sarah Chen", children: [] }
        ]
      },
      {
        id: "m3",
        name: "David Okonkwo",
        role: "Regional Manager – MEA",
        avatar: "DO",
        target: 6000000,
        achieved: 3900000,
        reportsTo: "Peter Balaji",
        children: [
          { id: "r7", name: "Fatima Al-Rashid", role: "Senior Sales Rep", avatar: "FA", target: 2000000, achieved: 1560000, reportsTo: "David Okonkwo", children: [] },
          { id: "r8", name: "James Mwangi", role: "Sales Rep", avatar: "JM", target: 2000000, achieved: 1240000, reportsTo: "David Okonkwo", children: [] },
          { id: "r9", name: "Amina Yusuf", role: "Sales Rep", avatar: "AY", target: 2000000, achieved: 1100000, reportsTo: "David Okonkwo", children: [] }
        ]
      }
    ]
  };

  /* ---------- Quarterly financial data ---------- */
  const years = [2022, 2023, 2024];
  const quarters = ["Q1", "Q2", "Q3", "Q4"];

  function generateQuarterData(year, quarter) {
    const seed = year * 10 + quarters.indexOf(quarter);
    const base = 3200000 + (seed % 7) * 420000;
    const achieved = Math.round(base * (0.55 + (seed % 13) * 0.035));
    const pipeline = Math.round(base * 1.4);
    const winRate = 28 + (seed % 19);
    const atRisk = 3 + (seed % 5);
    const churnRate = 3.2 + (seed % 7) * 0.4;
    const renewalRate = 100 - churnRate - (seed % 3) * 0.5;
    return { year, quarter, targetRevenue: base, achievedRevenue: achieved, pipeline, winRate, atRiskDeals: atRisk, churnRate: parseFloat(churnRate.toFixed(1)), renewalRate: parseFloat(renewalRate.toFixed(1)) };
  }

  const financialData = {};
  years.forEach(y => {
    financialData[y] = {};
    quarters.forEach(q => {
      financialData[y][q] = generateQuarterData(y, q);
    });
  });

  /* ---------- Region-level revenue data ---------- */
  const regionRevenue = {
    US: { target: 5200000, achieved: 3640000 },
    APAC: { target: 3800000, achieved: 2660000 },
    ConEurope: { target: 3200000, achieved: 2240000 },
    MEA: { target: 2400000, achieved: 1560000 },
    LATAM: { target: 1800000, achieved: 1170000 },
    ANZ: { target: 1200000, achieved: 900000 },
    India: { target: 2000000, achieved: 1500000 },
    UK: { target: 1600000, achieved: 1200000 },
    Brazil: { target: 800000, achieved: 520000 },
    Canada: { target: 1000000, achieved: 750000 },
    China: { target: 1400000, achieved: 980000 },
    Others: { target: 400000, achieved: 260000 }
  };

  /* ---------- Product / BU performance ---------- */
  const buPerformance = {
    "BI & Analytics": { deals: 42, revenue: 2800000, winRate: 38 },
    "Communication & Collaboration": { deals: 68, revenue: 3200000, winRate: 42 },
    "HR & Workforce": { deals: 35, revenue: 1900000, winRate: 31 },
    "Project Management": { deals: 28, revenue: 1400000, winRate: 35 },
    "Marketing": { deals: 52, revenue: 2400000, winRate: 40 },
    "Sales & Engagement": { deals: 45, revenue: 2100000, winRate: 36 },
    "Finance": { deals: 38, revenue: 2600000, winRate: 44 },
    "Events": { deals: 12, revenue: 600000, winRate: 29 },
    "Remote Support": { deals: 22, revenue: 1100000, winRate: 33 },
    "Voice & Bookings": { deals: 18, revenue: 800000, winRate: 30 },
    "Field Service": { deals: 15, revenue: 900000, winRate: 34 },
    "Platform": { deals: 10, revenue: 500000, winRate: 27 }
  };

  /* ---------- Live feed entries ---------- */
  const liveFeed = [
    { time: "2 min ago", text: "Arun Kumar closed a $180K deal with TechCorp (APAC)", type: "win" },
    { time: "18 min ago", text: "Pipeline alert: 3 deals worth $420K moving to negotiation stage", type: "info" },
    { time: "34 min ago", text: "Priya Nair added $95K opportunity – FinServ Ltd (India)", type: "new" },
    { time: "1 hr ago", text: "Renewal risk: DataFlow Inc contract ($210K) expiring in 14 days", type: "risk" },
    { time: "1.5 hr ago", text: "Wei Zhang hit 85% of Q target – on track for accelerator", type: "milestone" },
    { time: "2 hr ago", text: "Sarah Chen's APAC team crossed $4M achieved revenue", type: "milestone" },
    { time: "3 hr ago", text: "New lead assigned: GlobalMfg ($320K) → James Mwangi", type: "new" },
    { time: "4 hr ago", text: "Churn alert: 2 accounts flagged for low engagement score", type: "risk" },
    { time: "5 hr ago", text: "Fatima Al-Rashid moved OilTech deal ($150K) to closed-won", type: "win" },
    { time: "6 hr ago", text: "Monthly commission report generated – 4 reps in accelerator zone", type: "info" }
  ];

  /* ---------- Commission tiers ---------- */
  const commissionTiers = [
    { min: 0, max: 80, rate: 8, label: "Base" },
    { min: 80, max: 100, rate: 12, label: "On-Target" },
    { min: 100, max: 120, rate: 18, label: "Accelerator" },
    { min: 120, max: Infinity, rate: 25, label: "Super Accelerator" }
  ];

  /* ---------- Helpers ---------- */
  /* Fiscal year runs April–March (e.g. FY25 = Apr 2024 – Mar 2025).
     Q1 = Apr–Jun, Q2 = Jul–Sep, Q3 = Oct–Dec, Q4 = Jan–Mar. */
  function getCurrentFiscalQuarter() {
    const now = new Date();
    const month = now.getMonth(); // 0-indexed
    const calYear = now.getFullYear();
    if (month >= 3 && month <= 5) return { year: calYear, quarter: "Q1", fiscalYear: calYear };
    if (month >= 6 && month <= 8) return { year: calYear, quarter: "Q2", fiscalYear: calYear };
    if (month >= 9 && month <= 11) return { year: calYear, quarter: "Q3", fiscalYear: calYear };
    // Jan–Mar: still part of the fiscal year that started the previous April
    return { year: calYear, quarter: "Q4", fiscalYear: calYear - 1 };
  }

  function formatCurrency(n) {
    if (n >= 1000000) return "$" + (n / 1000000).toFixed(2) + "M";
    if (n >= 1000) return "$" + (n / 1000).toFixed(0) + "K";
    return "$" + n.toFixed(0);
  }

  function pct(achieved, target) {
    if (!target) return 0;
    return +((achieved / target) * 100).toFixed(1);
  }

  function getBusinessDaysRemaining() {
    const now = new Date();
    const month = now.getMonth();
    let endMonth;
    if (month < 3) endMonth = 2;
    else if (month < 6) endMonth = 5;
    else if (month < 9) endMonth = 8;
    else endMonth = 11;
    const endDate = new Date(now.getFullYear(), endMonth + 1, 0);
    let days = 0;
    const d = new Date(now);
    while (d <= endDate) {
      const day = d.getDay();
      if (day !== 0 && day !== 6) days++;
      d.setDate(d.getDate() + 1);
    }
    return days;
  }

  function flattenOrg(node, list) {
    list = list || [];
    list.push(node);
    (node.children || []).forEach(c => flattenOrg(c, list));
    return list;
  }

  return {
    countryRegionMap, regions, countriesForRegion, regionForCountry,
    buServiceMap, buList, allServices, servicesForBU,
    orgHierarchy, years, quarters, financialData,
    regionRevenue, buPerformance, liveFeed, commissionTiers,
    getCurrentFiscalQuarter, formatCurrency, pct,
    getBusinessDaysRemaining, flattenOrg
  };
})();
