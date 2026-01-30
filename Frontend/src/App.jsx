import React from 'react';
import Layout from './components/layout/Layout';
import Navbar from './components/layout/Navbar';
import Hero from './components/sections/Hero';
import TrustBar from './components/sections/TrustBar';
import LearnVerifyEarn from './components/sections/LearnVerifyEarn';
import SkillCIBIL from './components/sections/SkillCIBIL';
import Testimonials from './components/sections/Testimonials';
import CTA from './components/sections/CTA';
import Footer from './components/sections/Footer';

function App() {
  return (
    <Layout>
      <Navbar />
      <Hero />
      <TrustBar />
      <LearnVerifyEarn />
      <SkillCIBIL />
      <Testimonials />
      <CTA />
      <Footer />
    </Layout>
  );
}

export default App;
