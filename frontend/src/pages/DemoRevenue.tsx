import React from 'react';
import Demo, { DemoMessage } from './Demo';

const DemoRevenue: React.FC = () => {
  // Hardcoded demo messages for revenue analysis
  const demoMessages: DemoMessage[] = [
    {
      id: '1',
      role: "agent",
      content: "Hi! What data questions do you have?",
      timestamp: new Date('2024-01-15T10:00:00Z')
    },
    {
      id: '2',
      role: "user",
      content: "Show me top 5 customers by revenue for month of June.",
      timestamp: new Date('2024-01-15T10:01:00Z')
    },
    {
      id: '3',
      role: "agent",
      content: "To find the top 5 customers by revenue for the month of June, we can use the \"Invoice\" table from your \"Quickbooks\" data. Here's the query plan:\n\n" +
      "1. **Table**: Invoice\n" +
      "2. **Fields**:\n" +
      "- CustomerRef.name (to identify the customer)\n" +
      "- TotalAmt (to calculate the revenue)\n" +
      "- TxnDate (to filter for the month of June)\n" +
      "We'll filter the data to only include invoices within the month of June. \n" +
      "Let's proceed with this plan. Please confirm if you'd like to proceed or if there are any additional filters or requirements you want to include.",
      timestamp: new Date('2024-01-15T10:01:30Z')
    },
    {
      id: '4',
      role: "user",
      content: "Yes, go ahead",
      timestamp: new Date('2024-01-15T10:02:00Z')
    },
    {
      id: '5',
      role: "agent",
      content: "Here are the top 5 customers by revenue for the month of June:\n\n" +
      "1. **Cool Cars**: $2,194\n" +
      "2. **John Melton**: $750\n" +
      "3. **Travis Waldron**: $681.27\n" +
      "4. **Amy's Bird Sanctuary**: $567\n" +
      "5. **55 Twin Lane**: $54\n",
      actions: ['View Code', 'See All'],
      attachment: [
        {
          type: 'table',
          title: 'June Customers by Revenue (high to low revenue)',
          rows: [
            ['Cool Cars', 2194],
            ['John Melton', 750],
            ['Travis Waldron', 681.27],
            ['Amy\'s Bird Sanctuary', 567],
            ['55 Twin Lane', 54],
            ['Fred\'s Auto', 40],
            ['The Greenhouse', 30],
          ],
          columns: ['Customer', 'Revenue']
        },
      ],
      code: `
async function run(context: { __userData: Record<string, any[]> }): Promise<Output> {
  const data = context.__userData;
  
  const customers = data['Invoice'];
  if (!customers) {
    return { error: 'No customers found' };
  }
  return customers.sort((a, b) => b.TotalAmt - a.TotalAmt);
}
      `,
      timestamp: new Date('2024-01-15T10:02:30Z')
    },
    {
      id: '6',
      role: "agent",
      content: "Is there anything else you'd like to do?",
      timestamp: new Date('2024-01-15T10:03:00Z')
    },
    {
      id: '7',
      role: "user",
      content: "what did Cool Cars buy?",
      timestamp: new Date('2024-01-15T10:03:30Z')
    },
    {
      id: '8',
      role: "agent",
      content: "To answer your question about what \"Cool Cars\" purchased, I will extract the invoice details specifically for \"Cool Cars\" from the data we retrieved for June. Let's proceed with that.",
      timestamp: new Date('2024-01-15T10:04:00Z')
    },
    {
      id: '9',
      role: "agent",
      content: "\"Cool Cars\" made the following top 4 purchases in June:\n\n" +
      "1. **Sod**: $1,750\n" +
      "2. **Installation Hours**: $400\n" +
      "3. **Sprinkler Pipes**: $14\n" +
      "4. **Sprinkler Heads**: $12\n",
      actions: ['View Code', 'See All'],
      attachment: [
        {
          type: 'table',
          title: 'June Purchases by Cool Cars(high to low amount)',
          rows: [
              ['Sod', 1750],
              ['Installation Hours', 400],
              ['Sprinkler Pipes', 14],
              ['Sprinkler Heads', 12],
              ['Bolts', 10],
              ['Screws', 8]
          ],
          columns: ['Item', 'Amount']
        }
      ],
      code: `
async function run(context: { __userData: Record<string, any[]> }): Promise<Output> {
  const data = context.__userData;
  
  const customers = data['Invoice'];
  if (!customers) {
    return { error: 'No customers found' };
  }
  return customers.sort((a, b) => b.TotalAmt - a.TotalAmt);
}
      `,
      timestamp: new Date('2024-01-15T10:04:30Z')
    },
    {
      id: '10',
      role: "agent",
      content: "Is there anything else you'd like to do?",
      timestamp: new Date('2024-01-15T10:05:00Z')
    },
    {
      id: '11',
      role: "user",
      content: "Send this to me in an email.",
      timestamp: new Date('2024-01-15T10:05:30Z')
    },
    {
      id: '12',
      role: "agent",
      content: "I have sent the report to your email. Please check your inbox.",
      timestamp: new Date('2024-01-15T10:06:00Z')
    },
  ];

  return <Demo title="June revenue analysis" messages={demoMessages} />;
};

export default DemoRevenue; 