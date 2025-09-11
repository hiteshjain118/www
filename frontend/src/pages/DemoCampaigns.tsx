import React from 'react';
import Demo, { DemoMessage } from './Demo';

const DemoCampaigns: React.FC = () => {
  // Hardcoded demo messages for campaign CAC analysis
  const demoMessages: DemoMessage[] = [
    {
      id: '1',
      role: "agent",
      content: "Hi! What would you like to analyze about your marketing campaigns?",
      timestamp: new Date('2024-01-10T09:00:00Z')
    },
    {
      id: '2',
      role: "user",
      content: "Which campaigns drove the best CAC last quarter?",
      timestamp: new Date('2024-01-10T09:01:00Z')
    },
    {
      id: '3',
      role: "agent",
      content: "I'll analyze your campaign performance from Q2 2025 focusing on Customer Acquisition Cost (CAC). Let me pull data from your marketing platforms and calculate CAC by dividing total campaign spend by new customers acquired.\n\nAnalyzing campaigns across Google Ads, Facebook, LinkedIn, and email marketing...",
      timestamp: new Date('2024-01-10T09:01:30Z')
    },
    {
      id: '4',
      role: "agent",
      content: "Here are your best performing campaigns by CAC in Q2 2025:\n\n" +
      "**Top Performers (Lowest CAC):**\n" +
      "• **LinkedIn - Enterprise Demo Campaign**: $127 CAC\n" +
      "• **Google Ads - Intent Keywords**: $156 CAC\n" +
      "• **Email - Product Launch Sequence**: $89 CAC\n" +
      "• **Facebook - Lookalike Audience**: $198 CAC\n\n" +
      "**Key Insights:**\n" +
      "• Email campaigns had 43% lower CAC than average\n" +
      "• LinkedIn enterprise targeting was highly efficient\n" +
      "• Intent-based Google keywords outperformed broad match by 2.3x",
      actions: ['View Code', 'See All'],
      attachment: [
        {
          type: 'table',
          title: 'Q2 2025 Campaign Performance by CAC (best to worst)',
          rows: [
            ['Email - Product Launch', 'Email', '$15,680', 176, '$89', '8.2%'],
            ['LinkedIn - Enterprise Demo', 'LinkedIn', '$28,448', 224, '$127', '12.1%'],
            ['Google - Intent Keywords', 'Google Ads', '$39,936', 256, '$156', '15.3%'],
            ['Facebook - Lookalike', 'Facebook', '$41,382', 209, '$198', '11.8%'],
            ['Google - Broad Match', 'Google Ads', '$52,920', 147, '$360', '7.2%'],
            ['Facebook - Interest Targeting', 'Facebook', '$31,185', 78, '$400', '4.1%'],
            ['LinkedIn - Cold Outreach', 'LinkedIn', '$18,750', 42, '$446', '2.8%'],
          ],
          columns: ['Campaign', 'Channel', 'Spend', 'Customers', 'CAC', 'Conv Rate']
        },
      ],
      code: `
async function analyzeCampaignCAC(context: { __userData: Record<string, any[]> }): Promise<Output> {
  const data = context.__userData;
  
  const campaigns = data['Campaigns'];
  const customers = data['Customers'];
  
  if (!campaigns || !customers) {
    return { error: 'Campaign or customer data not found' };
  }
  
  // Calculate CAC for each campaign
  const campaignMetrics = campaigns.map(campaign => {
    // Find customers acquired from this campaign
    const campaignCustomers = customers.filter(customer => 
      customer.source === campaign.id && 
      customer.acquired_date >= campaign.start_date &&
      customer.acquired_date <= campaign.end_date
    );
    
    const customerCount = campaignCustomers.length;
    const totalSpend = campaign.total_spend;
    const cac = customerCount > 0 ? totalSpend / customerCount : 0;
    const conversionRate = campaign.impressions > 0 ? (customerCount / campaign.clicks) * 100 : 0;
    
    return {
      campaign: campaign.name,
      channel: campaign.channel,
      spend: totalSpend,
      customers: customerCount,
      cac: Math.round(cac),
      conversionRate: Math.round(conversionRate * 10) / 10
    };
  });
  
  // Sort by CAC (ascending - best performing first)
  return campaignMetrics
    .filter(metric => metric.customers > 0)
    .sort((a, b) => a.cac - b.cac);
}
      `,
      timestamp: new Date('2024-01-10T09:02:30Z')
    },
    {
      id: '5',
      role: "user",
      content: "What drove the success of the email campaign?",
      timestamp: new Date('2024-01-10T09:03:00Z')
    },
    {
      id: '6',
      role: "agent",
      content: "The email campaign's exceptional CAC performance was driven by several factors:\n\n" +
      "**Key Success Factors:**\n" +
      "• **Warm Audience**: Targeted existing newsletter subscribers (2.3x higher conversion)\n" +
      "• **Perfect Timing**: Launched during product announcement (48% open rate)\n" +
      "• **Segmented Messaging**: Personalized content by user behavior\n" +
      "• **Multi-touch Sequence**: 5-email nurture sequence over 2 weeks\n\n" +
      "**Performance Metrics:**\n" +
      "• Open Rate: 48.2% (vs 22% industry avg)\n" +
      "• Click Rate: 12.1% (vs 3.1% industry avg)\n" +
      "• Cost per Click: $0.73 (vs $2.15 paid average)",
      actions: ['View Code', 'See All'],
      attachment: [
        {
          type: 'table',
          title: 'Email Campaign Performance Breakdown',
          rows: [
            ['Email 1 - Announcement', 'Day 0', '48.2%', '12.1%', 45, '$15'],
            ['Email 2 - Features Deep Dive', 'Day 3', '42.8%', '8.7%', 32, '$18'],
            ['Email 3 - Customer Stories', 'Day 7', '39.1%', '9.2%', 28, '$22'],
            ['Email 4 - Limited Time Offer', 'Day 10', '44.6%', '15.3%', 52, '$12'],
            ['Email 5 - Final Reminder', 'Day 14', '37.2%', '11.8%', 19, '$25'],
          ],
          columns: ['Email', 'Send Day', 'Open Rate', 'Click Rate', 'Conversions', 'Cost/Conv']
        }
      ],
      code: `
async function analyzeEmailSequence(context: { __userData: Record<string, any[]> }): Promise<Output> {
  const data = context.__userData;
  
  const emailMetrics = data['EmailMetrics'];
  const conversions = data['Conversions'];
  
  if (!emailMetrics || !conversions) {
    return { error: 'Email metrics not found' };
  }
  
  const sequencePerformance = emailMetrics.map(email => {
    const emailConversions = conversions.filter(conv => 
      conv.source_email_id === email.id
    );
    
    const conversionCount = emailConversions.length;
    const costPerConversion = conversionCount > 0 ? email.cost / conversionCount : 0;
    
    return {
      email: email.subject,
      sendDay: \`Day \${email.sequence_day}\`,
      openRate: \`\${(email.opens / email.sent * 100).toFixed(1)}%\`,
      clickRate: \`\${(email.clicks / email.sent * 100).toFixed(1)}%\`,
      conversions: conversionCount,
      costPerConversion: \`$\${Math.round(costPerConversion)}\`
    };
  });
  
  return sequencePerformance.sort((a, b) => a.sequence_day - b.sequence_day);
}
      `,
      timestamp: new Date('2024-01-10T09:04:00Z')
    },
    {
      id: '7',
      role: "user",
      content: "How can we replicate this success across other channels?",
      timestamp: new Date('2024-01-10T09:05:00Z')
    },
    {
      id: '8',
      role: "agent",
      content: "Based on the email campaign success, here are actionable strategies for other channels:\n\n" +
      "**For LinkedIn Campaigns:**\n" +
      "• Target warm connections and past website visitors\n" +
      "• Create sequential messaging campaigns (5-touch sequence)\n" +
      "• Use account-based targeting for enterprise prospects\n\n" +
      "**For Google Ads:**\n" +
      "• Build remarketing audiences based on email engagement\n" +
      "• Create sequential ad campaigns matching email timing\n" +
      "• Focus budget on high-intent keywords that drove conversions\n\n" +
      "**For Facebook:**\n" +
      "• Create lookalike audiences from email converters\n" +
      "• Test video content similar to email storytelling format\n" +
      "• Implement frequency capping to match email cadence",
      timestamp: new Date('2024-01-10T09:06:00Z')
    },
  ];

  return <Demo title="Campaign CAC Analysis" messages={demoMessages} />;
};

export default DemoCampaigns; 