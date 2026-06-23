import React from 'react';

// photos import
import ciara_photo from '../photos/ciara_raudsep.png';
import james_photo from '../photos/james_page.png';
import katherine_photo from '../photos/katherine_hebert.jpg';
import maho_photo from '../photos/maho_horikawa.png';
import peter_photo from '../photos/peter_soroye.png';
import ryan_photo from '../photos/ryan_hull.jpg';
import guillaume_photo from '../photos/guillaume_larocque.png';
import joseph_photo from '../photos/joseph_bowden.png';
import noah_photo from '../photos/noah_wightman.jpg';
import laura_photo from '../photos/laura_pollock.jpg';


const TreeDecorationLeft = () => (
  <div className="absolute left-[-220px] bottom-10 w-[170px] h-[550px] pointer-events-none opacity-10 hidden xl:block select-none">
    <svg viewBox="0 0 100 300" className="w-full h-full text-sage-750 fill-current">
      <path d="M 50 10 L 80 70 L 65 70 L 85 130 L 70 130 L 95 210 L 55 210 L 55 250 L 45 250 L 45 210 L 5 210 L 30 130 L 15 130 L 35 70 L 20 70 Z" />
      <path d="M 25 80 L 50 130 L 40 130 L 55 180 L 45 180 L 60 250 L 20 250 L 20 280 L 15 280 L 15 250 L 0 250 L 10 180 L 0 180 L 12 130 L 5 130 Z" opacity="0.75" />
      <path d="M 75 100 L 95 140 L 87 140 L 100 190 L 90 190 L 100 260 L 65 260 L 65 285 L 60 285 L 60 260 L 50 260 L 58 190 L 50 190 L 62 140 L 55 140 Z" opacity="0.65" />
    </svg>
  </div>
);

const TreeDecorationRight = () => (
  <div className="absolute right-[-220px] bottom-10 w-[170px] h-[550px] pointer-events-none opacity-10 hidden xl:block select-none">
    <svg viewBox="0 0 100 300" className="w-full h-full text-sage-750 fill-current transform scale-x-[-1]">
      <path d="M 50 15 L 78 75 L 63 75 L 83 135 L 68 135 L 93 215 L 55 215 L 55 255 L 45 255 L 45 215 L 7 215 L 32 135 L 17 135 L 37 75 L 22 75 Z" />
      <path d="M 25 90 L 48 140 L 38 140 L 53 190 L 43 190 L 58 260 L 20 260 L 20 290 L 15 290 L 15 260 L 2 260 L 12 190 L 2 190 L 14 140 L 7 140 Z" opacity="0.8" />
      <path d="M 75 80 L 95 125 L 87 125 L 100 175 L 90 175 L 100 245 L 65 245 L 65 275 L 60 275 L 60 245 L 50 245 L 58 175 L 50 175 L 62 125 L 55 125 Z" opacity="0.55" />
    </svg>
  </div>
);

// To link photos from src/pictures/ in the future without breaking build compilation now:
// 1. Place the image files inside `/src/pictures/`
// 2. Import them at the top of this file, e.g.:
//    import lauraPic from '../pictures/laura_pollock.jpg';
// 3. Replace the `photo: null` placeholder with your imported photo variable like `photo: lauraPic`

