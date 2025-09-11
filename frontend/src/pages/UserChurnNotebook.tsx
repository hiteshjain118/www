import React from 'react';
import NotebookBase, { NotebookCell } from '../components/NotebookBase';

const UserChurnNotebook: React.FC = () => {
  const cells: NotebookCell[] = [
    {
      id: 'cell-1',
      type: 'markdown',
      content: '<h1>User Churn Predictor</h1><p>This notebook develops a machine learning model to predict user churn probability. The model is used to prioritize support tickets, allowing the customer success team to proactively reach out to at-risk customers.</p>'
    },
    {
      id: 'cell-2',
      type: 'code',
      content: `# Import required libraries
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import roc_auc_score

print("Machine learning libraries imported successfully")
print("Connecting to data sources...")`,
      output: `Machine learning libraries imported successfully
Connecting to data sources...
Connected to User Behavior Analytics (Events: 2.4M)
Connected to Support Ticket System (Tickets: 45K)
Connected to Billing Database (Customers: 12K)`,
      executionCount: 1,
      language: 'python'
    },
    {
      id: 'cell-3',
      type: 'code',
      content: `# Load and prepare customer data
behavior_data = load_user_behavior(days=30)
ticket_data = load_support_tickets(days=90) 
billing_data = load_billing_data()

print(f"Loaded behavior data for {len(behavior_data)} users")
print(f"Loaded {len(ticket_data)} support tickets")
print(f"Identified {len(churned_customers)} churned customers ( {len(churned_customers) / len(behavior_data) * 100:.2f}% churn rate)")`,
      output: `Loaded behavior data for 11,247 users
Loaded 8,934 support tickets
Identified 342 churned customers (3.0% churn rate)`,
      executionCount: 2,
      language: 'python'
    },
    {
      id: 'cell-4',
      type: 'markdown',
      content: '<h2>Model Training</h2><p>Train a Random Forest classifier to predict churn probability using behavioral features, support engagement patterns, and billing history.</p>'
    },
    {
      id: 'cell-5',
      type: 'code',
      content: `# Train churn prediction model
rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
rf_model.fit(X_train, y_train)

# Evaluate model performance
auc_score = roc_auc_score(y_test, y_pred_proba)
print(f"Model AUC Score: {auc_score:.3f}")
print("Feature importance ranking:")
print(f"1. days_since_last_login ({auc_score[0]:.3f})")
print(f"2. payment_failures ({auc_score[1]:.3f})")  
print(f"3. sentiment_score ({auc_score[2]:.3f})")
print(f"4. login_frequency ({auc_score[3]:.3f})")`,
      output: `Model AUC Score: 0.847
Feature importance ranking:
1. days_since_last_login (0.234)
2. payment_failures (0.187)
3. sentiment_score (0.156)
4. login_frequency (0.142)`,
      executionCount: 3,
      language: 'python'
    },
    {
      id: 'cell-6',
      type: 'markdown',
      content: '<h2>Ticket Prioritization System</h2><p>Deploy the model to enhance support ticket prioritization by identifying high-risk customers who need immediate attention.</p>'
    },
    {
      id: 'cell-7',
      type: 'code',
      content: `# Apply churn risk scoring to support tickets
sample_tickets = [
    {'ticket_id': 'T001', 'customer_id': 7834, 'priority': 7, 'issue': 'Login problems'},
    {'ticket_id': 'T002', 'customer_id': 1234, 'priority': 5, 'issue': 'Feature request'},
    {'ticket_id': 'T003', 'customer_id': 9201, 'priority': 6, 'issue': 'Billing inquiry'}
]

enhanced_tickets = enhance_ticket_priority(sample_tickets)
print("ENHANCED TICKET PRIORITIZATION")
print("Ticket  Customer  Risk   Enhanced  Issue")
print(f"T001    7834      {enhanced_tickets[0]['risk']:.2f}%  {enhanced_tickets[0]['enhanced']:.2f}      {enhanced_tickets[0]['issue']}") 
print(f"T003    9201      {enhanced_tickets[1]['risk']:.2f}%  {enhanced_tickets[1]['enhanced']:.2f}      {enhanced_tickets[1]['issue']}")
print(f"T002    1234      {enhanced_tickets[2]['risk']:.2f}%  {enhanced_tickets[2]['enhanced']:.2f}      {enhanced_tickets[2]['issue']}")
print()
print("High-risk customers moved to top priority!")`,
      output: `ENHANCED TICKET PRIORITIZATION
Ticket  Customer  Risk   Enhanced  Issue
T001    7834      89.2%  13.2      Login problems
T003    9201      85.7%  11.1      Billing inquiry
T002    1234      8.7%   5.4       Feature request

High-risk customers moved to top priority!`,
      executionCount: 4,
      language: 'python'
    }
  ];

  return (
    <NotebookBase
      title="User Churn Predictor"
      subtitle="ML model for predicting customer churn and prioritizing support tickets"
      cells={cells}
      onExecuteCell={(cellId) => {
        console.log(`Executing cell: ${cellId}`);
      }}
    />
  );
};

export default UserChurnNotebook; 