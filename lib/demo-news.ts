export interface FramingDistribution {
  left: number;
  center: number;
  right: number;
}

export interface HomeArticle {
  id: string;
  title: string;
  category: string;
  country: string;
  imageUrl: string;
  imageAlt: string;
  sourceCount: number;
  bias: FramingDistribution;
}

export interface RelatedStory {
  id: string;
  title: string;
  category: string;
  country: string;
  imageUrl: string;
  imageAlt: string;
  publishedLabel: string;
  publishedDate: string;
  readTime: string;
}

export interface SourceBreakdownItem {
  name: string;
  framing: "Left" | "Center" | "Right";
}

export interface FeaturedArticle extends HomeArticle {
  author: string;
  publishedLabel: string;
  publishedDate: string;
  readTime: string;
  imageCaption: string;
  imageCredit: string;
  paragraphs: string[];
  summaryGeneratedLabel: string;
  summaryGeneratedDate: string;
  summaryReadTime: string;
  summaryBullets: string[];
  sentimentLabel: "positive" | "neutral" | "negative";
  confidence: number;
  framingNotes: string;
  loadedTerms: string[];
  disclaimer: string;
  sources: SourceBreakdownItem[];
  relatedStories: RelatedStory[];
}

export const featuredArticle: FeaturedArticle = {
  id: "peace-proposal",
  category: "Politics",
  country: "United States",
  title: "Trump Sends Iran Revised Peace Proposal With Tougher Terms: Report",
  imageUrl:
    "https://upload.wikimedia.org/wikipedia/commons/5/56/Donald_Trump_official_portrait.jpg",
  imageAlt: "Official portrait of Donald Trump",
  sourceCount: 12,
  bias: { left: 20, center: 31, right: 49 },
  author: "David Morgan",
  publishedLabel: "May 31, 2026",
  publishedDate: "2026-05-31",
  readTime: "12 min read",
  imageCaption:
    "President Donald Trump in the Cabinet Room at the White House, Washington, D.C., May 30, 2026.",
  imageCredit: "Photo: Andrew Harnik/Getty Images",
  paragraphs: [
    "The Trump administration has sent Iran a revised nuclear deal proposal that includes tougher terms on uranium enrichment and stronger verification measures, according to a report published Saturday.",
    "The new proposal, delivered through intermediaries in Oman, requires Iran to halt all uranium enrichment on its soil and ship its stockpile of enriched uranium out of the country. It also demands unrestricted access for international inspectors to all Iranian nuclear facilities, including military sites.",
    "“This is a take-it-or-leave-it proposal,” a senior administration official told The Wall Street Journal. “The President wants a deal, but he will not accept a weak agreement that puts America or our allies at risk.”",
    "Iran has not yet officially responded to the proposal. However, Iranian Foreign Minister Hossein Amir-Abdollahian said last week that any deal must respect Iran's right to peaceful nuclear energy and include the lifting of all U.S. sanctions.",
    "The revised proposal comes after several rounds of indirect talks between U.S. and Iranian officials failed to produce a breakthrough. The Trump administration has warned that if diplomacy fails, it is prepared to take other action to prevent Iran from obtaining a nuclear weapon.",
    "European allies have urged both sides to continue negotiations. “We believe diplomacy is still the best path forward,” said a spokesperson for the EU's foreign policy chief.",
    "Israel, which has long opposed the 2015 nuclear deal with Iran, praised the Trump administration's tougher stance. “This is the kind of leadership that was missing in the past,” said Israeli Prime Minister Benjamin Netanyahu in a statement.",
    "The fate of the proposal now rests with Iran, as global attention remains focused on whether a new nuclear agreement can be reached—or if tensions will escalate further.",
  ],
  summaryGeneratedLabel: "Generated May 31, 2026",
  summaryGeneratedDate: "2026-05-31",
  summaryReadTime: "3 min read",
  summaryBullets: [
    "The Trump administration has sent Iran a revised nuclear deal proposal with tougher terms, including a complete halt to uranium enrichment and the removal of enriched uranium stockpiles.",
    "The proposal also demands unrestricted inspector access to all nuclear sites, including military facilities.",
    "Iran has not responded officially but says any deal must respect its right to peaceful nuclear energy and include sanctions relief.",
    "The U.S. warns it is prepared to take other action if diplomacy fails, while European allies urge continued negotiations.",
    "Israel supports the tougher stance, praising the administration's determination to prevent Iran from acquiring nuclear weapons.",
  ],
  sentimentLabel: "neutral",
  confidence: 0.82,
  framingNotes:
    "Coverage emphasizes the administration's tougher negotiating position and national-security rationale while also including Iran's stated conditions and European calls for diplomacy.",
  loadedTerms: ["tougher stance", "weak agreement", "at risk"],
  disclaimer:
    "AI-generated analysis can make mistakes. Political framing is an estimate based only on the article text and should not be treated as objective fact.",
  sources: [
    { name: "Fox News", framing: "Right" },
    { name: "The Wall Street Journal", framing: "Center" },
    { name: "Reuters", framing: "Center" },
    { name: "BBC", framing: "Center" },
    { name: "CNN", framing: "Left" },
    { name: "The New York Times", framing: "Center" },
    { name: "The Washington Post", framing: "Center" },
    { name: "Newsmax", framing: "Right" },
  ],
  relatedStories: [
    {
      id: "iran-maximum-pressure",
      category: "World",
      country: "Middle East",
      title: "Iran Says It Will Not Negotiate Under ‘Maximum Pressure’",
      imageUrl:
        "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=480&q=80",
      imageAlt: "Flags flying outside a government building",
      publishedLabel: "May 29, 2026",
      publishedDate: "2026-05-29",
      readTime: "8 min read",
    },
    {
      id: "diplomacy-iran",
      category: "Politics",
      country: "United States",
      title: "Bipartisan Group Urges Diplomacy With Iran",
      imageUrl:
        "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=480&q=80",
      imageAlt: "Legislative chamber prepared for a government session",
      publishedLabel: "May 26, 2026",
      publishedDate: "2026-05-26",
      readTime: "5 min read",
    },
    {
      id: "iranian-entities-sanctions",
      category: "Politics",
      country: "United States",
      title: "US Sanctions More Iranian Entities Over Nuclear Program",
      imageUrl:
        "https://images.unsplash.com/photo-1589994965851-a8f479c573a9?auto=format&fit=crop&w=480&q=80",
      imageAlt: "Neoclassical government building with tall columns",
      publishedLabel: "May 28, 2026",
      publishedDate: "2026-05-28",
      readTime: "6 min read",
    },
    {
      id: "iran-nuclear-deal",
      category: "Science",
      country: "Nuclear Policy",
      title: "What's in the 2015 Iran Nuclear Deal?",
      imageUrl:
        "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=480&q=80",
      imageAlt: "Engineers reviewing plans inside a research facility",
      publishedLabel: "May 25, 2026",
      publishedDate: "2026-05-25",
      readTime: "10 min read",
    },
    {
      id: "oman-talks",
      category: "World",
      country: "Middle East",
      title: "Oman Hosts Another Round of US-Iran Nuclear Talks",
      imageUrl:
        "https://images.unsplash.com/photo-1533130061792-64b345e4a833?auto=format&fit=crop&w=480&q=80",
      imageAlt: "City buildings beneath a clear sky",
      publishedLabel: "May 27, 2026",
      publishedDate: "2026-05-27",
      readTime: "7 min read",
    },
    {
      id: "israel-red-line",
      category: "World",
      country: "Middle East",
      title: "Israel Reaffirms Red Line Over Iranian Nuclear Program",
      imageUrl:
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=480&q=80",
      imageAlt: "Sunlight breaking through a dramatic sky",
      publishedLabel: "May 24, 2026",
      publishedDate: "2026-05-24",
      readTime: "6 min read",
    },
  ],
};

