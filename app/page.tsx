import Link from 'next/link';

export default function LandingPage() {
  const features = [
    {
      icon: '👤',
      title: 'Employee Management',
      description: 'Complete employee lifecycle management with profiles, documents, and role-based access control.',
    },
    {
      icon: '⏱',
      title: 'Attendance Tracking',
      description: 'Track employee attendance with punch in/out, work from home support, and detailed reports.',
    },
    {
      icon: '📝',
      title: 'Leave Management',
      description: 'Streamlined leave application, approval workflow, and balance tracking system.',
    },
    {
      icon: '💰',
      title: 'Payroll System',
      description: 'Automated payroll processing with salary calculations, deductions, and payslip generation.',
    },
    {
      icon: '🎯',
      title: 'Performance Reviews',
      description: 'Comprehensive performance management with KPIs, goal setting, and feedback system.',
    },
    {
      icon: '📄',
      title: 'Recruitment',
      description: 'Manage job postings, applications, and interview scheduling all in one place.',
    },
    {
      icon: '💬',
      title: 'Real-Time Chat',
      description: 'Built-in messaging system with one-to-one and group chat capabilities.',
    },
    {
      icon: '📊',
      title: 'Analytics & Reports',
      description: 'Powerful reporting and analytics to make data-driven decisions.',
    },
  ];

  const benefits = [
    {
      title: 'Streamlined Operations',
      description: 'Automate repetitive HR tasks and focus on what matters most - your people.',
    },
    {
      title: 'Real-Time Insights',
      description: 'Get instant visibility into attendance, performance, and payroll data.',
    },
    {
      title: 'Secure & Scalable',
      description: 'Built with security in mind, scalable to grow with your organization.',
    },
    {
      title: 'User-Friendly Interface',
      description: 'Intuitive design that requires minimal training for your team.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">HRM System</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/login"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/login"
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Streamline Your
              <span className="text-blue-600"> Human Resources</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              A comprehensive HRM solution designed for web development agencies. 
              Manage employees, track attendance, process payroll, and much more - all in one platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/login"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Get Started
              </Link>
              <a
                href="#features"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors border-2 border-blue-600 inline-block cursor-pointer"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to manage your human resources efficiently
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow border border-gray-200"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Our HRM System?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built specifically for modern web development agencies
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow"
              >
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">{benefit.title}</h3>
                <p className="text-gray-600 text-lg">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Transform Your HR Operations?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join forward-thinking agencies that have streamlined their HR processes
          </p>
          <Link
            href="/auth/login"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl"
          >
            Start Free Trial
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-white text-xl font-bold mb-4">HRM System</h3>
              <p className="text-sm">
                Comprehensive Human Resource Management solution for modern web development agencies.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#features" className="hover:text-white transition-colors cursor-pointer">
                    Features
                  </a>
                </li>
                <li>
                  <Link href="/auth/login" className="hover:text-white transition-colors">
                    Sign In
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <p className="text-sm">
                For support and inquiries, please contact your system administrator.
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} HRM System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
