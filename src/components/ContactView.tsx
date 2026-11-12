import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, Globe, ArrowRight, Instagram } from 'lucide-react';
import LogoIcon from './LogoIcon';
import { useLanguage } from '../lib/LanguageContext';

export default function ContactView() {
  const { lang } = useLanguage();
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setName('');
      setEmail('');
      setMessage('');
    }, 1000);
  };

  return (
    <div className="space-y-8 pb-16 max-w-2xl mx-auto animate-fadeIn">
      
      {/* Intro descriptive header */}
      <section className="text-center space-y-2 py-4">
        <h1 className="font-display font-semibold text-2xl sm:text-3xl text-wood-950 tracking-tight">
          {lang === 'EN' ? "Get in Touch" : "Contactez-nous"}
        </h1>
        <p className="text-sm text-gray-500 max-w-xl mx-auto leading-relaxed font-sans">
          {lang === 'EN' 
            ? "Have questions about Canada's biodiversity data, our bias-corrected species models, or our regional campaigns? We would love to hear from you."
            : "Vous avez des questions sur les données de biodiversité du Canada, nos modèles d'espèces corrigés des biais, ou nos campagnes régionales ? Nous serions ravis de vous lire."}
        </p>
      </section>

      {/* Main Single Centered Form Box */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md shadow-gray-300">
        {submitted ? (
          <div className="text-center py-10 space-y-4 animate-fadeIn">
            <div className="w-16 h-16 bg-sage-50 text-sage-500 border border-sage-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="font-display font-semibold text-lg text-wood-950">
              {lang === 'EN' ? "Message Sent" : "Message envoyé"}
            </h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed font-sans">
              {lang === 'EN' 
                ? "Thank you for reaching out to us. A laboratory representative will reply shortly."
                : "Merci de nous avoir contactés. Un représentant du laboratoire vous répondra sous peu."}
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-4 text-xs text-sage-600 font-bold hover:text-sage-700 cursor-pointer underline flex items-center gap-1 mx-auto"
            >
              {lang === 'EN' ? "Send another message" : "Envoyer un autre message"} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name field */}
              <div className="space-y-1.5 font-sans">
                <label htmlFor="name-input" className="text-xs font-semibold text-gray-500">
                  {lang === 'EN' ? "Your Name" : "Votre nom"}
                </label>
                <input
                  id="name-input"
                  type="text"
                  placeholder={lang === 'EN' ? "e.g. John Gap" : "p. ex. John Gap"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sage-500 text-wood-700 font-sans"
                  required
                />
              </div>

              {/* Email field */}
              <div className="space-y-1.5 font-sans">
                <label htmlFor="email-input" className="text-xs font-semibold text-gray-500">
                  {lang === 'EN' ? "Email Address" : "Adresse courriel"}
                </label>
                <input
                  id="email-input"
                  type="email"
                  placeholder="john.gap@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sage-500 text-wood-700 font-sans"
                  required
                />
              </div>
            </div>

            {/* Email Contact Line Above the message text box */}
            <div className="pt-2 font-sans">
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1.5">
                {lang === 'EN' ? "Direct Inquiry Mail:" : "Courriel de contact direct :"}
              </span>
              <div className="flex items-center gap-2 text-xs font-medium text-sage-600 bg-sage-50/50 border border-sage-100/40 px-3.5 py-2.5 rounded-xl w-fit">
                <Mail className="w-4 h-4 text-sage-500 shrink-0" />
                <a href="mailto:blitzthegap@gmail.com" className="hover:underline hover:text-sage-700 transition-all font-semibold font-sans">
                  blitzthegap@gmail.com
                </a>
              </div>
            </div>

            {/* Message text block */}
            <div className="space-y-1.5 font-sans">
              <label htmlFor="message-input" className="text-xs font-semibold text-gray-500">
                {lang === 'EN' ? "Message & Proposal Details" : "Message et détails de la proposition"}
              </label>
              <textarea
                id="message-input"
                rows={4}
                placeholder={lang === 'EN' 
                  ? "Describe your research inquiry, spatial data requests, or biodiversity-blitz plan..."
                  : "Décrivez votre demande de recherche, vos demandes de données spatiales ou votre plan de bioblitz..."}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sage-500 text-wood-700 font-sans"
                required
              />
            </div>

            {/* Form submit button */}
            <button
              type="submit"
              className="w-full bg-sage-500 hover:bg-sage-600 text-white font-semibold text-xs py-3 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-widest"
            >
              <Send className="w-3.5 h-3.5" /> {lang === 'EN' ? "Send Message" : "Envoyer le message"}
            </button>
          </form>
        )}

        {/* Connect with our biodiversity network with hover indicators */}
        <div className="mt-8 pt-6 border-t border-gray-150 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-xs text-gray-500">
          <span className="font-medium text-wood-850 text-center sm:text-left">
            {lang === 'EN' ? "Connect with our biodiversity network:" : "Connectez-vous avec notre réseau de biodiversité :"}
          </span>
          <div className="flex items-center gap-3">
            {/* 1. Globe icon -> Quantitative Biodiversity Lab (qbiodiversity.org) */}
            <div className="relative group/tip flex flex-col items-center">
              <a 
                href="https://qbiodiversity.org/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 hover:border-sage-500 hover:bg-sage-50 text-gray-600 hover:text-sage-700 shadow-3xs flex items-center justify-center transition-all cursor-pointer"
                title="Quantitative Biodiversity Lab (qbiodiversity.org)"
                aria-label="Quantitative Biodiversity Lab Website"
              >
                <Globe className="w-5 h-5" />
              </a>
              <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-wood-900 px-2 py-1 text-[10px] font-sans font-medium text-white opacity-0 shadow-xs transition-opacity duration-200 group-hover/tip:opacity-100 z-30">
                Quantitative Biodiversity Lab (qbiodiversity.org)
              </span>
            </div>

            {/* 2. BTG Logo -> Blitz the Gap (blitzthegap.org) */}
            <div className="relative group/tip flex flex-col items-center">
              <a 
                href="https://blitzthegap.org"
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 hover:border-sage-500 hover:bg-sage-50 text-gray-600 hover:text-sage-700 shadow-3xs flex items-center justify-center transition-all cursor-pointer p-1.5"
                title="Blitz the Gap (blitzthegap.org)"
                aria-label="Blitz the Gap Website"
              >
                <LogoIcon className="w-6 h-6" />
              </a>
              <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-wood-900 px-2 py-1 text-[10px] font-sans font-medium text-white opacity-0 shadow-xs transition-opacity duration-200 group-hover/tip:opacity-100 z-30">
                Blitz the Gap (blitzthegap.org)
              </span>
            </div>

            {/* 3. Instagram -> Quantitative Biodiversity Lab Instagram */}
            <div className="relative group/tip flex flex-col items-center">
              <a 
                href="https://www.instagram.com/quantitativebiodiversitylab/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 hover:border-sage-500 hover:bg-sage-50 text-gray-600 hover:text-sage-700 shadow-3xs flex items-center justify-center transition-all cursor-pointer"
                title="Quantitative Biodiversity Lab Instagram (@quantitativebiodiversitylab)"
                aria-label="Quantitative Biodiversity Lab on Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-wood-900 px-2 py-1 text-[10px] font-sans font-medium text-white opacity-0 shadow-xs transition-opacity duration-200 group-hover/tip:opacity-100 z-30">
                Instagram (@quantitativebiodiversitylab)
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
