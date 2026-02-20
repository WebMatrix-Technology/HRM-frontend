'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import {
  Users,
  Clock,
  CalendarDays,
  WalletCards,
  Target,
  Briefcase,
  MessageSquare,
  LineChart,
  ArrowRight,
  ShieldCheck,
  Zap,
  LayoutDashboard
} from 'lucide-react';
import PublicHeader from '@/components/layout/PublicHeader';

export default function LandingPage() {
  const features = [
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Employee Management',
      description: 'Complete employee lifecycle management with profiles, documents, and role-based access control.',
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: 'Attendance Tracking',
      description: 'Track employee attendance with punch in/out, work from home support, and detailed reports.',
    },
    {
      icon: <CalendarDays className="w-6 h-6" />,
      title: 'Leave Management',
      description: 'Streamlined leave application, approval workflow, and balance tracking system.',
    },
    {
      icon: <WalletCards className="w-6 h-6" />,
      title: 'Payroll System',
      description: 'Automated payroll processing with dynamic salary calculations, deductions, and payslip generation.',
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: 'Performance Reviews',
      description: 'Comprehensive performance management with KPIs, goal setting, and feedback system.',
    },
    {
      icon: <Briefcase className="w-6 h-6" />,
      title: 'Recruitment',
      description: 'Manage job postings, applications, and interview scheduling all in one centralized place.',
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: 'Real-Time Chat',
      description: 'Built-in messaging system with one-to-one and group chat capabilities for seamless communication.',
    },
    {
      icon: <LineChart className="w-6 h-6" />,
      title: 'Analytics & Reports',
      description: 'Powerful reporting and analytics to make data-driven decisions and track company growth.',
    },
  ];

  const benefits = [
    {
      icon: <Zap className="w-8 h-8 text-amber-500" />,
      title: 'Streamlined Operations',
      description: 'Automate repetitive HR tasks and focus on what matters most - your people.',
    },
    {
      icon: <LineChart className="w-8 h-8 text-emerald-500" />,
      title: 'Real-Time Insights',
      description: 'Get instant visibility into attendance, performance, and payroll data.',
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-blue-500" />,
      title: 'Secure & Scalable',
      description: 'Built with enterprise-grade security in mind, scalable to grow with your organization.',
    },
    {
      icon: <LayoutDashboard className="w-8 h-8 text-purple-500" />,
      title: 'User-Friendly Interface',
      description: 'Intuitive modern design that requires minimal training for your team to master.',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-50 transition-colors duration-300 overflow-hidden font-sans">

      {/* Background Decorators */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 dark:bg-blue-600/20 blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] w-[30%] h-[30%] rounded-full bg-purple-500/10 dark:bg-purple-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 dark:bg-emerald-600/20 blur-[120px]" />
      </div>

      {/* Navigation */}
      <PublicHeader />

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 px-4 sm:px-6 lg:px-8">
        <motion.div
          className="max-w-5xl mx-auto text-center"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-sm font-semibold mb-8">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Next-Gen HR Platform
          </motion.div>

          <motion.h1 variants={itemVariants} className="text-6xl md:text-7xl font-extrabold tracking-tight mb-8">
            Supercharge Your <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
              Dev Agency Workforce
            </span>
          </motion.h1>

          <motion.p variants={itemVariants} className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            A comprehensive, AI-ready HRM solution designed specifically for modern web development agencies. Manage teams, track time, process payroll, and scale effortlessly.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/auth/login"
              className="group relative inline-flex h-14 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 font-medium text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105"
            >
              <span className="flex items-center gap-2 text-lg">
                Enter Dashboard
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <a
              href="#features"
              className="inline-flex h-14 items-center justify-center rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 px-8 font-medium text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-all hover:scale-105 shadow-sm"
            >
              <span className="text-lg">Explore Features</span>
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Built for Modern Teams</h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Everything you need to orchestrate your human resources efficiently from a single, beautiful dashboard.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5 }}
                className="group relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-8 border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-xl transition-all overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 rounded-full blur-2xl -mr-10 -mt-10 transition-opacity opacity-0 group-hover:opacity-100" />

                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium text-sm">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl font-bold mb-6">Why Agencies Trust Us</h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              The competitive advantage for your HR department.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex gap-6 items-start bg-white/40 dark:bg-slate-800/40 backdrop-blur-md rounded-2xl p-8 border border-white/20 dark:border-slate-700/50 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors"
              >
                <div className="flex-shrink-0 p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                  {benefit.icon}
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-3">{benefit.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 p-12 md:p-20 text-center shadow-2xl">
            {/* Pattern Overlay */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>

            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
                Ready to Upgrade Your HR Engine?
              </h2>
              <p className="text-xl md:text-2xl text-blue-100 mb-10 max-w-2xl mx-auto">
                Join elite web agencies that have already automated their human resource management.
              </p>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center h-16 px-10 rounded-xl bg-white text-slate-900 font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
              >
                Start Using WebMatrix Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-[#050812] text-slate-400 py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-6 text-white text-xl font-bold">
                <Users className="w-6 h-6 text-blue-500" />
                WebMatrix HRM
              </div>
              <p className="max-w-md leading-relaxed">
                The most advanced, beautifully designed Human Resource Management application tailored for tech teams and development agencies.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">Product</h4>
              <ul className="space-y-4">
                <li><a href="#features" className="hover:text-blue-400 transition-colors">Features</a></li>
                <li><Link href="/careers" className="hover:text-blue-400 transition-colors">Careers</Link></li>
                <li><Link href="/auth/login" className="hover:text-blue-400 transition-colors">Login</Link></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">Company</h4>
              <ul className="space-y-4">
                <li><a href="#" className="hover:text-blue-400 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p>&copy; {new Date().getFullYear()} WebMatrix HRM. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
