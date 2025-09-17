import React from 'react';
import { Link } from 'react-router-dom';
import './FeeStructure.css';

const feeData = [
  {
    program: 'Class 9 - Foundation',
    subjects: 'Science (Phy, Chem, Bio), Mathematics, English',
    monthly: '2,000',
    quarterly: '5,500',
    annually: '20,000',
    features: [
      'Conceptual Clarity',
      'Regular Assessments',
      'Small Batch Size (15 Students)',
      'Comprehensive Study Material',
    ],
  },
  {
    program: 'Class 10 - Board Focus',
    subjects: 'Science (Phy, Chem, Bio), Mathematics, English',
    monthly: '2,500',
    quarterly: '7,000',
    annually: '25,000',
    features: [
      'Board Pattern Mock Tests',
      'Previous Year Paper Solving',
      '1-on-1 Doubt Sessions',
      'Personalized Feedback',
    ],
  },
  {
    program: 'Class 11 - Science',
    subjects: 'Physics, Chemistry, Maths / Biology',
    monthly: '3,500',
    quarterly: '10,000',
    annually: '38,000',
    features: [
      'In-depth Subject Knowledge',
      'Competitive Exam Foundation',
      'Practical & Lab Work Focus',
      'Experienced Faculty',
    ],
  },
  {
    program: 'Class 12 - Science',
    subjects: 'Physics, Chemistry, Maths / Biology',
    monthly: '4,000',
    quarterly: '11,500',
    annually: '42,000',
    features: [
      'Intensive Board Preparation',
      'Regular Mock Exams',
      'Career Guidance Sessions',
      'Proven Success Record',
    ],
  },
  {
    program: 'Personal Home Tutoring',
    subjects: 'Available for All Subjects (Classes 9-12)',
    monthly: 'Contact Us',
    quarterly: 'Contact Us',
    annually: 'Contact Us',
    features: [
      'One-on-One Attention',
      'Flexible Timings',
      'Customized Learning Plan',
      'At Your Convenience',
    ],
  },
];

const FeeStructure = () => {
  return (
    <div className="fee-structure-wrapper">
      <div className="container">
        {/* Header */}
        <div className="section-header" style={{ marginTop: '4rem', textAlign: 'center' }}>
          <h2>Our Fee Structure</h2>
          <p>Transparent and affordable pricing for quality education.</p>
        </div>

        {/* Fee Cards Grid */}
        <div className="fee-cards-grid">
          {feeData.map((item, index) => (
            <div key={index} className="fee-card">
              <div className="fee-card-header">
                <h3>{item.program}</h3>
                <p>{item.subjects}</p>
              </div>
              <div className="fee-card-body">
                <div className="fee-pricing">
                  <div>
                    <span className="price">₹{item.monthly}</span>
                    <span className="period">/ Monthly</span>
                  </div>
                  <div>
                    <span className="price">₹{item.quarterly}</span>
                    <span className="period">/ Quarterly</span>
                  </div>
                  <div>
                    <span className="price">₹{item.annually}</span>
                    <span className="period">/ Annually</span>
                  </div>
                </div>
                <ul className="fee-features">
                  {item.features.map((feature, i) => (
                    <li key={i}>✓ {feature}</li>
                  ))}
                </ul>
              </div>
              <div className="fee-card-footer">
                <Link to="/contact" className="btn-enroll">
                  Enroll Now
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Payment Policies Section */}
        <div className="payment-policies">
          <h3>General Information & Policies</h3>
          <ul>
            <li>A one-time registration fee of ₹1,000 is applicable for all new admissions.</li>
            <li>Fees are payable in advance, either monthly, quarterly, or annually.</li>
            <li>We offer a 5% discount on annual fee payments made in a single installment.</li>
            <li>A 10% sibling discount is available for the second child enrolled.</li>
            <li>Payment can be made via Cash, UPI, or Bank Transfer.</li>
            <li>Fees once paid are non-refundable. Please read the terms and conditions carefully during admission.</li>
          </ul>
          <p className="contact-enquiry">
            For any further queries regarding fees or the admission process, please{' '}
            <Link to="/contact">contact our office</Link>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FeeStructure;