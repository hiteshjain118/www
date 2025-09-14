import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowTopRightOnSquareIcon,
  PlusIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  CubeIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  LockClosedIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';

interface Agent {
  id: string;
  name: string;
  description: string;
  icon: any;
  subdomain: string;
  features: string[];
  status: 'active' | 'coming-soon';
  type: 'my-agent' | 'community';
}

const Agents: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'community'>('community');



  // Community/Platform agents available to clone
  const communityAgents: Agent[] = [
    {
      id: 'pricing',
      name: 'Markup Detection Agent',
      description: 'Streamline your markups by getting a daily email report in your inbox showing the difference between your sales and purchases prices.',
      icon: CurrencyDollarIcon,
      subdomain: 'pa.coralbricks.ai',
      features: [
        'QuickBooks integration',
        'Your daily report',
        'Personalize email format',
        'Email reporting'
      ],
      status: 'coming-soon',
      type: 'community'
    },
    {
      id: 'outreach',
      name: 'Personalized Outreach Agent',
      description: 'Create personalized outreach campaigns and follow-up sequences based on customer behavior and interaction history.',
      icon: ChatBubbleLeftRightIcon,
      subdomain: 'outreach.coralbricks.ai',
      features: [
        'Sales data from Quickbooks',
        'Set upsell criteria',
        'Notify sales teams weekly through email'
      ],
      status: 'coming-soon',
      type: 'community'
    },
    {
      id: 'inventory',
      name: 'Low Inventory Alert',
      description: 'Automatically monitor inventory levels and detect when products are running low, with automated alerts in Asana and one-click ordering through Shopify.',
      icon: CubeIcon,
      subdomain: 'inventory.coralbricks.ai',
      features: [
        'Inventory data from Quickbooks',
        'Set re-order thresholds',
        'Low stock alerts in Asana',
        'One-click order with Shopify'
      ],
      status: 'coming-soon',
      type: 'community'
    },
    {
      id: 'concierge',
      name: 'Concierge Agent',
      description: 'Your personal AI assistant for customer service, appointment scheduling, and general business support with natural language processing.',
      icon: SparklesIcon,
      subdomain: 'concierge.coralbricks.ai',
      features: [
        '24/7 customer support',
        'Appointment scheduling',
        'Multi language processing',
        'Multi-channel integration'
      ],
      status: 'coming-soon',
      type: 'community'
    }
  ];

  const handleGoToAgent = (subdomain: string) => {
    // Route to Contact page
    window.location.href = '/contact';
  };

  const handleCloneAgent = (agentId: string) => {
    // Route to Contact page
    window.location.href = '/contact';
  };

  const handleJoinWaitlist = () => {
    // Route to Contact page
    window.location.href = '/contact';
  };

  const renderAgentCard = (agent: Agent, index: number) => (
    <motion.div
      key={agent.id}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
      className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 mb-6 transform hover:-translate-y-1"
    >
      <div className="p-6">
        {/* Header Row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-coral-500 to-brick-600 rounded-lg flex items-center justify-center">
              <agent.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{agent.name}</h3>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {agent.type === 'my-agent' && agent.status === 'active' && (
              <button
                onClick={() => handleGoToAgent(agent.subdomain)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-coral-600 to-brick-600 text-white rounded-lg font-medium hover:from-coral-700 hover:to-brick-700 transition-all duration-200"
              >
                <span>Manage</span>
                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
              </button>
            )}
            {agent.type === 'community' && agent.id !== 'concierge' && (
              <button
                onClick={() => handleCloneAgent(agent.id)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition-all duration-200"
              >
                <span>Clone</span>
                <PlusIcon className="w-4 h-4" />
              </button>
            )}
            {agent.type === 'community' && agent.id === 'concierge' && (
              <button
                onClick={() => handleCloneAgent(agent.id)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition-all duration-200"
              >
                <span>Clone</span>
                <PlusIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 mb-4 text-sm leading-relaxed">
          {agent.description}
        </p>

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-2">
          {agent.features.map((feature: string, featureIndex: number) => (
            <div key={featureIndex} className="flex items-center text-xs text-gray-600">
              <div className="w-1 h-1 bg-coral-500 rounded-full mr-2"></div>
              {feature}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-coral-50 to-brick-50 section-padding">
        <div className="container-max">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Automate Business Workflows Through Natural Language
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed mb-8">
              Easily build and deploy secure, compliant and custom AI agents—no code, no drag-and-drop
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => window.location.href = '/contact'}
                className="flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-coral-600 to-brick-600 text-white rounded-lg font-medium hover:from-coral-700 hover:to-brick-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Create Your Own Agent</span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Agent Features Grid */}
      <section className="section-padding">
        <div className="container-max">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our AI Agents?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Build with AI, set guardrails for product logic, security, and compliance. 
              Deploy with confidence on our scalable platform.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              {
                icon: UserGroupIcon,
                title: 'Custom AI',
                description: 'Personalized agents built for your specific business needs'
              },
              {
                icon: ChatBubbleLeftRightIcon,
                title: 'Natural Language',
                description: 'Create agents through conversation, not complex configurations'
              },
              {
                icon: LockClosedIcon,
                title: 'Security & Compliance',
                description: 'Enterprise-grade security built into every agent'
              },
              {
                icon: RocketLaunchIcon,
                title: 'One-Click Deploy',
                description: 'Deploy and scale your agents with confidence'
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100 text-center"
              >
                <feature.icon className="h-10 w-10 text-coral-600 mb-3 mx-auto" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Agents Section */}
      <section className="pt-2 pb-8">
        <div className="container-max">
          <div className="max-w-4xl mx-auto">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div>
                <div className="mb-4 p-3 bg-purple-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Community Agents</h3>
                  <p className="text-gray-600 text-sm">
                    Clone and customize these pre-built agents for your end to end business needs. 
                    Personalize agents with your own preferences, data and existing integrations.
                  </p>
                </div>
                {communityAgents.map((agent, index) => renderAgentCard(agent, index))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-coral-600 to-brick-600 text-white section-padding">
        <div className="container-max text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Build Your Own Agent?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Create custom AI agents that automate your business workflows. 
              No coding required—just describe what you need.
            </p>
            <button
              onClick={() => window.location.href = '/contact'}
              className="bg-white text-coral-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-colors duration-200 inline-block"
            >
              Start Building
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Agents; 