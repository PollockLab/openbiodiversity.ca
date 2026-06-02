import React, { useState } from 'react';
import { Mail, Landmark, Send, CheckCircle2, Globe, FileText, ArrowRight } from 'lucide-react';

export default function ContactView() {
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
    <div className="space-y-8 pb-16 max-w-4xl mx-auto animate-fadeIn">
      
      {/* Intro descriptive header */}
      <section className="text-center space-y-2">
        <span className="bg-sage-50 text-sage-600 border border-sage-100 text-xs px-2.5 py-1 rounded-full font-mono font-bold tracking-wider">CONTACT PAGE</span>
        <h1 className="font-display font-semibold text-2xl sm:text-3xl text-wood-950 tracking-tight">
          Get in Touch
        </h1>
        <p className="text-sm text-gray-500 max-w-xl mx-auto leading-normal font-sans">
          Have questions about Canada's biodiversity data or our modelling framework? We would love to hear from you.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Detail column */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5 card-shadow">
            <h3 className="font-display font-semibold text-base text-wood-900 border-b border-gray-100 pb-2">
              Contact Channels
            </h3>
            
            <div className="space-y-4 text-xs font-sans text-gray-500">
              <div className="flex items-start gap-3">
                <Landmark className="w-5 h-5 text-sage-500 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-wood-900 block font-display">Quantitative Biodiversity Lab</strong>
                  <p className="mt-0.5 text-gray-400">Department of Biology, McGill University</p>
                  <p className="text-gray-400">Montreal, Quebec, Canada</p>
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-gray-100 pt-4">
                <Mail className="w-5 h-5 text-sage-500 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-wood-900 block font-display">Blitz the Gap Inquiries</strong>
                  <p className="mt-0.5 text-sage-600 font-semibold font-mono text-sm">blitzthegap.org</p>
                  <p className="text-gray-400">Please email us for campaigns & regional challenges.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-gray-100 pt-4">
                <Mail className="w-5 h-5 text-sage-500 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-wood-900 block font-display">Global Academic Inquiries</strong>
                  <p className="mt-0.5 font-mono text-sage-600">contact@openbiodiversity.ca</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 text-xs text-gray-500 leading-relaxed font-sans">
            <h4 className="font-semibold text-wood-900 flex items-center gap-1 font-display">
              <FileText className="w-4 h-4 text-sage-500" /> Data Licensing
            </h4>
            <p className="mt-1.5 leading-relaxed">
              Our layers and models are released under the CC BY 4.0 license. You do not need formal approval before integrating our GeoTIFF models into public policy or research projects, but we love seeing where our research goes!
            </p>
          </div>
        </div>

        {/* Right Side: Form column */}
        <div className="md:col-span-7">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 card-shadow">
            
            {submitted ? (
              <div className="text-center py-10 space-y-4 animate-fadeIn">
                <div className="w-16 h-16 bg-sage-50 text-sage-500 border border-sage-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="font-display font-semibold text-lg text-wood-950">
                  Message Sent
                </h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed font-sans">
                  Thank you for reaching out to us. A laboratory representative will reply shortly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-4 text-xs text-sage-600 font-bold hover:text-sage-700 cursor-pointer underline flex items-center gap-1 mx-auto"
                >
                  Send another message <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name field */}
                  <div className="space-y-1.5 font-sans">
                    <label htmlFor="name-input" className="text-xs font-semibold text-gray-500">
                      Your Name
                    </label>
                    <input
                      id="name-input"
                      type="text"
                      placeholder="e.g. Dr. Jane Smith"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sage-500 text-wood-700"
                      required
                    />
                  </div>

                  {/* Email field */}
                  <div className="space-y-1.5 font-sans">
                    <label htmlFor="email-input" className="text-xs font-semibold text-gray-500">
                      Email Address
                    </label>
                    <input
                      id="email-input"
                      type="email"
                      placeholder="e.g. jane.smith@mcgill.ca"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sage-500 text-wood-700"
                      required
                    />
                  </div>
                </div>

                {/* Message text block */}
                <div className="space-y-1.5 font-sans">
                  <label htmlFor="message-input" className="text-xs font-semibold text-gray-500">
                    Message
                  </label>
                  <textarea
                    id="message-input"
                    rows={4}
                    placeholder="Briefly state your spatial analysis targets or regional bioblitz plans..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sage-500 text-wood-700"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-sage-500 hover:bg-sage-600 text-white font-semibold text-xs py-3.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-widest"
                >
                  <Send className="w-3.5 h-3.5" /> Send Message
                </button>
              </form>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}