export const homeArticles: HomeArticle[] = [
  featuredArticle,
  {
    id: "grapes-superfood",
    category: "Health",
    country: "United States",
    title: "Researchers Make Case for Grapes as a ‘Superfood’ After Review of Health Evidence",
    imageUrl:
      "https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Dark grapes ripening on a sunlit vine",
    sourceCount: 7,
    bias: { left: 18, center: 42, right: 40 },
  },
  {
    id: "cern-physics",
    category: "Science",
    country: "Switzerland",
    title: "CERN Finds High-Significance Hint of Physics Beyond Standard Model",
    imageUrl:
      "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Engineer walking through an industrial research facility",
    sourceCount: 8,
    bias: { left: 16, center: 62, right: 22 },
  },
  {
    id: "nicaragua-leader",
    category: "World",
    country: "Nicaragua",
    title: "Indigenous Leader Brooklyn Rivera Dies in Nicaragua After Nearly 3 Years of Detention",
    imageUrl:
      "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Public figure addressing a crowd outdoors",
    sourceCount: 63,
    bias: { left: 54, center: 28, right: 18 },
  },
  {
    id: "security-council",
    category: "World",
    country: "Middle East",
    title: "UN Security Council to Hold Emergency Meeting as Israel Pushes Deeper into Lebanon",
    imageUrl:
      "https://images.unsplash.com/photo-1533130061792-64b345e4a833?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Damaged concrete buildings in a conflict zone",
    sourceCount: 15,
    bias: { left: 22, center: 33, right: 45 },
  },
  {
    id: "oil-prices",
    category: "Business",
    country: "Global",
    title: "Oil Prices Dip as OPEC+ Considers Output Increase Amid Weak Demand",
    imageUrl:
      "https://images.unsplash.com/photo-1545262810-77515befe149?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Fuel pump at a service station",
    sourceCount: 11,
    bias: { left: 23, center: 50, right: 27 },
  },
  {
    id: "starship-flight",
    category: "Technology",
    country: "United States",
    title: "SpaceX Launches Starship Test Flight in Milestone for Mars Program",
    imageUrl:
      "https://images.unsplash.com/photo-1517976547714-720226b864c1?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Rocket lifting off through clouds",
    sourceCount: 9,
    bias: { left: 12, center: 45, right: 43 },
  },
  {
    id: "apple-ai",
    category: "Business",
    country: "United States",
    title: "Apple Unveils AI-Powered Features Across iPhone, iPad and Mac",
    imageUrl:
      "https://images.unsplash.com/photo-1585184394271-4c0a47dc59c9?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Apple logo on a glass-fronted building",
    sourceCount: 10,
    bias: { left: 15, center: 40, right: 45 },
  },
  {
    id: "hottest-years",
    category: "Climate",
    country: "Global",
    title: "2025 on Track to Be Among Top 3 Hottest Years, EU Climate Service Says",
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Bright sunlight breaking through a hazy sky",
    sourceCount: 14,
    bias: { left: 33, center: 34, right: 33 },
  },
  {
    id: "fed-rates",
    category: "Economy",
    country: "United States",
    title: "Fed Holds Rates Steady, Signals Caution on Inflation and Growth Outlook",
    imageUrl:
      "https://images.unsplash.com/photo-1589994965851-a8f479c573a9?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Neoclassical government building with tall columns",
    sourceCount: 13,
    bias: { left: 30, center: 45, right: 25 },
  },
  {
    id: "champions-league",
    category: "Soccer",
    country: "Europe",
    title: "Real Madrid Win Champions League After Comeback Victory in Final",
    imageUrl:
      "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Soccer player celebrating in a stadium",
    sourceCount: 26,
    bias: { left: 10, center: 20, right: 70 },
  },
  {
    id: "western-wildfires",
    category: "Environment",
    country: "Canada",
    title: "Wildfires Force Thousands to Evacuate Across Western Canada",
    imageUrl:
      "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Fire burning through a forest landscape",
    sourceCount: 17,
    bias: { left: 27, center: 33, right: 40 },
  },
];
