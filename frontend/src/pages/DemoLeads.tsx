import React from 'react';
import Demo, { DemoMessage } from './Demo';

const DemoLeads: React.FC = () => {
  // Hardcoded demo messages for qualified leads
  const demoMessages: DemoMessage[] = [
    {
      id: '1',
      role: "agent",
      content: "Hi! What questions do you have about your leads data?",
      timestamp: new Date('2024-01-15T14:00:00Z')
    },
    {
      id: '2',
      role: "user",
      content: "Show me qualified leads from the last 30 days with their conversion potential.",
      timestamp: new Date('2024-01-15T14:01:00Z')
    },
    {
      id: '3',
      role: "agent",
      content: "I'll analyze your qualified leads from the last 30 days. Let me pull the data from your CRM and score them based on engagement metrics, company size, and lead source quality.\n\nHere are your top qualified leads with conversion potential:",
      timestamp: new Date('2024-01-15T14:01:30Z')
    },
    {
      id: '4',
      role: "agent",
      content: "Here are your top qualified leads from the last 30 days:\n\n" +
      "**High Conversion Potential:**\n" +
      "• TechCorp Solutions - 95% score\n" +
      "• DataFlow Inc - 92% score\n" +
      "• CloudSync Ltd - 88% score\n\n" +
      "**Medium Conversion Potential:**\n" +
      "• StartupX - 75% score\n" +
      "• InnovateCo - 72% score",
      actions: ['View Code', 'See All'],
      attachment: [
        {
          type: 'table',
          title: 'Qualified Leads - Last 30 Days (by conversion score)',
          rows: [
            ['TechCorp Solutions', 'Enterprise', 'Webinar', 95, '$50K'],
            ['DataFlow Inc', 'Mid-Market', 'Demo Request', 92, '$35K'],
            ['CloudSync Ltd', 'Enterprise', 'Website Form', 88, '$75K'],
            ['StartupX', 'SMB', 'Email Campaign', 75, '$15K'],
            ['InnovateCo', 'Mid-Market', 'Referral', 72, '$25K'],
            ['FlexiSoft', 'SMB', 'Cold Outreach', 68, '$12K'],
            ['MegaCorp', 'Enterprise', 'Trade Show', 65, '$100K'],
          ],
          columns: ['Company', 'Segment', 'Source', 'Score', 'Potential Value']
        },
      ],
      code: `
async function analyzeQualifiedLeads(context: { __userData: Record<string, any[]> }): Promise<Output> {
  const data = context.__userData;
  
  const leads = data['Leads'];
  const activities = data['Activities'];
  
  if (!leads || !activities) {
    return { error: 'Lead data not found' };
  }
  
  // Score leads based on engagement, company size, and source quality
  const scoredLeads = leads.map(lead => {
    const engagement = calculateEngagement(lead.id, activities);
    const companyScore = getCompanyScore(lead.companySize);
    const sourceScore = getSourceScore(lead.source);
    
    const totalScore = (engagement * 0.4) + (companyScore * 0.3) + (sourceScore * 0.3);
    
    return {
      ...lead,
      score: Math.round(totalScore),
      potentialValue: estimateValue(lead.companySize, totalScore)
    };
  });
  
  return scoredLeads.filter(lead => lead.score >= 65).sort((a, b) => b.score - a.score);
}
      `,
      timestamp: new Date('2024-01-15T14:02:30Z')
    },
    {
      id: '5',
      role: "user",
      content: "What's the source breakdown for these qualified leads?",
      timestamp: new Date('2024-01-15T14:03:00Z')
    },
    {
      id: '6',
      role: "agent",
      content: "Here's the source breakdown for your qualified leads:\n\n" +
      "**Lead Sources (Last 30 Days):**\n" +
      "• Webinar Attendees: 28% (highest conversion rate)\n" +
      "• Demo Requests: 22% (high intent signals)\n" +
      "• Website Forms: 18% (organic interest)\n" +
      "• Referrals: 15% (high trust factor)\n" +
      "• Email Campaigns: 12% (nurture success)\n" +
      "• Trade Shows: 3% (face-to-face connections)\n" +
      "• Cold Outreach: 2% (lowest but still qualified)",
      actions: ['View Code', 'See All'],
      attachment: [
        {
          type: 'table',
          title: 'Lead Source Performance Analysis',
          rows: [
            ['Webinar', 28, 18, 85, 'google analytics'],
            ['Demo Request', 22, 15, 92, 'salesforce'],
            ['Website Form', 18, 12, 78, 'google analytics'],
            ['Referral', 15, 11, 88, 'salesforce'],
            ['Email Campaign', 12, 8, 73, 'hubspot'],
            ['Trade Show', 3, 2, 82, 'salesforce'],
            ['Cold Outreach', 2, 1, 65, 'salesforce'],
          ],
          columns: ['Source', 'Volume (%)', 'Qualified Count', 'Avg Score', 'Data source']
        }
      ],
      code: `
async function analyzeLeadSources(context: { __userData: Record<string, any[]> }): Promise<Output> {
  const data = context.__userData;
  
  const leads = data['Leads'];
  if (!leads) {
    return { error: 'No leads data found' };
  }
  
  const sourceStats = leads.reduce((acc, lead) => {
    if (!acc[lead.source]) {
      acc[lead.source] = { count: 0, totalScore: 0, qualified: 0 };
    }
    
    acc[lead.source].count++;
    acc[lead.source].totalScore += lead.score;
    
    if (lead.score >= 65) {
      acc[lead.source].qualified++;
    }
    
    return acc;
  }, {});
  
  return Object.entries(sourceStats).map(([source, stats]) => ({
    source,
    volume: Math.round((stats.count / leads.length) * 100),
    qualified: stats.qualified,
    avgScore: Math.round(stats.totalScore / stats.count)
  })).sort((a, b) => b.volume - a.volume);
}
      `,
      timestamp: new Date('2024-01-15T14:04:00Z')
    },
    {
      id: '7',
      role: "user",
      content: "Create a follow-up sequence for the top 3 leads.",
      timestamp: new Date('2024-01-15T14:05:00Z')
    },
    {
      id: '8',
      role: "agent",
      content: "I've created personalized follow-up sequences for your top 3 qualified leads:\n\n" +
      "**TechCorp Solutions (95% score)**\n" +
      "• Day 1: Executive briefing on ROI analysis\n" +
      "• Day 3: Custom demo focused on their tech stack\n" +
      "• Day 7: Case study from similar enterprise client\n\n" +
      "**DataFlow Inc (92% score)**\n" +
      "• Day 1: Technical deep-dive call\n" +
      "• Day 5: Integration timeline proposal\n" +
      "• Day 10: Pilot program discussion\n\n" +
      "**CloudSync Ltd (88% score)**\n" +
      "• Day 1: Security compliance documentation\n" +
      "• Day 4: Scalability roadmap presentation\n" +
      "• Day 8: Pricing options tailored to their growth",
      timestamp: new Date('2024-01-15T14:06:00Z')
    },
    {
        id: '9',
        role: "user",
        content: "Add these to Apollo.",
        timestamp: new Date('2024-01-15T14:07:00Z')
    },
    {
        id: '10',
        role: "agent",
        content: "I've added the follow-up sequences to your Apollo dashboard. You can view them in the 'Follow-ups' section.",
        timestamp: new Date('2024-01-15T14:08:00Z')
    }
  ];

  return <Demo title="Qualified Leads" messages={demoMessages} />;
};

export default DemoLeads; 