export default function AboutView() {
  const teamMembers = [
    { name: "Dr. Laura Pollock", role: "Principal Investigator", tag: "LP", photo: laura_photo},
    { name: "Katherine Hébert", role: "Postdoctoral Researcher", tag: "KH", photo: katherine_photo},
    { name: "Noah Wightman", role: "Software Developer", tag: "NW", photo: noah_photo},
    { name: "Ryan Hull", role: "Research Assistant", tag: "RH", photo: ryan_photo},
    { name: "Maho Horikawa", role: "Research Assistant", tag: "MH", photo: maho_photo}
  ];

  const partnersList = [
    { name: "Ciara Raudsepp-Hearne", organization: "WCS Canada", role: "Director of KBAs", tag: "MU", photo: ciara_photo},
    { name: "Peter Soroye", organization: "WCS Canada", role: "KBA Assessment and Outreach Coordinator", tag: "KBA", photo: peter_photo},
    { name: "Joseph Bowden", organization: "Natural Resources Canada", role: "Research Scientist", tag: "BCP", photo: joseph_photo},
    { name: "Guillaume Larocque", organization: "QCBS, GEOBON, Biodiversité Québec", role: "Research Professional", tag: "WCS", photo: guillaume_photo},
    { name: "James Pagé", organization: "Canadian Wildlife Federation", role: "Species at Risk and Biodiversity Specialist", tag: "Blah", james_photo}
    { name: "Wietze Sujiker", organization: "MILA", role: "Geospatial Data Engineer", tag: "iNAT", photo: null }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 animate-fadeIn relative overflow-visible">
      
      {/* Tree outlines framing the side margins on widescreen viewports */}
      <TreeDecorationLeft />
      <TreeDecorationRight />

      {/* Intro Header */}
      <section className="text-center space-y-3 py-6">
        <h1 className="font-display font-semibold text-3xl sm:text-4xl text-wood-950 tracking-tight">
          About openbiodiversity.ca
        </h1>
        <p className="text-base text-gray-650 max-w-2xl mx-auto leading-relaxed font-sans">
          Providing transparent, reproducible spatial indices to coordinate national responses to rapid climate and human-footprint change.
        </p>
      </section>

      {/* Main Philosophy & Scientific Vision */}
      <section className="bg-white border border-sage-100/80 rounded-2xl p-6 md:p-8 space-y-6 card-shadow">
        <div>
          <h2 className="font-display font-semibold text-xl text-wood-900">
            Scientific Vision
          </h2>
          <div className="h-[2px] bg-sage-100/60 w-16 mt-2 mb-4 rounded" />
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-sans">
            We are in the era of big data, big models and big threats. Every day we understand more about the biodiversity on the planet, and every day this biodiversity becomes more threatened. We approach this challenge from quantitative macro-ecological and biogeographical perspectives, developing next-generation models and predictive indicators to ground research in ecological reality and translate findings directly into actionable conservation solutions.
          </p>
        </div>
      </section>

      {/* Who We Are & Team Section */}
      <section className="bg-white border border-sage-100/80 rounded-2xl p-6 md:p-8 space-y-6 card-shadow">
        <div className="border-b border-gray-100 pb-4">
          <h3 className="font-display font-semibold text-2xl text-wood-950">
            Who We Are
          </h3>
        </div>

        {/* Quantitative Biodiversity Lab Logo & Edited About Text */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 bg-sage-50/40 p-5 rounded-2xl border border-sage-100/50">
          <div className="w-20 h-20 bg-white border border-sage-200/60 rounded-2xl shadow-3xs flex flex-col items-center justify-center shrink-0 p-1">
            <span className="font-mono text-[9px] font-bold text-gray-400 leading-tight">QUANT</span>
            <span className="font-display text-sm font-extrabold text-sage-600 leading-tight">BIODIV</span>
            <span className="font-mono text-[8px] text-gray-450 leading-tight uppercase tracking-widest mt-0.5">LAB</span>
          </div>
          
          <div className="text-center sm:text-left space-y-2">
            <h4 className="font-display font-bold text-base text-wood-950">
              Quantitative Biodiversity Lab &bull; McGill University
            </h4>
            <p className="text-xs text-gray-650 leading-relaxed font-sans">
              The Quantitative Biodiversity Lab is an academic research group at McGill University dedicated to understanding global biodiversity patterns and predicting spatial responses to environmental change. We develop cutting-edge macro-ecological models, map spatial networks, analyze geographical biases, and create reproducible indicators to help guide national-scale conservation programs across Canada's unique landscapes.
            </p>
          </div>
        </div>

        {/* Team Members */}
        <div className="pt-2">
          <h4 className="font-display font-semibold text-sm text-wood-850 mb-6 text-center sm:text-left">
            Research and Development Team:
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {teamMembers.map((member) => (
              <div key={member.name} className="flex flex-col items-center text-center space-y-3">
                <div className="relative w-18 h-18 rounded-full bg-sage-50 border border-sage-200/60 shadow-3xs flex items-center justify-center text-sage-600 overflow-hidden group hover:border-sage-500 hover:bg-sage-100/50 transition-all">
                  {member.photo ? (
                    <img
                      src={member.photo}
                      alt={member.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex flex-col items-center select-none">
                      <span className="font-display font-bold text-sm tracking-tight text-sage-800">
                        {member.tag}
                      </span>
                      <span className="text-[8px] text-sage-455 font-medium tracking-wider font-sans uppercase mt-0.5">photo</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-0.5">
                  <h5 className="font-display font-bold text-xs text-wood-950 leading-tight">{member.name}</h5>
                  <p className="text-[10px] text-gray-400 font-medium font-sans leading-tight">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Partners Section */}
      <section className="bg-white border border-sage-100/80 rounded-2xl p-6 md:p-8 space-y-6 card-shadow">
        <div className="border-b border-gray-100 pb-4">
          <h3 className="font-display font-semibold text-2xl text-wood-950">
            Our Partners
          </h3>
        </div>

        <p className="text-xs text-gray-500 max-w-2xl leading-relaxed font-sans">
          Achieving nationwide coverage relies on extensive cross-sector collaboration. We are proud to partner with leading academic bodies, provincial authorities, conservation consortia, and community-science networks to integrate spatial models and map observation gaps.
        </p>

        {/* Partners Logos / Representatives */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 pt-2">
          {partnersList.map((partner) => (
            <div key={partner.name} className="flex flex-col items-center text-center space-y-3 animate-fadeIn">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-150 shadow-3xs flex flex-col items-center justify-center text-gray-500 overflow-hidden group hover:border-sage-400 hover:bg-gray-100/50 transition-all">
                {partner.photo ? (
                  <img
                    src={partner.photo}
                    alt={partner.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex flex-col items-center select-none">
                    <span className="font-mono text-xs font-bold text-gray-450 select-none">{partner.tag}</span>
                    <span className="text-[8px] text-gray-400 font-medium tracking-wider font-sans uppercase mt-0.5">photo</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-0.5">
                <h5 className="font-display font-bold text-xs text-wood-950 leading-tight-1">{partner.name}</h5>
                <p className="text-[10px] text-sage-600 font-semibold font-sans leading-tight">{partner.organization}</p>
                <p className="text-[9px] text-gray-400 font-sans font-medium leading-tight">{partner.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
