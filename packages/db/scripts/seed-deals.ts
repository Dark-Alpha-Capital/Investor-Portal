/**
 * Seed 100+ realistic PE marketplace deals into local D1.
 *
 * Usage (from packages/db):
 *   bun run scripts/seed-deals.ts
 *   bun run scripts/seed-deals.ts --replace   # delete prior seed deals first
 */
import { randomUUID } from "node:crypto";
import { Database } from "bun:sqlite";
import { resolveLocalD1Path } from "./resolve-local-d1";

const SEED_SLUG_PREFIX = "seed-";
const DEAL_COUNT = 120;
const REPLACE = process.argv.includes("--replace");

type DealStatus =
  | "draft"
  | "coming_soon"
  | "live"
  | "closing"
  | "funded"
  | "exited"
  | "cancelled";

type DealVisibility = "public" | "accredited" | "invite_only";

type SectorTemplate = {
  sector: string;
  dealTypes: string[];
  companies: Array<{
    name: string;
    project: string;
    teaser: string;
    thesisBullets: string[];
    riskBullets: string[];
  }>;
};

const GEOGRAPHIES = [
  "United States — Northeast",
  "United States — Southeast",
  "United States — Midwest",
  "United States — Southwest",
  "United States — West Coast",
  "United States — National",
  "Canada — Ontario",
  "United Kingdom",
  "Western Europe",
  "Nordics",
  "Australia",
  "Singapore / SEA",
];

const HOLD_PERIODS = ["2–3 years", "3–4 years", "3–5 years", "4–6 years", "5–7 years"];

const STATUS_WEIGHTS: Array<{ status: DealStatus; weight: number }> = [
  { status: "live", weight: 45 },
  { status: "coming_soon", weight: 15 },
  { status: "closing", weight: 12 },
  { status: "funded", weight: 12 },
  { status: "draft", weight: 8 },
  { status: "exited", weight: 5 },
  { status: "cancelled", weight: 3 },
];

const VISIBILITY_WEIGHTS: Array<{ visibility: DealVisibility; weight: number }> =
  [
    { visibility: "public", weight: 40 },
    { visibility: "accredited", weight: 40 },
    { visibility: "invite_only", weight: 20 },
  ];

