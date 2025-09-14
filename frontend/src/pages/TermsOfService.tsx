import React from 'react';
import { motion } from 'framer-motion';

const TermsOfService: React.FC = () => {
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
              Terms of{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-coral-600 to-brick-600">
                Service
              </span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              End User License Agreement (EULA) - Last updated: July 1, 2025
            </p>
          </motion.div>
        </div>
      </section>

      {/* Terms of Service Content */}
      <section className="section-padding">
        <div className="container-max max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="prose prose-lg max-w-none"
          >
            <div className="space-y-8">
              {/* Agreement */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Agreement to Terms</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  These Terms of Service ("Terms") constitute a legally binding agreement between you ("User," "you," or "your") and Coral Bricks AI ("Company," "we," "us," or "our") regarding your use of our artificial intelligence services, software, and related products (collectively, the "Services").
                </p>
                <p className="text-gray-600 leading-relaxed">
                  By accessing or using our Services, you agree to be bound by these Terms. If you disagree with any part of these Terms, you may not access or use our Services.
                </p>
              </section>

              {/* License Grant */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. License Grant</h2>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">2.1 Software License</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Subject to your compliance with these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to access and use our Services for your internal business purposes.
                </p>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-3">2.2 License Restrictions</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  You may not:
                </p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>Copy, modify, or create derivative works of our Services</li>
                  <li>Reverse engineer, decompile, or disassemble our software</li>
                  <li>Remove or alter any proprietary notices or labels</li>
                  <li>Use our Services for any illegal or unauthorized purpose</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Interfere with or disrupt the integrity of our Services</li>
                  <li>Transfer, sublicense, or assign your rights under these Terms</li>
                </ul>
              </section>

              {/* User Accounts */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  To access certain features of our Services, you may be required to create an account. You are responsible for:
                </p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>Maintaining the confidentiality of your account credentials</li>
                  <li>All activities that occur under your account</li>
                  <li>Providing accurate and complete information</li>
                  <li>Promptly updating your account information</li>
                  <li>Notifying us immediately of any unauthorized use</li>
                </ul>
              </section>

              {/* Acceptable Use */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Acceptable Use Policy</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  You agree to use our Services only for lawful purposes and in accordance with these Terms. You agree not to use our Services to:
                </p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe upon the rights of others</li>
                  <li>Transmit harmful, offensive, or inappropriate content</li>
                  <li>Attempt to interfere with or compromise our systems</li>
                  <li>Use our Services for competitive analysis or benchmarking</li>
                  <li>Generate content that promotes discrimination, harassment, or violence</li>
                  <li>Create or distribute malware or other harmful code</li>
                </ul>
              </section>

              {/* Intellectual Property */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Intellectual Property Rights</h2>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">5.1 Our Rights</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Our Services and all content, features, and functionality are owned by Coral Bricks AI and are protected by copyright, trademark, patent, trade secret, and other intellectual property laws.
                </p>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-3">5.2 Your Content</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  You retain ownership of any content you submit to our Services. By submitting content, you grant us a license to use, modify, and display such content solely for the purpose of providing our Services.
                </p>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-3">5.3 AI-Generated Content</h3>
                <p className="text-gray-600 leading-relaxed">
                  Content generated through our AI Services may be subject to specific licensing terms. You are responsible for ensuring that your use of AI-generated content complies with applicable laws and regulations.
                </p>
              </section>

              {/* Payment Terms */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Payment Terms</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Certain Services may require payment. By purchasing our Services, you agree to:
                </p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>Pay all fees in advance unless otherwise agreed</li>
                  <li>Provide accurate billing information</li>
                  <li>Authorize us to charge your payment method</li>
                  <li>Pay any applicable taxes</li>
                  <li>Not dispute charges for services actually received</li>
                </ul>
                <p className="text-gray-600 leading-relaxed mt-4">
                  All fees are non-refundable unless otherwise stated in our refund policy or required by law.
                </p>
              </section>

              {/* Data and Privacy */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data and Privacy</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  By using our Services, you consent to the collection and use of your information as described in our Privacy Policy.
                </p>
              </section>

              {/* Service Availability */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Service Availability</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  We strive to provide reliable and continuous access to our Services, but we do not guarantee uninterrupted availability. We may:
                </p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>Perform maintenance and updates that may temporarily affect service availability</li>
                  <li>Modify or discontinue features with reasonable notice</li>
                  <li>Suspend access for violations of these Terms</li>
                  <li>Limit usage to ensure fair access for all users</li>
                </ul>
              </section>

              {/* Disclaimers */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Disclaimers</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  OUR SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
                </p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>Warranties of merchantability and fitness for a particular purpose</li>
                  <li>Warranties that our Services will be error-free or uninterrupted</li>
                  <li>Warranties regarding the accuracy or reliability of AI-generated content</li>
                  <li>Warranties that defects will be corrected</li>
                </ul>
              </section>

              {/* Limitation of Liability */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Limitation of Liability</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, CORAL BRICKS AI SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
                </p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>Loss of profits, data, or business opportunities</li>
                  <li>Damages resulting from the use or inability to use our Services</li>
                  <li>Damages resulting from AI-generated content</li>
                  <li>Damages resulting from security breaches or data loss</li>
                </ul>
                <p className="text-gray-600 leading-relaxed mt-4">
                  OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT PAID BY YOU FOR THE SERVICES IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
                </p>
              </section>

              {/* Indemnification */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Indemnification</h2>
                <p className="text-gray-600 leading-relaxed">
                  You agree to indemnify, defend, and hold harmless Coral Bricks AI and its officers, directors, employees, and agents from and against any claims, damages, losses, and expenses arising from your use of our Services or violation of these Terms.
                </p>
              </section>

              {/* Termination */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Termination</h2>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">12.1 Termination by You</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  You may terminate your account at any time by contacting us or using the account deletion feature in our Services.
                </p>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-3">12.2 Termination by Us</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  We may terminate or suspend your access to our Services immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users or our business.
                </p>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-3">12.3 Effect of Termination</h3>
                <p className="text-gray-600 leading-relaxed">
                  Upon termination, your right to use our Services will cease immediately. We may delete your account and data in accordance with our data retention policies.
                </p>
              </section>

              {/* Governing Law */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Governing Law and Dispute Resolution</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  These Terms shall be governed by and construed in accordance with the laws of [Your State/Country], without regard to its conflict of law provisions.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  Any disputes arising from these Terms or your use of our Services shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.
                </p>
              </section>

              {/* Changes to Terms */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Changes to Terms</h2>
                <p className="text-gray-600 leading-relaxed">
                  We reserve the right to modify these Terms at any time. We will notify you of any material changes by posting the new Terms on our website and updating the "Last updated" date. Your continued use of our Services after such changes constitutes acceptance of the new Terms.
                </p>
              </section>

              {/* Contact Information */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Contact Information</h2>
                <p className="text-gray-600 leading-relaxed">
                  If you have any questions about these Terms of Service, please email us at{' '}
                              <a href="mailto:policy@coralbricks.com" className="text-coral-600 hover:text-coral-700 font-medium underline">
              policy@coralbricks.com
            </a>.
                </p>
              </section>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default TermsOfService; 