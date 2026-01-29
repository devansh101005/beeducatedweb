import React from 'react';
import { FaLinkedin, FaGithub } from "react-icons/fa";
import { Target, Eye, Users, Heart, ArrowRight } from 'lucide-react'; // Added generic icons for UI polish
import Rishabh from "../assets/Rishabh.png";
import Saurabh from "../assets/Saurabh.png";
import Footer from '../components/Footer';

function About() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* Hero Section */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 pt-20 pb-16 text-center">
          <span className="inline-block py-1 px-3 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider mb-4 border border-blue-100">
            About Us
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6">
            Empowering the <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Future of Education
            </span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Discover our journey, our purpose, and the passionate individuals building the bridge between reliable tutors and eager learners.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16 space-y-20">
        
        {/* Our Story - Editorial Style */}
        <section className="grid md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-12 lg:col-span-8 lg:col-start-3 bg-white rounded-2xl p-8 md:p-10 shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="text-3xl">📖</span> Our Story
            </h2>
            <p className="text-slate-600 text-lg leading-relaxed">
              Be Educated Home Tutor began with a simple mission — to make quality tutoring accessible to every student across the country. We saw the struggles of students trying to find reliable tutors and the passion of tutors looking for the right learners. This platform was created to bridge that gap and build a community of trust.
            </p>
          </div>
        </section>

        {/* Vision & Mission - Modern Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="group bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Eye size={24} />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-slate-900">Our Vision</h2>
            <p className="text-slate-600 leading-relaxed">
              To empower students by connecting them with skilled and passionate tutors, fostering academic growth and confidence in a competitive world.
            </p>
          </div>

          <div className="group bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center text-pink-600 mb-6 group-hover:bg-pink-600 group-hover:text-white transition-colors">
              <Target size={24} />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-slate-900">Our Mission</h2>
            <p className="text-slate-600 leading-relaxed">
              We aim to simplify home tutoring through smart matchmaking, personalized support, and a trusted digital ecosystem where learning thrives.
            </p>
          </div>
        </div>

        {/* Founders Section */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">Meet the Founders</h2>
            <p className="text-slate-500 mt-2">The visionaries behind the platform</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Founder 1: Devansh (No Image Provided - Created Fallback) */}
            <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="h-32 bg-gradient-to-r from-slate-100 to-slate-200 w-full relative">
                <div className="absolute -bottom-12 left-8 p-1 bg-white rounded-full">
                   {/* Fallback Avatar since no image imported */}
                  <div className="w-24 h-24 rounded-full bg-slate-800 text-white flex items-center justify-center text-3xl font-bold">
                    DP
                  </div>
                </div>
              </div>
              <div className="pt-16 pb-8 px-8 flex-1 flex flex-col">
                <h3 className="text-2xl font-bold text-slate-900">Devansh Pandey</h3>
                <span className="text-blue-600 font-medium text-sm mb-4 block">Co-Founder & Tech Lead</span>
                <p className="text-slate-600 mb-6 flex-1">
                  A passionate developer and educator who envisioned a platform where education is not a privilege, but a right. Devansh combined his love for coding and community impact to launch Be Educated.
                </p>
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <a href="https://www.linkedin.com/in/devansh-pandey-a71667218/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-600 transition-colors">
                    <FaLinkedin size={24} />
                  </a>
                  <a href="https://github.com/devansh101005" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors">
                    <FaGithub size={24} />
                  </a>
                </div>
              </div>
            </div>

            {/* Founder 2: Rishabh */}
            <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="h-32 bg-gradient-to-r from-blue-50 to-indigo-50 w-full relative">
                 <div className="absolute -bottom-12 left-8 p-1 bg-white rounded-full">
                  <img src={Rishabh} alt="Rishabh Pandey" className="w-24 h-24 rounded-full object-cover" />
                </div>
              </div>
              <div className="pt-16 pb-8 px-8 flex-1 flex flex-col">
                <h3 className="text-2xl font-bold text-slate-900">Rishabh Pandey</h3>
                <span className="text-blue-600 font-medium text-sm mb-4 block">Founder</span>
                <p className="text-slate-600 mb-6 flex-1">
                   With a deep connection to his roots in Lalganj Ajhara, Pratapgarh, he started this journey to ensure that every child, regardless of their background, gets access to quality education.
                </p>
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <a href="https://www.linkedin.com/in/rishabh-pandey-6209542ba/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-600 transition-colors">
                    <FaLinkedin size={24} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section>
           <div className="flex items-center gap-4 mb-8">
             <div className="h-px bg-slate-200 flex-1"></div>
             <h2 className="text-xl font-bold text-slate-400 uppercase tracking-widest text-center">Core Team</h2>
             <div className="h-px bg-slate-200 flex-1"></div>
           </div>

           <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {/* Team Member 1 */}
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm text-center hover:border-blue-100 transition-colors">
              <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center text-slate-400">
                 <Users size={32} />
              </div>
              <h4 className="font-bold text-slate-900 text-lg">Manager</h4>
              <p className="text-slate-500 text-sm font-medium">Operations</p>
            </div>

            {/* Team Member 2 */}
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm text-center hover:border-blue-100 transition-colors">
              <img src={Saurabh} alt="Saurabh Pandey" className="w-20 h-20 rounded-full mx-auto mb-4 object-cover ring-2 ring-offset-2 ring-slate-100" />
              <h4 className="font-bold text-slate-900 text-lg">Saurabh Pandey</h4>
              <p className="text-slate-500 text-sm font-medium">Academic Director</p>
            </div>

            {/* Team Member 3 */}
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm text-center hover:border-blue-100 transition-colors">
               <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center text-slate-400">
                 <Users size={32} />
              </div>
              <h4 className="font-bold text-slate-900 text-lg">Aman Pandey</h4>
              <p className="text-slate-500 text-sm font-medium">Content Team Lead</p>
            </div>
          </div>
        </section>

      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default About;