const SECTORS: SectorTemplate[] = [
  {
    sector: "Healthcare",
    dealTypes: ["Platform Acquisition", "Add-on Acquisition", "Growth Equity"],
    companies: [
      {
        name: "Aurelia Specialty Clinics",
        project: "Healthcare Platform",
        teaser:
          "Multi-site specialty clinic platform consolidating fragmented outpatient care.",
        thesisBullets: [
          "Large fragmented outpatient market with aging demographics",
          "Recurring procedural volume and strong payer mix",
          "30%+ clinic-level EBITDA margins at mature sites",
          "Experienced physician-operator management team",
          "Low single-payer concentration after diversification",
        ],
        riskBullets: [
          "Reimbursement rate pressure from commercial payers",
          "Physician retention and non-compete enforceability",
          "Integration risk across multi-state clinic roll-up",
          "Regulatory and licensing complexity by state",
        ],
      },
      {
        name: "Northwind Behavioral Health",
        project: "Behavioral Health Rollup",
        teaser:
          "Behavioral health platform targeting outpatient IOP/PHP and telehealth expansion.",
        thesisBullets: [
          "Secular demand growth in mental health services",
          "Hybrid in-clinic and telehealth delivery model",
          "Attractive unit economics on mature clinics",
          "Clear add-on pipeline in adjacent MSAs",
        ],
        riskBullets: [
          "Labor shortage for licensed clinicians",
          "Payer credentialing delays on new sites",
          "State licensing and telehealth rules vary",
          "Reputation / clinical quality sensitivity",
        ],
      },
      {
        name: "Summit Dental Partners",
        project: "Dental DSO Platform",
        teaser:
          "Dental service organization with 40+ practices and centralized RCM.",
        thesisBullets: [
          "Recurring patient base with high retention",
          "Centralized billing and procurement leverage",
          "Underserved secondary markets with limited competition",
          "Strong associate dentist recruiting engine",
        ],
        riskBullets: [
          "Associate dentist turnover",
          "Corporate practice-of-dentistry restrictions",
          "Capex intensity for de novo builds",
          "Patient volume sensitivity to consumer spend",
        ],
      },
      {
        name: "VitalPath Diagnostics",
        project: "Diagnostics Lab Platform",
        teaser:
          "Regional diagnostics laboratory network with hospital outreach contracts.",
        thesisBullets: [
          "Sticky hospital and physician referral relationships",
          "High incremental margins on additional test volume",
          "Opportunity to expand specialty testing menu",
          "Fragmented regional lab market ripe for M&A",
        ],
        riskBullets: [
          "CLIA / CAP compliance risk",
          "Hospital contract renewal concentration",
          "Technology disruption from at-home testing",
          "Reimbursement coding changes",
        ],
      },
    ],
  },
  {
    sector: "Business Services",
    dealTypes: [
      "Business Services Rollup",
      "Platform Acquisition",
      "Add-on Acquisition",
    ],
    companies: [
      {
        name: "Harbor Compliance Group",
        project: "Business Services Rollup",
        teaser:
          "Compliance and licensing services platform for multi-state operators.",
        thesisBullets: [
          "Mission-critical recurring SaaS + services revenue",
          "High switching costs once embedded in workflows",
          "Clear geographic expansion white space",
          "Strong management with prior PE exit experience",
        ],
        riskBullets: [
          "Customer concentration in top 10 accounts",
          "Key employee dependency in sales leadership",
          "Integration risk on bolt-on acquisitions",
          "Interest rate sensitivity on floating-rate debt",
        ],
      },
      {
        name: "Atlas Facilities Partners",
        project: "Facilities Management Platform",
        teaser:
          "Outsourced facilities management for commercial real estate portfolios.",
        thesisBullets: [
          "Recurring multi-year contracts with CRE owners",
          "Labor arbitrage vs in-house teams",
          "Cross-sell path into energy and security services",
          "Fragmented regional competitor set",
        ],
        riskBullets: [
          "Wage inflation compressing margins",
          "Contract churn on CRE vacancy cycles",
          "Safety / liability incident exposure",
          "Working capital swings on large accounts",
        ],
      },
      {
        name: "Clearline Accounting Partners",
        project: "Outsourced Accounting Platform",
        teaser:
          "Outsourced bookkeeping and controllership for PE-backed portfolio companies.",
        thesisBullets: [
          "Recurring monthly retainer model",
          "Natural demand from sponsor ecosystem",
          "Scalable offshore + onshore delivery mix",
          "High net revenue retention via upsell",
        ],
        riskBullets: [
          "Talent competition for controllers",
          "Quality control across distributed teams",
          "Client concentration among sponsor relationships",
          "Cybersecurity / data handling risk",
        ],
      },
      {
        name: "Pinnacle HR Solutions",
        project: "PEO / HR Services",
        teaser:
          "Professional employer organization serving mid-market employers.",
        thesisBullets: [
          "Sticky recurring PEO relationships",
          "Regulatory complexity creates moat",
          "Cross-sell benefits and retirement products",
          "Attractive cash conversion profile",
        ],
        riskBullets: [
          "Workers’ compensation claim severity",
          "State regulatory changes for PEOs",
          "Health insurance cost pass-through risk",
          "Competition from national PEOs",
        ],
      },
    ],
  },
  {
    sector: "Industrial",
    dealTypes: [
      "Industrial Manufacturing",
      "Platform Acquisition",
      "Add-on Acquisition",
    ],
    companies: [
      {
        name: "Ironclad Precision Components",
        project: "Industrial Manufacturing",
        teaser:
          "Precision machined components supplier to aerospace and defense OEMs.",
        thesisBullets: [
          "Long-cycle aerospace backlog visibility",
          "High barriers via certifications (AS9100, NADCAP)",
          "Pricing power on mission-critical parts",
          "Add-on opportunities in adjacent machining niches",
        ],
        riskBullets: [
          "OEM program delay risk",
          "Raw material price volatility",
          "Skilled machinist labor shortage",
          "Customer concentration among primes",
        ],
      },
      {
        name: "Cascade Process Equipment",
        project: "Industrial Equipment Platform",
        teaser:
          "Engineered process equipment for food & beverage and specialty chemicals.",
        thesisBullets: [
          "Aftermarket parts & service recurring revenue",
          "Custom-engineered solutions with sticky installed base",
          "Secular CapEx in food processing modernization",
          "International expansion via distributor network",
        ],
        riskBullets: [
          "Project timing / backlog conversion risk",
          "Warranty and installation liability",
          "Supply chain lead times for specialty metals",
          "Cyclical industrial CapEx spending",
        ],
      },
      {
        name: "Redwood Packaging Systems",
        project: "Packaging Equipment",
        teaser:
          "Automation packaging equipment OEM with strong aftermarket attach rates.",
        thesisBullets: [
          "High aftermarket margin contribution",
          "Automation trend reducing customer labor dependency",
          "Installed base creates multi-year service annuity",
          "Fragmented regional service competitors",
        ],
        riskBullets: [
          "Customer CapEx deferrals in downturns",
          "Technology obsolescence risk",
          "Tariff exposure on imported components",
          "Key engineering talent retention",
        ],
      },
      {
        name: "Meridian Coatings",
        project: "Specialty Coatings",
        teaser:
          "Industrial specialty coatings for infrastructure and energy assets.",
        thesisBullets: [
          "Specification-driven sticky customer relationships",
          "Infrastructure spending tailwinds",
          "High switching costs once qualified",
          "Capacity expansion with attractive ROIC",
        ],
        riskBullets: [
          "Environmental / EPA compliance costs",
          "Commodity resin input inflation",
          "Weather-dependent application seasons",
          "Project concentration in energy vertical",
        ],
      },
    ],
  },
  {
    sector: "Technology",
    dealTypes: ["Growth Equity", "Special Situation", "Platform Acquisition"],
    companies: [
      {
        name: "LedgerStack Software",
        project: "Vertical SaaS Platform",
        teaser:
          "Vertical SaaS for mid-market distributors with embedded payments.",
        thesisBullets: [
          "Net revenue retention above 120%",
          "Embedded payments expand TAM per customer",
          "Low churn due to operational system of record",
          "Clear product roadmap for WMS add-on module",
        ],
        riskBullets: [
          "Competitive pressure from horizontal ERPs",
          "Payments partner concentration",
          "Customer IT budget cycles",
          "Key product engineering dependency",
        ],
      },
      {
        name: "SignalForge Analytics",
        project: "Data Infrastructure",
        teaser:
          "Industrial IoT analytics platform for predictive maintenance.",
        thesisBullets: [
          "Land-and-expand within multi-plant customers",
          "High gross margins on software layer",
          "Defensible domain models for industrial assets",
          "Partnership channel with OEM equipment makers",
        ],
        riskBullets: [
          "Long enterprise sales cycles",
          "Hardware attach complicates delivery",
          "Data privacy / plant security concerns",
          "Feature competition from hyperscalers",
        ],
      },
      {
        name: "Quorum Security Ops",
        project: "Cybersecurity Services",
        teaser:
          "Managed detection and response for mid-market financial services.",
        thesisBullets: [
          "Recurring MDR subscription revenue",
          "Regulatory drivers (SOC2, GLBA) sustain demand",
          "High switching costs once SOC integrated",
          "Bolt-on MSSP consolidation opportunity",
        ],
        riskBullets: [
          "Talent war for security analysts",
          "Breach liability / reputational risk",
          "Tooling cost inflation (SIEM vendors)",
          "Customer concentration in regional banks",
        ],
      },
      {
        name: "BrightPath EdTech",
        project: "Education Technology",
        teaser:
          "Workforce upskilling platform sold to employers and community colleges.",
        thesisBullets: [
          "Skills gap creates durable B2B demand",
          "Content library with strong completion rates",
          "Expanding employer apprenticeship partnerships",
          "Attractive LTV/CAC with multi-year contracts",
        ],
        riskBullets: [
          "Public funding / grant dependency",
          "Content freshness / instructor quality",
          "Competition from large LMS vendors",
          "Sales cycle tied to academic calendars",
        ],
      },
    ],
  },
  {
    sector: "Consumer",
    dealTypes: ["Platform Acquisition", "Growth Equity", "Special Situation"],
    companies: [
      {
        name: "Oak & Barrel Brands",
        project: "Premium CPG Platform",
        teaser:
          "Premium specialty foods brand with strong DTC and retail distribution.",
        thesisBullets: [
          "Brand equity in premium natural category",
          "Omnichannel mix balances DTC and retail",
          "Gross margin expansion via SKU rationalization",
          "Adjacent category M&A runway",
        ],
        riskBullets: [
          "Retailer shelf-space competition",
          "Commodity ingredient cost swings",
          "Consumer discretionary spend sensitivity",
          "Marketing CAC inflation on DTC",
        ],
      },
      {
        name: "Trailhead Outdoor Co.",
        project: "Outdoor Apparel",
        teaser:
          "Performance outdoor apparel brand with wholesale and DTC channels.",
        thesisBullets: [
          "Loyal outdoor community brand affinity",
          "Inventory turns improving under new ops leadership",
          "International wholesale white space",
          "Margin upside from direct mix shift",
        ],
        riskBullets: [
          "Seasonality and weather dependency",
          "Inventory obsolescence risk",
          "Tariff exposure on imported goods",
          "Brand / fashion cycle risk",
        ],
      },
      {
        name: "Homestead Pet Care",
        project: "Pet Services Rollup",
        teaser:
          "Multi-location pet boarding, daycare, and grooming platform.",
        thesisBullets: [
          "Recurring pet owner relationships",
          "Fragmented local market for consolidation",
          "Ancillary retail and veterinary cross-sell",
          "Attractive unit economics at mature sites",
        ],
        riskBullets: [
          "Real estate lease exposure",
          "Labor availability for caregivers",
          "Animal incident liability",
          "Local competition from independents",
        ],
      },
      {
        name: "Lumen Beauty Collective",
        project: "Beauty Retail Platform",
        teaser:
          "Specialty beauty retail and services platform in high-traffic urban markets.",
        thesisBullets: [
          "Experiential retail drives repeat visits",
          "Private-label margin contribution growing",
          "Services attach rates improve LTV",
          "Selective market densification strategy",
        ],
        riskBullets: [
          "Lease cost inflation in urban cores",
          "Trend / brand cycle risk",
          "Inventory markdown risk",
          "Labor cost pressure on services",
        ],
      },
    ],
  },
  {
    sector: "Financial Services",
    dealTypes: ["Special Situation", "Growth Equity", "Platform Acquisition"],
    companies: [
      {
        name: "Evergreen Wealth Admin",
        project: "RIA Platform",
        teaser:
          "Independent RIA aggregator with centralized compliance and ops.",
        thesisBullets: [
          "Recurring AUM-based fee revenue",
          "Advisor succession creates deal flow",
          "Centralized compliance reduces advisor overhead",
          "Cross-sell of alternatives and lending",
        ],
        riskBullets: [
          "Market drawdown impacts AUM fees",
          "Advisor retention post-acquisition",
          "SEC / state regulatory scrutiny",
          "Integration of disparate tech stacks",
        ],
      },
      {
        name: "Keystone Specialty Finance",
        project: "Specialty Lending",
        teaser:
          "Specialty lender focused on equipment and working-capital facilities.",
        thesisBullets: [
          "Attractive risk-adjusted yields",
          "Diversified borrower base by industry",
          "Strong underwriting culture and loss history",
          "Warehouse funding upside with scale",
        ],
        riskBullets: [
          "Credit losses in recession scenarios",
          "Funding cost / interest rate risk",
          "Borrower concentration in cyclical sectors",
          "Regulatory capital / licensing requirements",
        ],
      },
      {
        name: "Parcel Title Partners",
        project: "Title & Escrow",
        teaser:
          "Regional title and escrow platform serving residential and commercial.",
        thesisBullets: [
          "Transaction-linked but sticky realtor referral network",
          "Technology investment improves cycle times",
          "Commercial title expands mix beyond residential",
          "Bolt-on agencies available at attractive multiples",
        ],
        riskBullets: [
          "Housing transaction volume cyclicality",
          "Claims / E&O exposure",
          "Rate environment impacting refinance volume",
          "Agent / referral concentration",
        ],
      },
      {
        name: "Northbridge Insurance Services",
        project: "Insurance Brokerage",
        teaser:
          "Middle-market insurance brokerage with employee benefits specialty.",
        thesisBullets: [
          "Highly recurring commission revenue",
          "Benefits cross-sell lifts wallet share",
          "Producer recruiting engine in place",
          "Fragmented brokerage M&A market",
        ],
        riskBullets: [
          "Producer walk risk / book ownership disputes",
          "Carrier appointment dependency",
          "Contingent commission variability",
          "Cyber liability on client data",
        ],
      },
    ],
  },
  {
    sector: "Real Estate / PropCo",
    dealTypes: ["Special Situation", "Platform Acquisition", "Debt"],
    companies: [
      {
        name: "Beacon Self Storage",
        project: "Self-Storage Platform",
        teaser:
          "Climate-controlled self-storage portfolio in Sun Belt metros.",
        thesisBullets: [
          "Need-based demand with high occupancy resilience",
          "Operational upside via revenue management",
          "Development pipeline on entitled land bank",
          "Favorable long-term demographic migration",
        ],
        riskBullets: [
          "New supply in target MSAs",
          "Interest rate impact on Cap rates",
          "Property tax reassessment risk",
          "Weather / catastrophe exposure",
        ],
      },
      {
        name: "Harbor Light Senior Living",
        project: "Senior Housing",
        teaser:
          "Assisted living portfolio with value-add occupancy upside.",
        thesisBullets: [
          "Aging demographics drive long-term demand",
          "Occupancy recovery path post-operations reset",
          "Expense controls improve NOI margins",
          "Selective CapEx unlocks rate premiums",
        ],
        riskBullets: [
          "Labor cost inflation for caregivers",
          "Regulatory / licensing risk",
          "Census recovery timing uncertainty",
          "Liability insurance cost pressure",
        ],
      },
      {
        name: "Ridgeway Industrial Logistics",
        project: "Industrial Logistics",
        teaser:
          "Last-mile industrial logistics assets near major distribution hubs.",
        thesisBullets: [
          "E-commerce and nearshoring support demand",
          "Below-market in-place rents with mark-to-market upside",
          "Short WALT enables proactive leasing",
          "Limited competing supply in submarkets",
        ],
        riskBullets: [
          "Tenant credit risk on single-tenant assets",
          "Cap rate expansion in higher-rate regimes",
          "CapEx for warehouse modernization",
          "Zoning / entitlement delays on expansions",
        ],
      },
      {
        name: "Civic Ground Multifamily",
        project: "Workforce Housing",
        teaser:
          "Workforce multifamily portfolio in supply-constrained secondary markets.",
        thesisBullets: [
          "Affordability gap supports stable occupancy",
          "Value-add renovations drive rent premiums",
          "Professionalized property management upside",
          "Favorable MSA job growth trajectories",
        ],
        riskBullets: [
          "Rent control / housing policy risk",
          "Insurance cost spikes in CAT markets",
          "Construction cost overruns on renovations",
          "Interest rate refinance risk",
        ],
      },
    ],
  },
  {
    sector: "Energy Transition",
    dealTypes: ["Growth Equity", "Special Situation", "Infrastructure Equity"],
    companies: [
      {
        name: "Solara Distributed Energy",
        project: "Distributed Solar",
        teaser:
          "Commercial & industrial rooftop solar developer with O&M platform.",
        thesisBullets: [
          "Corporate decarbonization commitments drive demand",
          "Recurring O&M and monitoring revenue",
          "Attractive project IRRs with ITC support",
          "Pipeline of shovel-ready C&I sites",
        ],
        riskBullets: [
          "Policy / ITC longevity risk",
          "Interconnection queue delays",
          "Panel / inverter supply chain volatility",
          "Counterparty credit on offtakers",
        ],
      },
      {
        name: "VoltGrid Storage Partners",
        project: "Battery Storage",
        teaser:
          "Utility-scale battery storage platform with contracted offtake.",
        thesisBullets: [
          "Grid reliability needs support storage buildout",
          "Contracted revenue floor with merchant upside",
          "Proven EPC relationships reduce execution risk",
          "Portfolio diversification across ISOs",
        ],
        riskBullets: [
          "Battery degradation and replacement CapEx",
          "Merchant power price volatility",
          "Permitting and community opposition",
          "Technology / OEM concentration",
        ],
      },
      {
        name: "GreenLine Efficiency Co.",
        project: "Energy Efficiency Services",
        teaser:
          "Energy efficiency retrofit and ESCO services for commercial buildings.",
        thesisBullets: [
          "Shared-savings contracts align incentives",
          "Utility rebate programs improve project IRRs",
          "Recurring M&V and maintenance attach",
          "Large addressable building stock",
        ],
        riskBullets: [
          "Utility program funding changes",
          "Measurement & verification disputes",
          "Construction execution risk",
          "Customer CapEx deferral cycles",
        ],
      },
      {
        name: "AquaCycle Treatment Systems",
        project: "Water Infrastructure",
        teaser:
          "Industrial water treatment systems with recurring chemical/service revenue.",
        thesisBullets: [
          "Regulatory discharge requirements create stickiness",
          "Consumables and service drive recurring mix",
          "Industrial nearshoring expands plant CapEx",
          "High switching costs once installed",
        ],
        riskBullets: [
          "Chemical input cost inflation",
          "Long sales cycles to plant engineers",
          "Environmental liability exposure",
          "Customer concentration in heavy industry",
        ],
      },
    ],
  },
];

