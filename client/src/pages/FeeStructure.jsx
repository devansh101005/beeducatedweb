import React from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
            Our Fee Structure
          </h1>
          <p className="text-gray-600 text-lg">
            Transparent and affordable pricing for quality education.
          </p>
        </div>

        {/* Fee Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {feeData.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                <h3 className="text-xl font-bold mb-1">{item.program}</h3>
                <p className="text-sm opacity-90">{item.subjects}</p>
              </div>

              {/* Pricing */}
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                  <div>
                    <div className="text-xl font-bold text-gray-800">₹{item.monthly}</div>
                    <div className="text-xs text-gray-500">Monthly</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-800">₹{item.quarterly}</div>
                    <div className="text-xs text-gray-500">Quarterly</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-800">₹{item.annually}</div>
                    <div className="text-xs text-gray-500">Annually</div>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-6">
                  {item.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-green-500 mt-0.5">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  to="/contact"
                  className="block w-full py-3 text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
                >
                  Enroll Now
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Policies */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mt-10">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            General Information & Policies
          </h3>
          <ul className="space-y-3 text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              A one-time registration fee of ₹1,000 is applicable for all new admissions.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              Fees are payable in advance, either monthly, quarterly, or annually.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              We offer a 5% discount on annual fee payments made in a single installment.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              A 10% sibling discount is available for the second child enrolled.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              Payment can be made via Cash, UPI, or Bank Transfer.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              Fees once paid are non-refundable. Please read the terms and conditions carefully during admission.
            </li>
          </ul>
          <p className="mt-6 text-gray-600">
            For any further queries regarding fees or the admission process, please{' '}
            <Link to="/contact" className="text-blue-600 hover:text-blue-700 font-medium">
              contact our office
            </Link>.
          </p>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default FeeStructure;