function pickWeighted<T extends { weight: number }>(items: T[]): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return items[items.length - 1]!;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function daysFromNow(days: number): number {
  return Date.now() + days * 24 * 60 * 60 * 1000;
}

function daysAgo(days: number): number {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

function buildFinancials(status: DealStatus) {
  const revenue = randInt(8_000_000, 180_000_000);
  const ebitdaMargin = 0.12 + Math.random() * 0.28;
  const ebitda = roundTo(revenue * ebitdaMargin, 0);
  const entryMultiple = 6 + Math.random() * 8;
  const purchasePrice = roundTo(ebitda * entryMultiple, 0);
  const leverage = 0.35 + Math.random() * 0.3;
  const debt = roundTo(purchasePrice * leverage, 0);
  const equity = purchasePrice - debt;
  const sponsorShare = 0.4 + Math.random() * 0.35;
  const sponsorEquity = roundTo(equity * sponsorShare, 0);
  const lpEquity = roundTo(equity - sponsorEquity, 0);
  const targetRaise = roundTo(lpEquity * (0.85 + Math.random() * 0.3), 0);
  const minInvestment = [50_000, 100_000, 250_000, 500_000, 1_000_000][
    randInt(0, 4)
  ]!;
  const targetIrr = roundTo(14 + Math.random() * 12, 1);
  const targetMoic = roundTo(1.8 + Math.random() * 1.7, 2);

  // Scale down raise for already-funded / exited deals
  const raiseMultiplier =
    status === "funded" || status === "exited"
      ? 1
      : status === "closing"
        ? 0.9 + Math.random() * 0.15
        : 1;

  return {
    revenue,
    ebitda,
    purchasePrice,
    debt,
    sponsorEquity,
    lpEquity,
    targetRaise: roundTo(targetRaise * raiseMultiplier, 0),
    minInvestment,
    targetIrr,
    targetMoic,
  };
}

function htmlList(title: string, bullets: string[]): string {
  const items = bullets.map((b) => `<li>${b}</li>`).join("");
  return `<h3>${title}</h3><ul>${items}</ul>`;
}

function buildDescription(
  company: string,
  sector: string,
  geography: string,
  dealType: string,
  financials: ReturnType<typeof buildFinancials>,
): string {
  return [
    `<p><strong>${company}</strong> is a ${sector.toLowerCase()} opportunity structured as a ${dealType.toLowerCase()} in ${geography}.</p>`,
    `<p>The business generates approximately <strong>$${(financials.revenue / 1_000_000).toFixed(1)}M</strong> of revenue and <strong>$${(financials.ebitda / 1_000_000).toFixed(1)}M</strong> of EBITDA. The contemplated enterprise value is approximately <strong>$${(financials.purchasePrice / 1_000_000).toFixed(1)}M</strong>.</p>`,
    `<p>This memorandum summarizes the opportunity for qualified investors evaluating a commitment alongside the sponsor.</p>`,
  ].join("");
}

function buildDeal(index: number) {
  const sector = SECTORS[index % SECTORS.length]!;
  const company = sector.companies[index % sector.companies.length]!;
  const variant = Math.floor(index / sector.companies.length) + 1;
  const dealType = sector.dealTypes[index % sector.dealTypes.length]!;
  const geography = GEOGRAPHIES[index % GEOGRAPHIES.length]!;
  const status = pickWeighted(STATUS_WEIGHTS).status;
  const visibility =
    status === "draft"
      ? "invite_only"
      : pickWeighted(VISIBILITY_WEIGHTS).visibility;
  const financials = buildFinancials(status);
  const holdPeriod = HOLD_PERIODS[index % HOLD_PERIODS.length]!;

  const projectLabel =
    variant === 1 ? company.project : `${company.project} ${variant}`;
  const name = `${projectLabel} — ${company.name}`;
  const slug = `${SEED_SLUG_PREFIX}${slugify(projectLabel)}-${slugify(company.name)}-${index + 1}`;

  const launchOffset =
    status === "coming_soon"
      ? randInt(7, 60)
      : status === "draft"
        ? randInt(30, 120)
        : -randInt(10, 400);
  const closeOffset =
    status === "exited"
      ? -randInt(30, 200)
      : status === "funded"
        ? -randInt(5, 90)
        : status === "closing"
          ? randInt(5, 45)
          : status === "live"
            ? randInt(30, 180)
            : randInt(60, 240);

  const launchDate =
    launchOffset >= 0 ? daysFromNow(launchOffset) : daysAgo(-launchOffset);
  const closeDate =
    closeOffset >= 0 ? daysFromNow(closeOffset) : daysAgo(-closeOffset);

  const thesis = htmlList("Investment Thesis", [
    ...company.thesisBullets,
    `Target hold period of ${holdPeriod} with underwritten IRR of ~${financials.targetIrr}%`,
    `Capital structure contemplates ~$${(financials.debt / 1_000_000).toFixed(1)}M of debt and ~$${(financials.lpEquity / 1_000_000).toFixed(1)}M of LP equity`,
  ]);

  const risks = htmlList("Key Risks", company.riskBullets);

  return {
    id: randomUUID(),
    name,
    slug,
    description: buildDescription(
      company.name,
      sector.sector,
      geography,
      dealType,
      financials,
    ),
    teaser_summary: company.teaser,
    sector: sector.sector,
    geography,
    deal_type: dealType,
    target_raise: financials.targetRaise,
    min_investment: financials.minInvestment,
    target_irr: financials.targetIrr,
    target_moic: financials.targetMoic,
    target_company: company.name,
    revenue: financials.revenue,
    ebitda: financials.ebitda,
    hold_period: holdPeriod,
    investment_thesis: thesis,
    risks,
    purchase_price: financials.purchasePrice,
    debt: financials.debt,
    sponsor_equity: financials.sponsorEquity,
    lp_equity: financials.lpEquity,
    status,
    visibility,
    cover_image_url: null,
    launch_date: launchDate,
    close_date: closeDate,
    created_at: daysAgo(randInt(1, 500)),
    updated_at: Date.now(),
  };
}

function main() {
  const dbPath = resolveLocalD1Path();
  if (!dbPath) {
    console.error(
      "Local D1 database not found. Run: bun run db:migrate:local",
    );
    process.exit(1);
  }

  console.log(`Using D1 database:\n  ${dbPath}`);

  const db = new Database(dbPath);
  db.exec("PRAGMA foreign_keys = ON;");

  if (REPLACE) {
    const deleted = db
      .query("DELETE FROM deal WHERE slug LIKE ?")
      .run(`${SEED_SLUG_PREFIX}%`);
    console.log(`Removed ${deleted.changes} prior seed deals`);
  }

  const insert = db.prepare(`
    INSERT INTO deal (
      id, name, slug, description, teaser_summary,
      sector, geography, deal_type,
      target_raise, min_investment, target_irr, target_moic,
      target_company, revenue, ebitda, hold_period,
      investment_thesis, risks,
      purchase_price, debt, sponsor_equity, lp_equity,
      status, visibility, cover_image_url,
      launch_date, close_date, created_at, updated_at
    ) VALUES (
      $id, $name, $slug, $description, $teaser_summary,
      $sector, $geography, $deal_type,
      $target_raise, $min_investment, $target_irr, $target_moic,
      $target_company, $revenue, $ebitda, $hold_period,
      $investment_thesis, $risks,
      $purchase_price, $debt, $sponsor_equity, $lp_equity,
      $status, $visibility, $cover_image_url,
      $launch_date, $close_date, $created_at, $updated_at
    )
  `);

  const deals = Array.from({ length: DEAL_COUNT }, (_, i) => buildDeal(i));

  const tx = db.transaction((rows: typeof deals) => {
    for (const deal of rows) {
      insert.run({
        $id: deal.id,
        $name: deal.name,
        $slug: deal.slug,
        $description: deal.description,
        $teaser_summary: deal.teaser_summary,
        $sector: deal.sector,
        $geography: deal.geography,
        $deal_type: deal.deal_type,
        $target_raise: deal.target_raise,
        $min_investment: deal.min_investment,
        $target_irr: deal.target_irr,
        $target_moic: deal.target_moic,
        $target_company: deal.target_company,
        $revenue: deal.revenue,
        $ebitda: deal.ebitda,
        $hold_period: deal.hold_period,
        $investment_thesis: deal.investment_thesis,
        $risks: deal.risks,
        $purchase_price: deal.purchase_price,
        $debt: deal.debt,
        $sponsor_equity: deal.sponsor_equity,
        $lp_equity: deal.lp_equity,
        $status: deal.status,
        $visibility: deal.visibility,
        $cover_image_url: deal.cover_image_url,
        $launch_date: deal.launch_date,
        $close_date: deal.close_date,
        $created_at: deal.created_at,
        $updated_at: deal.updated_at,
      });
    }
  });

  tx(deals);

  const byStatus = db
    .query(
      `SELECT status, COUNT(*) as c FROM deal WHERE slug LIKE ? GROUP BY status ORDER BY c DESC`,
    )
    .all(`${SEED_SLUG_PREFIX}%`) as Array<{ status: string; c: number }>;

  const bySector = db
    .query(
      `SELECT sector, COUNT(*) as c FROM deal WHERE slug LIKE ? GROUP BY sector ORDER BY c DESC`,
    )
    .all(`${SEED_SLUG_PREFIX}%`) as Array<{ sector: string; c: number }>;

  const total = db
    .query(`SELECT COUNT(*) as c FROM deal WHERE slug LIKE ?`)
    .get(`${SEED_SLUG_PREFIX}%`) as { c: number };

  console.log(`\nSeeded ${total.c} deals`);
  console.log("\nBy status:");
  for (const row of byStatus) console.log(`  ${row.status}: ${row.c}`);
  console.log("\nBy sector:");
  for (const row of bySector) console.log(`  ${row.sector}: ${row.c}`);
  console.log("\nDone. Refresh /deals to see Available Investments.");
}

main();
